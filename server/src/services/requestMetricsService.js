const WINDOW_SIZE = 2000;
const samples = [];
const counters = new Map();

const recordRequest = ({ method, path, statusCode, durationMs }) => {
    const route = String(path || "/").split("?")[0].replace(/[0-9a-f-]{16,}/gi, ":id");
    const key = `${method} ${route} ${statusCode}`;
    counters.set(key, (counters.get(key) || 0) + 1);
    samples.push({ timestamp: Date.now(), method, route, statusCode, durationMs });
    if (samples.length > WINDOW_SIZE) samples.splice(0, samples.length - WINDOW_SIZE);
};

const percentile = (values, value) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))];
};

const snapshot = () => {
    const recent = samples.filter((sample) => sample.timestamp > Date.now() - 15 * 60 * 1000);
    const durations = recent.map((sample) => sample.durationMs);
    const errors = recent.filter((sample) => sample.statusCode >= 500);
    return {
        windowMinutes: 15,
        requests: recent.length,
        serverErrors: errors.length,
        errorRate: recent.length ? Number((errors.length / recent.length).toFixed(4)) : 0,
        p50Ms: percentile(durations, 0.5),
        p95Ms: percentile(durations, 0.95),
        slowRequests: recent
            .filter((sample) => sample.durationMs >= 1000)
            .sort((a, b) => b.durationMs - a.durationMs)
            .slice(0, 20),
        counters: Object.fromEntries(counters),
    };
};

const requestMetricsMiddleware = (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
        const durationMs = Number((process.hrtime.bigint() - startedAt) / 1000000n);
        recordRequest({
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
        });
    });
    next();
};

module.exports = { requestMetricsMiddleware, snapshot, recordRequest };
