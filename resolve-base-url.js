function vercelOriginFromEnv() {
    const deployment = process.env.VERCEL_URL;
    if (deployment) {
        return `https://${deployment.replace(/^https?:\/\//, "")}`;
    }
    const prod = (process.env.VERCEL_PROJECT_PRODUCTION_URL || "").replace(/\/$/, "");
    if (!prod) return "";
    return prod.startsWith("http") ? prod : `https://${prod}`;
}

function resolveAppBaseUrl() {
    const trimmed = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
    const vercelOrigin = vercelOriginFromEnv();

    if (process.env.VERCEL === "1") {
        if (trimmed && /onrender\.com/i.test(trimmed)) {
            return vercelOrigin || "http://localhost:3000";
        }
        if (trimmed) return trimmed;
        return vercelOrigin || "http://localhost:3000";
    }
    if (trimmed) return trimmed;
    if (vercelOrigin) return vercelOrigin;
    return "http://localhost:3000";
}

/**
 * QR/초대 링크용: 실제 브라우저가 연 호스트를 쓰면 env 실수(onrender 남음)와 무관하게 맞는 주소가 됨.
 */
function publicOriginFromRequest(req) {
    const rawProto = req.get("x-forwarded-proto") || req.protocol || "https";
    const proto = String(rawProto).split(",")[0].trim() || "https";
    const rawHost = req.get("x-forwarded-host") || req.get("host") || "";
    const host = String(rawHost).split(",")[0].trim();
    if (host) {
        return `${proto}://${host}`;
    }
    return resolveAppBaseUrl();
}

module.exports = { resolveAppBaseUrl, publicOriginFromRequest };
