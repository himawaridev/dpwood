const dns = require("dns").promises;
const net = require("net");

const MAX_IMAGE_BYTES = Number(process.env.IMAGE_PROXY_MAX_BYTES || 5 * 1024 * 1024);
const IMAGE_PROXY_TIMEOUT_MS = Number(process.env.IMAGE_PROXY_TIMEOUT_MS || 8000);
const MAX_REDIRECTS = 3;

const isPrivateIPv4 = (ip) => {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
    const [a, b] = parts;
    return (
        a === 10 ||
        a === 127 ||
        a === 0 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
    );
};

const isPrivateIPv6 = (ip) => {
    const normalized = ip.toLowerCase();
    const mappedIPv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappedIPv4) return isPrivateIPv4(mappedIPv4[1]);

    return (
        normalized === "::1" ||
        normalized === "::" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe80:")
    );
};

const isBlockedIp = (ip) => {
    const family = net.isIP(ip);
    if (family === 4) return isPrivateIPv4(ip);
    if (family === 6) return isPrivateIPv6(ip);
    return true;
};

const assertSafeImageUrl = async (value) => {
    let parsed;
    try {
        parsed = new URL(String(value || ""));
    } catch {
        const error = new Error("Invalid image URL");
        error.status = 400;
        throw error;
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
        const error = new Error("Invalid image URL protocol");
        error.status = 400;
        throw error;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (["localhost", "0.0.0.0"].includes(hostname) || hostname.endsWith(".localhost")) {
        const error = new Error("Image URL host is not allowed");
        error.status = 403;
        throw error;
    }

    if (net.isIP(hostname) && isBlockedIp(hostname)) {
        const error = new Error("Image URL host is not allowed");
        error.status = 403;
        throw error;
    }

    const addresses = await dns.lookup(hostname, { all: true, verbatim: false });
    if (!addresses.length || addresses.some((entry) => isBlockedIp(entry.address))) {
        const error = new Error("Image URL resolves to a private address");
        error.status = 403;
        throw error;
    }

    return parsed;
};

const fetchSafeImage = async (targetUrl, redirectCount = 0) => {
    if (redirectCount > MAX_REDIRECTS) {
        const error = new Error("Too many image redirects");
        error.status = 400;
        throw error;
    }

    const safeUrl = await assertSafeImageUrl(targetUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_PROXY_TIMEOUT_MS);

    try {
        const response = await fetch(safeUrl, {
            redirect: "manual",
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 DPWOOD Image Proxy",
                Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
        });

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get("location");
            if (!location) {
                const error = new Error("Invalid image redirect");
                error.status = 400;
                throw error;
            }
            return fetchSafeImage(new URL(location, safeUrl).toString(), redirectCount + 1);
        }

        if (!response.ok) {
            const error = new Error("Image source unavailable");
            error.status = 502;
            throw error;
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) {
            const error = new Error("URL is not an image");
            error.status = 415;
            throw error;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            const error = new Error("Image source unavailable");
            error.status = 502;
            throw error;
        }

        const chunks = [];
        let total = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > MAX_IMAGE_BYTES) {
                const error = new Error("Image is too large");
                error.status = 413;
                throw error;
            }
            chunks.push(Buffer.from(value));
        }

        return {
            contentType,
            buffer: Buffer.concat(chunks),
        };
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = {
    fetchSafeImage,
};
