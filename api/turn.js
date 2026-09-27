// Short-lived TURN relay credentials for multiplayer (Cloudflare Realtime TURN, 1000 GB/month free).
// Set CF_TURN_KEY_ID and CF_TURN_API_TOKEN in the Vercel project; the token never reaches the browser.
// Without them this answers 204 and the game falls back to its public relay list.
// Game portals serve the game from their own domain, so those pages may ask for credentials too.
const PORTAL_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*crazygames\.com$/;
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const origin = req.headers && req.headers.origin;
  if (origin && PORTAL_ORIGIN.test(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  const id = process.env.CF_TURN_KEY_ID, token = process.env.CF_TURN_API_TOKEN;
  if (!id || !token) { res.statusCode = 204; res.end(); return; }
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/generate-ice-servers`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 }) });
    if (!r.ok) { res.statusCode = 502; res.end(); return; }
    const d = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ iceServers: d.iceServers }));
  } catch (e) { res.statusCode = 502; res.end(); }
};
