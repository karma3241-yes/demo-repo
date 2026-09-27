// Short-lived TURN relay credentials for multiplayer on this site (Cloudflare Realtime TURN, 1000 GB/month free, logins last 1 hour).
// The CrazyGames build never calls this: it only uses the free public relays.
// Set CF_TURN_KEY_ID and CF_TURN_API_TOKEN in the Vercel project; the token never reaches the browser.
// Without them this answers 204 and the game falls back to its public relay list.
// Only this site's own pages get logins: a request another website's page makes is refused (browsers would not let
// that page read the answer anyway). Scripts outside a browser can fake these headers; the 1-hour logins limit
// what a scraped one is worth, and a usage alert in Cloudflare catches anything bigger.
const sameSite = req => {
  const site = req.headers['sec-fetch-site'], origin = req.headers.origin;
  if (site && site !== 'same-origin') return false;
  if (origin) { try { return new URL(origin).host === req.headers.host; } catch (e) { return false; } }
  return true;
};
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!sameSite(req)) { res.statusCode = 403; res.end(); return; }
  const id = process.env.CF_TURN_KEY_ID, token = process.env.CF_TURN_API_TOKEN;
  if (!id || !token) { res.statusCode = 204; res.end(); return; }
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/generate-ice-servers`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 3600 }) });
    if (!r.ok) { res.statusCode = 502; res.end(); return; }
    const d = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ iceServers: d.iceServers }));
  } catch (e) { res.statusCode = 502; res.end(); }
};
