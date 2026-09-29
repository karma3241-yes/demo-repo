// Short-lived TURN relay credentials for multiplayer (Cloudflare Realtime TURN, logins last 1 hour).
// Used by this site's own pages and by the CrazyGames build (its pages live on CrazyGames' domains, see PORTAL_ORIGIN).
// Set CF_TURN_KEY_ID and CF_TURN_API_TOKEN in the Vercel project; the tokens never reach the browser.
// Without them this answers 204 and the game falls back to its free public relay list.
//
// Spending cap: with CF_ACCOUNT_ID and CF_ANALYTICS_TOKEN (an Account Analytics: Read token) set, every request first
// checks this month's relay traffic (Cloudflare bills what the relay sends to players: 1000 GB a month free, then
// $0.05/GB). From TURN_CAP_GB (default 900) on, no more logins are handed out until the 1st of next month; players
// fall back to the free relays. If the usage check fails, no logins are handed out either, so an outage can't cost money.
// Logins already handed out keep working for up to an hour, which is why the cap sits below 1000.
// /api/turn?usage=1 shows this month's usage and the cap (numbers only), to check the setup.
//
// Scripts outside a browser can fake the Origin header; the 1-hour logins and the cap limit what a scraped one is worth.
// CrazyGames' origins (docs: resources/html5/sitelock): *.crazygames.com, its iOS app, and 1001juegos.com
const PORTAL_ORIGIN = /^(https:\/\/([a-z0-9-]+\.)*(crazygames\.com|1001juegos\.com)|capacitor:\/\/app\.crazygames\.com)$/;
const USAGE_TTL = 5 * 60e3;
let usageCache = { at: 0, gb: null, month: '' };

const allowedOrigin = req => {
  const site = req.headers['sec-fetch-site'], origin = req.headers.origin;
  if (origin && PORTAL_ORIGIN.test(origin)) return origin; // the CrazyGames build (cross-site by design)
  if (site && site !== 'same-origin') return null;
  if (origin) { try { return new URL(origin).host === req.headers.host ? origin : null; } catch (e) { return null; } }
  return 'same';
};

const capGB = () => { const n = +process.env.TURN_CAP_GB; return n > 0 ? n : 900; };
const capOn = () => !!(process.env.CF_ACCOUNT_ID && process.env.CF_ANALYTICS_TOKEN);

// this month's relay egress in GB (UTC calendar month, the way Cloudflare bills), cached for 5 minutes; null if unknown
async function usedGB() {
  const now = new Date(), month = now.toISOString().slice(0, 7);
  if (usageCache.month === month && usageCache.gb !== null && Date.now() - usageCache.at < USAGE_TTL) return usageCache.gb;
  const acct = String(process.env.CF_ACCOUNT_ID).trim();
  if (!/^[0-9a-f]{32}$/i.test(acct)) return null;
  const from = month + '-01', to = now.toISOString().slice(0, 10);
  const query = `{viewer{accounts(filter:{accountTag:"${acct}"}){callsTurnUsageAdaptiveGroups(filter:{date_geq:"${from}",date_leq:"${to}"},limit:1000){dimensions{keyId}sum{egressBytes}}}}}`;
  try {
    const r = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.CF_ANALYTICS_TOKEN.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }) });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.errors && d.errors.length) return null;
    const acc = d.data && d.data.viewer && d.data.viewer.accounts && d.data.viewer.accounts[0];
    const rows = acc && acc.callsTurnUsageAdaptiveGroups;
    if (!Array.isArray(rows)) return null;
    const gb = rows.reduce((s, x) => s + (+(x.sum && x.sum.egressBytes) || 0), 0) / 1e9;
    usageCache = { at: Date.now(), gb, month };
    return gb;
  } catch (e) { return null; }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const wantsUsage = /[?&]usage=1\b/.test(req.url || '');
  if (wantsUsage) { // opened directly in a browser tab to check the cap
    res.setHeader('Content-Type', 'application/json');
    const gb = capOn() ? await usedGB() : null;
    res.end(JSON.stringify({ cap: capOn() ? 'on' : 'off (set CF_ACCOUNT_ID and CF_ANALYTICS_TOKEN)', capGB: capGB(),
      usedGB: gb === null ? (capOn() ? 'unknown (check the account ID and token)' : null) : +gb.toFixed(3),
      relay: !(process.env.CF_TURN_KEY_ID && process.env.CF_TURN_API_TOKEN) ? 'off' : capOn() && (gb === null || gb >= capGB()) ? 'paused' : 'on' }));
    return;
  }
  const origin = allowedOrigin(req);
  if (!origin) { res.statusCode = 403; res.end(); return; }
  if (origin !== 'same') { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  const id = process.env.CF_TURN_KEY_ID, token = process.env.CF_TURN_API_TOKEN;
  if (!id || !token) { res.statusCode = 204; res.end(); return; }
  if (capOn()) { const gb = await usedGB(); if (gb === null || gb >= capGB()) { res.statusCode = 204; res.end(); return; } }
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/generate-ice-servers`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 3600 }) });
    if (!r.ok) { res.statusCode = 502; res.end(); return; }
    const d = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ iceServers: d.iceServers }));
  } catch (e) { res.statusCode = 502; res.end(); }
};
