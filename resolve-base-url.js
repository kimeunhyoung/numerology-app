function resolveAppBaseUrl() {
    const trimmed = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
    const vercelHost = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
    if (process.env.VERCEL === "1") {
        if (trimmed && /onrender\.com/i.test(trimmed)) {
            return vercelHost || trimmed;
        }
        if (trimmed) return trimmed;
        return vercelHost || "http://localhost:3000";
    }
    if (trimmed) return trimmed;
    if (vercelHost) return vercelHost;
    return "http://localhost:3000";
}

module.exports = { resolveAppBaseUrl };
