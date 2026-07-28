// Background service worker for ScamON AI Website Blocker (Manifest V3)

// Helper to extract domain name from a URL
function extractDomain(url) {
  try {
    if (!url) return null;
    const parsed = new URL(url);
    let domain = parsed.hostname;
    // Strip leading www.
    if (domain.startsWith("www.")) {
      domain = domain.substring(4);
    }
    return domain.split(':')[0]; // Remove port if present
  } catch (e) {
    return null;
  }
}

// Check if domain is blocked in MongoDB via FastAPI backend check APIs
async function checkDomainBlocked(domain) {
  // Query both Call Agent (8000) and Website Agent (8001) ports to be fully robust
  const ports = ["8001", "8000"];
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/api/websites/check?domain=${encodeURIComponent(domain)}`);
      if (response.ok) {
        const data = await response.json();
        return data; // Returns { blocked: true, reason, risk_score } or { blocked: false }
      }
    } catch (e) {
      console.warn(`[ScamON AI] Backend port ${port} offline or unreachable.`);
    }
  }
  return { blocked: false };
}

// Intercept navigations before they start loading
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Ignore frames, sub-resources, and non-http protocols
  if (details.frameId !== 0) return;
  if (!details.url.startsWith("http://") && !details.url.startsWith("https://")) return;

  const domain = extractDomain(details.url);
  if (!domain) return;

  // Bypass checking localhost
  if (domain === "localhost" || domain === "127.0.0.1") return;

  try {
    const result = await checkDomainBlocked(domain);
    if (result && result.blocked) {
      console.log(`[ScamON AI] Blocker intercepted domain: ${domain}. Reason: ${result.reason}`);
      
      // Redirect tab to the warning page
      const blockedUrl = chrome.runtime.getURL(
        `blocked.html?domain=${encodeURIComponent(domain)}` +
        `&reason=${encodeURIComponent(result.reason || "Phishing Website")}` +
        `&score=${encodeURIComponent(result.risk_score || 90)}` +
        `&url=${encodeURIComponent(details.url)}`
      );
      
      chrome.tabs.update(details.tabId, { url: blockedUrl });
    }
  } catch (err) {
    console.error("[ScamON AI] Blocker exception:", err);
  }
});
