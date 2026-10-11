// Until the domain exists, the Netlify test site is also opened through Cloudflare (cloudflare/worker.js),
// which is fast from Nigeria where Netlify's own address is slow. The worker passes this address along
// (header x-mimi-host) so the site can send people back to it, and forms sent from it are accepted.
export const cloudflareHost = "mimicrochet.sparrowishim.workers.dev";
