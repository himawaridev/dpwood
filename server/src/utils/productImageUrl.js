const LOCAL_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::1", "[::1]"]);

const cleanUrl = (value) => String(value || "").trim();

const isPlaceholderImageUrl = (value) => {
    const url = cleanUrl(value).toLowerCase();
    return (
        !url ||
        url.includes("/api/ai/product-image-placeholder") ||
        url.includes("product-image-placeholder?") ||
        url.includes("placehold.co/") ||
        url.includes("picsum.photos/")
    );
};

const isLocalHostname = (hostname) => {
    const normalized = cleanUrl(hostname).toLowerCase();
    return (
        LOCAL_HOSTNAMES.has(normalized) ||
        normalized.endsWith(".local") ||
        /^127\./.test(normalized) ||
        /^10\./.test(normalized) ||
        /^192\.168\./.test(normalized) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
    );
};

const unwrapImageProxyUrl = (value) => {
    const url = cleanUrl(value);
    if (!url.includes("/api/ai/image-proxy?url=")) return url;

    try {
        const parsed = new URL(url);
        return cleanUrl(parsed.searchParams.get("url")) || url;
    } catch (_) {
        const match = url.match(/[?&]url=([^&]+)/);
        if (!match) return url;
        try {
            return cleanUrl(decodeURIComponent(match[1])) || url;
        } catch (_) {
            return url;
        }
    }
};

const normalizeProductImageUrl = (value) => {
    const unwrapped = unwrapImageProxyUrl(value);
    if (isPlaceholderImageUrl(unwrapped)) return "";

    try {
        const parsed = new URL(unwrapped);
        if (!["http:", "https:"].includes(parsed.protocol) || isLocalHostname(parsed.hostname)) return "";
        if (parsed.protocol === "http:") parsed.protocol = "https:";
        return parsed.toString();
    } catch (_) {
        return "";
    }
};

const normalizeProductImageUrls = (values, options = {}) => {
    const excludedUrls = options.excludedUrls || new Set();
    const seen = new Set();

    return [].concat(values || []).reduce((urls, value) => {
        const url = normalizeProductImageUrl(value);
        if (!url || excludedUrls.has(url) || seen.has(url)) return urls;
        seen.add(url);
        urls.push(url);
        return urls;
    }, []);
};

const normalizeProductImagePayload = (product, options = {}) => {
    const source = product && typeof product === "object" ? product : {};
    const images = normalizeProductImageUrls([source.imageUrl, ...(Array.isArray(source.images) ? source.images : [])], options);
    const variants = Array.isArray(source.variants)
        ? source.variants.map((variant) => ({
              ...variant,
              imageUrl: normalizeProductImageUrl(variant?.imageUrl),
          }))
        : [];

    return {
        ...source,
        imageUrl: images[0] || "",
        images,
        variants,
    };
};

module.exports = {
    isPlaceholderImageUrl,
    normalizeProductImagePayload,
    normalizeProductImageUrl,
    normalizeProductImageUrls,
    unwrapImageProxyUrl,
};
