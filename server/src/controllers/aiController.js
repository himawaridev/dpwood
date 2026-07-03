const { generateJson } = require("../services/geminiService");
const Product = require("../models/product");
const Blog = require("../models/blog");
const SupportTicket = require("../models/supportTicket");
const TicketMessage = require("../models/ticketMessage");
const User = require("../models/user");

const CATEGORY_VALUES = ["cookware", "tableware", "utensils", "storage", "appliances", "cleaning"];
const FALLBACK_PRODUCT_TEMPLATES = [
    { name: "Nồi inox 3 đáy", category: "cookware", price: 320000, stock: 120, material: "Inox 304" },
    { name: "Chảo chống dính đá", category: "cookware", price: 260000, stock: 150, material: "Hợp kim phủ đá" },
    { name: "Bộ bát đĩa sứ", category: "tableware", price: 480000, stock: 90, material: "Sứ cao cấp" },
    { name: "Dao bếp thép không gỉ", category: "utensils", price: 180000, stock: 180, material: "Thép không gỉ" },
    { name: "Thớt gỗ tự nhiên", category: "utensils", price: 150000, stock: 160, material: "Gỗ tự nhiên" },
    { name: "Hộp bảo quản thủy tinh", category: "storage", price: 95000, stock: 220, material: "Thủy tinh" },
    { name: "Bình đun siêu tốc", category: "appliances", price: 390000, stock: 80, material: "Inox" },
    { name: "Máy xay mini", category: "appliances", price: 520000, stock: 65, material: "Nhựa ABS" },
    { name: "Cọ rửa chén silicone", category: "cleaning", price: 45000, stock: 300, material: "Silicone" },
    { name: "Kệ chén inox", category: "storage", price: 360000, stock: 100, material: "Inox" },
];
const CATEGORY_IMAGE_KEYWORDS = {
    cookware: "cookware pot pan",
    tableware: "dinnerware bowl plate",
    utensils: "kitchen utensil cutting board",
    storage: "food storage container",
    appliances: "kitchen appliance",
    cleaning: "dishwashing brush",
};
const CATEGORY_IMAGE_FALLBACKS = {
    cookware: ["cookware set", "stainless steel cooking pot", "non stick frying pan"],
    tableware: ["dinnerware set", "ceramic bowl plate", "wooden serving tray"],
    utensils: ["kitchen utensils", "chef knife kitchen", "wooden cutting board", "wooden spoon"],
    storage: ["food storage container", "glass food jar", "kitchen storage"],
    appliances: ["small kitchen appliance", "electric kettle kitchen", "blender kitchen"],
    cleaning: ["kitchen cleaning supplies", "dishwashing brush", "dish soap bottle"],
};

const PRODUCT_IMAGE_KEYWORDS = [
    { pattern: /noi chien|air fryer/i, keyword: "air fryer kitchen" },
    { pattern: /may danh trung|egg beater|hand mixer/i, keyword: "electric hand mixer kitchen" },
    { pattern: /may xay sinh to|may xay|blender/i, keyword: "blender kitchen" },
    { pattern: /noi com|rice cooker/i, keyword: "rice cooker kitchen" },
    { pattern: /am dun|binh dun|kettle/i, keyword: "electric glass kettle kitchen" },
    { pattern: /nuoc rua chen|dish soap|dishwashing liquid/i, keyword: "dishwashing liquid bottle" },
    { pattern: /noi su|ceramic pot/i, keyword: "ceramic cooking pot" },
    { pattern: /noi|pot|cooker|ap suat/i, keyword: "stainless steel cooking pot" },
    { pattern: /chao|pan|non stick|chong dinh/i, keyword: "non stick frying pan" },
    { pattern: /bat trang/i, keyword: "vietnamese ceramic dinnerware set" },
    { pattern: /bat|dia|chen|bowl|plate/i, keyword: "ceramic dinnerware set" },
    { pattern: /dua|chopstick/i, keyword: "wooden chopsticks set" },
    { pattern: /muoi|thia go|wooden spoon/i, keyword: "wooden kitchen spoon set" },
    { pattern: /thia|dia inox|muong|fork|spoon|cutlery|flatware/i, keyword: "stainless steel cutlery set" },
    { pattern: /gia cam dao|ke dao|dao|knife/i, keyword: "chef knife kitchen set" },
    { pattern: /thot|cutting board/i, keyword: "wooden cutting board" },
    { pattern: /khay lot ly|coaster/i, keyword: "wooden drink coasters" },
    { pattern: /khay|tray/i, keyword: "wooden serving tray" },
    { pattern: /hop com|lunch box/i, keyword: "stainless steel lunch box" },
    { pattern: /hop|container|bao quan/i, keyword: "glass food storage container" },
    { pattern: /hu gia vi|lo gia vi|spice/i, keyword: "glass spice jar set" },
    { pattern: /ke chen|ke up bat|dish rack/i, keyword: "stainless steel dish rack" },
    { pattern: /co rua|brush|sponge/i, keyword: "dishwashing brush" },
    { pattern: /ly|cup|glass/i, keyword: "drinking glass cup" },
];
const BLOG_IMAGE_KEYWORDS = [
    { pattern: /may hut mui|hut mui|hood/i, keyword: "modern kitchen range hood" },
    { pattern: /may rua bat|dishwasher/i, keyword: "dishwasher in modern kitchen" },
    { pattern: /noi chien|air fryer/i, keyword: "air fryer on kitchen counter" },
    { pattern: /may xay sinh to|may xay|blender|smoothie/i, keyword: "kitchen blender smoothie maker on counter" },
    { pattern: /noi com|rice cooker/i, keyword: "rice cooker in modern kitchen" },
    { pattern: /noi inox|noi ap suat|cookware|noi|chao/i, keyword: "cookware set in modern kitchen" },
    { pattern: /bat dia|chen dia|tableware|dinnerware/i, keyword: "ceramic dinnerware table setting" },
    { pattern: /dao|thot|utensils|dung cu bep/i, keyword: "kitchen utensils cutting board" },
    { pattern: /hop bao quan|storage|bao quan/i, keyword: "glass food storage containers kitchen" },
    { pattern: /ve sinh|cleaning|khu mui/i, keyword: "clean organized kitchen counter" },
    { pattern: /go|noi that|ban an|tu bep/i, keyword: "wooden kitchen dining interior" },
    { pattern: /meo|kinh nghiem|huong dan|cach chon/i, keyword: "bright modern kitchen lifestyle" },
];

const clampNumber = (value, min, max, fallback) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
};

const cleanText = (value, fallback = "") => String(value || fallback).trim();

const cleanBoolean = (value) => value === true || value === "true";

const isGeneratedPlaceholderUrl = (url) => {
    const cleaned = cleanText(url).toLowerCase();
    return (
        !cleaned ||
        cleaned.includes("/api/ai/product-image-placeholder") ||
        cleaned.includes("product-image-placeholder?") ||
        cleaned.includes("placehold.co/") ||
        cleaned.includes("picsum.photos/")
    );
};

const generateSlug = (title) =>
    cleanText(title, "dpwood-ai-blog")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 140) || `dpwood-ai-blog-${Date.now()}`;

const buildUniqueBlogSlug = async (title, index = 0) => {
    const baseSlug = generateSlug(title);
    let slug = index ? `${baseSlug}-${index + 1}` : baseSlug;
    let suffix = 1;

    while (await Blog.findOne({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
    }

    return slug;
};

const normalizeSearchText = (value) =>
    cleanText(value)
        .toLowerCase()
        .replace(/[đĐ]/g, "d")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const getProductImages = (product) => {
    const images = Array.isArray(product.images) ? product.images : [];
    return [product.imageUrl, ...images]
        .map((item) => cleanText(item))
        .filter((item) => /^https?:\/\//i.test(item) && !isGeneratedPlaceholderUrl(unwrapImageProxyUrl(item)));
};

const getImageCandidatesFromCatalog = async (searchText, limit = 4) => {
    const products = await Product.findAll({
        attributes: [
            "name",
            "description",
            "imageUrl",
            "images",
            "category",
            "material",
            "color",
            "brand",
            "capacity",
        ],
        limit: 80,
        order: [["createdAt", "DESC"]],
    });

    const tokens = normalizeSearchText(searchText)
        .split(" ")
        .filter((token) => token.length >= 3);

    const scored = products
        .map((product) => {
            const haystack = normalizeSearchText(
                [
                    product.name,
                    product.description,
                    product.category,
                    product.material,
                    product.color,
                    product.brand,
                    product.capacity,
                ].join(" "),
            );
            const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
            return { product, score };
        })
        .filter((item) => item.score > 0 || tokens.length === 0)
        .sort((a, b) => b.score - a.score);

    const urls = [];
    for (const item of scored) {
        for (const url of getProductImages(item.product)) {
            if (!urls.includes(url)) urls.push(url);
            if (urls.length >= limit) return urls;
        }
    }

    return urls;
};

const isPublicImageUrl = (url) => /^https?:\/\//i.test(cleanText(url));

const buildImageSearchQuery = (searchText) =>
    cleanText(searchText, "kitchenware")
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180);

const buildFallbackImageUrls = (searchText, limit = 4, offset = 0) => {
    const query = encodeURIComponent(buildImageSearchQuery(searchText) || "kitchenware");
    const urls = [];

    for (let index = 0; index < limit; index += 1) {
        urls.push(`https://loremflickr.com/900/900/${query},kitchenware?lock=${offset * 31 + index + 1}`);
    }

    return urls.slice(0, limit);
};

const searchOpenverseImages = async (searchText, limit = 6) => {
    const query = cleanText(searchText, "kitchenware").slice(0, 180);
    const params = new URLSearchParams({
        q: query,
        per_page: String(Math.min(Math.max(limit, 1), 20)),
    });

    const response = await fetch(`https://api.openverse.org/v1/images/?${params.toString()}`, {
        headers: {
            "User-Agent": "DPWOOD/1.0 (https://dpwood.store)",
            Accept: "application/json",
        },
    });

    if (!response.ok) throw new Error(`Openverse image search failed: ${response.status}`);

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    return results
        .map((item) => ({
            url: cleanText(item.url),
            title: cleanText(item.title, "Openverse image").slice(0, 160),
            source: cleanText(item.source, "Openverse"),
            license: cleanText(item.license, "cc0").toUpperCase(),
            creator: cleanText(item.creator, "Unknown"),
            landingUrl: cleanText(item.foreign_landing_url),
        }))
        .filter((item) => isPublicImageUrl(item.url))
        .slice(0, limit);
};

const searchPexelsImages = async (searchText, limit = 8) => {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return [];

    const query = buildImageSearchQuery(searchText) || "kitchenware";
    const params = new URLSearchParams({
        query,
        per_page: String(Math.min(Math.max(limit, 1), 30)),
        locale: "vi-VN",
        orientation: "square",
    });

    const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
        headers: {
            Authorization: apiKey,
            Accept: "application/json",
        },
    });

    if (!response.ok) throw new Error(`Pexels image search failed: ${response.status}`);

    const data = await response.json();
    const photos = Array.isArray(data?.photos) ? data.photos : [];

    return photos
        .map((photo) => ({
            url: cleanText(photo?.src?.large2x || photo?.src?.large || photo?.src?.medium || photo?.src?.original),
            title: cleanText(photo?.alt, "Pexels image").slice(0, 160),
            source: "Pexels",
            license: "Pexels License",
            creator: cleanText(photo?.photographer, "Pexels"),
            landingUrl: cleanText(photo?.url),
        }))
        .filter((item) => isPublicImageUrl(item.url))
        .slice(0, limit);
};

const searchGoogleImages = async (searchText, limit = 8) => {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;
    if (!apiKey || !cx) return [];

    const query = buildImageSearchQuery(searchText) || "kitchenware";
    const params = new URLSearchParams({
        key: apiKey,
        cx,
        q: query,
        searchType: "image",
        num: String(Math.min(Math.max(limit, 1), 10)),
        imgSize: "large",
    });

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`, {
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) throw new Error(`Google image search failed: ${response.status}`);

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    return items
        .map((item) => ({
            url: cleanText(item.link),
            title: cleanText(item.title, "Google image").slice(0, 160),
            source: "Google Programmable Search",
            license: "Check source rights",
            creator: cleanText(item.displayLink, "Google"),
            landingUrl: cleanText(item.image?.contextLink || item.link),
        }))
        .filter((item) => isPublicImageUrl(item.url))
        .slice(0, limit);
};

const searchBingImages = async (searchText, limit = 8) => {
    const query = buildImageSearchQuery(searchText) || "kitchenware product";
    const params = new URLSearchParams({
        q: query,
        form: "HDRSC2",
        first: "1",
    });
    const response = await fetch(`https://www.bing.com/images/search?${params.toString()}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 DPWOOD Image Search",
            Accept: "text/html,application/xhtml+xml",
        },
    });

    if (!response.ok) throw new Error(`Bing image search failed: ${response.status}`);

    const html = await response.text();
    const results = [];
    const seen = new Set();
    const regex = /murl&quot;:&quot;(https?:\/\/[^&"]+)&quot;.*?t&quot;:&quot;([^&"]*)/g;
    let match;

    while ((match = regex.exec(html)) && results.length < limit * 2) {
        const url = cleanText(match[1]).replace(/\\u002f/g, "/");
        if (seen.has(url) || !isPublicImageUrl(url) || url.length >= 1500) continue;
        seen.add(url);
        results.push({
            url,
            title: cleanText(match[2], "Bing image").slice(0, 160),
            source: "Bing Images",
            license: "Check source rights",
            creator: "Bing",
            landingUrl: "",
        });
    }

    return results.slice(0, limit);
};

const searchWikimediaImages = async (searchText, limit = 8) => {
    const query = buildImageSearchQuery(searchText) || "kitchenware product";
    const params = new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: query,
        gsrnamespace: "6",
        gsrlimit: String(Math.min(Math.max(limit * 3, 5), 30)),
        prop: "imageinfo",
        iiprop: "url|mime",
        iiurlwidth: "900",
        format: "json",
        origin: "*",
    });

    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
        headers: {
            "User-Agent": "DPWOOD/1.0 (https://dpwood.store)",
            Accept: "application/json",
        },
    });

    if (!response.ok) throw new Error(`Wikimedia image search failed: ${response.status}`);

    const data = await response.json();
    const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

    return pages
        .map((page) => {
            const imageInfo = Array.isArray(page.imageinfo) ? page.imageinfo[0] : null;
            return {
                url: cleanText(imageInfo?.thumburl || imageInfo?.url),
                title: cleanText(page.title, "Wikimedia image").replace(/^File:/i, "").slice(0, 160),
                source: "Wikimedia Commons",
                license: "Check source rights",
                creator: "Wikimedia Commons",
                landingUrl: imageInfo?.descriptionurl || "",
                mime: cleanText(imageInfo?.mime),
            };
        })
        .filter(
            (item) =>
                isPublicImageUrl(item.url) &&
                item.url.length < 1500 &&
                item.mime.startsWith("image/") &&
                !/svg/i.test(item.mime) &&
                !/\.pdf/i.test(item.url) &&
                !/\.pdf/i.test(item.title) &&
                !/\/page\d+-/i.test(item.url),
        )
        .slice(0, limit);
};

const searchDuckDuckGoImages = async (searchText, limit = 8) => {
    const query = buildImageSearchQuery(searchText) || "kitchenware product photo";
    const homeUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const homeResponse = await fetch(homeUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 DPWOOD Image Search",
            Accept: "text/html,application/xhtml+xml",
        },
    });

    if (!homeResponse.ok) throw new Error(`DuckDuckGo image token failed: ${homeResponse.status}`);

    const html = await homeResponse.text();
    const vqd = html.match(/vqd=['"]?([^'"&]+)['"]?/)?.[1];
    if (!vqd) return [];

    const params = new URLSearchParams({
        l: "us-en",
        o: "json",
        q: query,
        vqd,
        f: ",,,,",
        p: "1",
    });
    const response = await fetch(`https://duckduckgo.com/i.js?${params.toString()}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 DPWOOD Image Search",
            Accept: "application/json",
            Referer: homeUrl,
        },
    });

    if (!response.ok) throw new Error(`DuckDuckGo image search failed: ${response.status}`);

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    return results
        .map((item) => ({
            url: cleanText(item.image),
            title: cleanText(item.title, "Web image").slice(0, 160),
            source: "DuckDuckGo Images",
            license: "Check source rights",
            creator: cleanText(item.source, "Web"),
            landingUrl: cleanText(item.url),
        }))
        .filter((item) => isPublicImageUrl(item.url) && item.url.length < 1500)
        .slice(0, limit);
};

const isReachableImageUrl = async (url) => {
    try {
        const response = await fetch(url, {
            redirect: "follow",
            signal: AbortSignal.timeout(6000),
            headers: {
                "User-Agent": "Mozilla/5.0 DPWOOD Image Check",
                Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
        });
        if (!response.ok) return false;
        const contentType = response.headers.get("content-type") || "";
        return contentType.startsWith("image/");
    } catch (_) {
        return false;
    }
};

const filterReachableImageUrls = async (urls, limit) => {
    const checks = await Promise.allSettled(urls.map((url) => isReachableImageUrl(url)));
    return urls.filter((url, index) => checks[index]?.status === "fulfilled" && checks[index].value).slice(0, limit);
};

const searchWikipediaReferences = async (searchText, limit = 3) => {
    const query = cleanText(searchText, "do gia dung nha bep").slice(0, 180);
    const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: query,
        srlimit: String(Math.min(Math.max(limit, 1), 5)),
        format: "json",
        utf8: "1",
        origin: "*",
    });

    const response = await fetch(`https://vi.wikipedia.org/w/api.php?${params.toString()}`, {
        headers: {
            "User-Agent": "DPWOOD/1.0 (https://dpwood.store)",
            Accept: "application/json",
        },
    });

    if (!response.ok) throw new Error(`Wikipedia search failed: ${response.status}`);

    const data = await response.json();
    const results = Array.isArray(data?.query?.search) ? data.query.search : [];

    return results.map((item) => ({
        title: cleanText(item.title).slice(0, 160),
        url: `https://vi.wikipedia.org/wiki/${encodeURIComponent(cleanText(item.title).replace(/\s/g, "_"))}`,
    }));
};

const getFreeResourceContext = async (searchText, imageLimit = 6) => {
    const [imagesResult, referencesResult] = await Promise.allSettled([
        searchOpenverseImages(searchText, imageLimit),
        searchWikipediaReferences(searchText, 3),
    ]);
    const webImageResults = await Promise.allSettled([
        searchDuckDuckGoImages(searchText, imageLimit),
        searchBingImages(searchText, imageLimit),
        searchGoogleImages(searchText, imageLimit),
        searchPexelsImages(searchText, imageLimit),
        searchWikimediaImages(searchText, imageLimit),
    ]);
    const duckDuckGoImages = webImageResults[0]?.status === "fulfilled" ? webImageResults[0].value : [];
    const bingImages = webImageResults[1]?.status === "fulfilled" ? webImageResults[1].value : [];
    const googleImages = webImageResults[2]?.status === "fulfilled" ? webImageResults[2].value : [];
    const pexelsImages = webImageResults[3]?.status === "fulfilled" ? webImageResults[3].value : [];
    const wikimediaImages = webImageResults[4]?.status === "fulfilled" ? webImageResults[4].value : [];
    const openverseImages = imagesResult.status === "fulfilled" ? imagesResult.value : [];

    return {
        images: [...duckDuckGoImages, ...bingImages, ...googleImages, ...pexelsImages, ...wikimediaImages, ...openverseImages],
        references: referencesResult.status === "fulfilled" ? referencesResult.value : [],
    };
};

const IMAGE_QUERY_STOPWORDS = new Set([
    "product",
    "photo",
    "kitchen",
    "set",
    "cao",
    "cap",
    "dpwood",
    "premium",
    "style",
]);

const getImageQueryTokens = (searchText) =>
    normalizeSearchText(searchText)
        .split(" ")
        .filter((token) => token.length >= 3 && !IMAGE_QUERY_STOPWORDS.has(token));

const scoreImageCandidate = (image, searchText) => {
    const tokens = getImageQueryTokens(searchText);
    if (!tokens.length) return 1;
    const haystack = normalizeSearchText([image.title, image.url, image.landingUrl, image.source].join(" "));
    return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
};

const sortImagesByQueryRelevance = (images, searchText) =>
    images
        .map((image, index) => ({ image, index, score: scoreImageCandidate(image, searchText) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((item) => item.image);

const mergeImageCandidates = async (searchText, limit = 6, useFreeResources = true, options = {}) => {
    const usedUrls = options.usedUrls || new Set();
    const offset = Number(options.offset || 0);
    const freeResources = useFreeResources
        ? await getFreeResourceContext(searchText, limit)
        : { images: [], references: [] };
    const catalogImages = await getImageCandidatesFromCatalog(searchText, limit);
    const urls = [];
    const pushCandidate = (url) => {
        const cleaned = unwrapImageProxyUrl(url);
        if (
            !/^https?:\/\//i.test(cleaned) ||
            cleaned.length >= 1500 ||
            isGeneratedPlaceholderUrl(cleaned) ||
            urls.includes(cleaned) ||
            usedUrls.has(cleaned)
        ) {
            return;
        }
        urls.push(cleaned);
    };

    for (const image of sortImagesByQueryRelevance(freeResources.images, searchText)) {
        pushCandidate(image.url);
        if (urls.length >= limit) break;
    }

    for (const url of catalogImages) {
        pushCandidate(url);
        if (urls.length >= limit) break;
    }

    let reachableUrls = await filterReachableImageUrls(urls, limit);

    if (!reachableUrls.length) {
        const fallbackUrls = buildFallbackImageUrls(searchText, limit, offset + 100).filter(
            (url) => !isGeneratedPlaceholderUrl(url),
        );
        reachableUrls = await filterReachableImageUrls(fallbackUrls, limit);
    }

    return { urls: reachableUrls, resources: freeResources };
};

const mergeImageCandidatesFromQueries = async (searchTexts, limit = 6, useFreeResources = true, options = {}) => {
    const queries = [...new Set([].concat(searchTexts).map((item) => cleanText(item)).filter(Boolean))];
    const resources = { images: [], references: [] };
    let lastResult = { urls: [], resources };

    for (const [index, query] of queries.entries()) {
        const result = await mergeImageCandidates(query, limit, useFreeResources, {
            ...options,
            offset: Number(options.offset || 0) + index * 17,
        });
        resources.images.push(...(result.resources?.images || []));
        resources.references.push(...(result.resources?.references || []));
        lastResult = { ...result, resources };
        if (result.urls.length) return lastResult;
    }

    return lastResult;
};

const getRequestBaseUrl = (req) => {
    const forwardedProto = cleanText(req.headers["x-forwarded-proto"]);
    const protocol = forwardedProto || req.protocol || "http";
    return `${protocol}://${req.get("host")}`;
};

const buildImageProxyUrl = (req, url) => {
    const cleaned = cleanText(url);
    if (!/^https?:\/\//i.test(cleaned)) return "";
    if (isGeneratedPlaceholderUrl(unwrapImageProxyUrl(cleaned))) return "";
    if (cleaned.includes("/api/ai/image-proxy?url=")) return cleaned;
    return `${getRequestBaseUrl(req)}/api/ai/image-proxy?url=${encodeURIComponent(cleaned)}`;
};

const unwrapImageProxyUrl = (url) => {
    const cleaned = cleanText(url);
    if (!cleaned.includes("/api/ai/image-proxy?url=")) return cleaned;

    try {
        const parsed = new URL(cleaned);
        return cleanText(parsed.searchParams.get("url"), cleaned);
    } catch (_) {
        const match = cleaned.match(/[?&]url=([^&]+)/);
        return match ? cleanText(decodeURIComponent(match[1]), cleaned) : cleaned;
    }
};

const normalizeProductImagesForStorage = (product) => {
    const images = Array.isArray(product.images)
        ? product.images
              .map((url) => unwrapImageProxyUrl(url))
              .filter((url) => /^https?:\/\//i.test(url) && !isGeneratedPlaceholderUrl(url))
        : [];
    const imageUrl = unwrapImageProxyUrl(product.imageUrl || images[0] || "");
    const variants = Array.isArray(product.variants)
        ? product.variants.map((variant) => ({
              ...variant,
              imageUrl: isGeneratedPlaceholderUrl(unwrapImageProxyUrl(variant.imageUrl))
                  ? ""
                  : unwrapImageProxyUrl(variant.imageUrl),
          }))
        : [];

    return {
        ...product,
        imageUrl: isGeneratedPlaceholderUrl(imageUrl) ? images[0] || "" : imageUrl,
        images,
        variants,
    };
};

const proxifyProductImages = (req, product, options = {}) => {
    const allowPlaceholder = options.allowPlaceholder === true;
    const images = Array.isArray(product.images) ? product.images : [];
    const proxiedImages = images
        .filter((url) => !isGeneratedPlaceholderUrl(unwrapImageProxyUrl(url)))
        .map((url) => buildImageProxyUrl(req, url))
        .filter(Boolean);
    const placeholderUrl = buildProductPlaceholderUrl(req, product.name, product.category);
    const variants = Array.isArray(product.variants)
        ? product.variants.map((variant) => ({
              ...variant,
              imageUrl:
                  buildImageProxyUrl(req, variant.imageUrl) ||
                  (!isGeneratedPlaceholderUrl(variant.imageUrl) ? variant.imageUrl : "") ||
                  (allowPlaceholder ? placeholderUrl : ""),
          }))
        : [];

    return {
        ...product,
        imageUrl:
            buildImageProxyUrl(req, product.imageUrl) ||
            proxiedImages[0] ||
            (allowPlaceholder ? placeholderUrl : ""),
        images: proxiedImages.length ? proxiedImages : allowPlaceholder ? [placeholderUrl] : [],
        variants,
    };
};

const proxifyProductListImages = (req, products) => products.map((product) => proxifyProductImages(req, product));

const buildProductPlaceholderUrl = (req, name, category = "kitchenware") => {
    const params = new URLSearchParams({
        name: cleanText(name, "DPWOOD"),
        category: cleanText(category, "kitchenware"),
    });
    return `${getRequestBaseUrl(req)}/api/ai/product-image-placeholder?${params.toString()}`;
};

const buildReferencePrompt = (references = []) => {
    if (!references.length) return "";
    return `Nguon tham khao mo co the dung de lay y tuong, khong sao chep nguyen van:\n${references
        .map((item, index) => `${index + 1}. ${item.title} - ${item.url}`)
        .join("\n")}`;
};

const buildReferenceHtml = (references = []) => {
    if (!references.length) return "";
    const links = references
        .map((item) => `<li><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a></li>`)
        .join("");
    return `<h2>Nguồn tham khảo mở</h2><ul>${links}</ul>`;
};

const ensurePrompt = (prompt) => {
    const cleaned = cleanText(prompt);
    if (cleaned.length < 8) {
        const error = new Error("Vui long nhap yeu cau chi tiet hon");
        error.statusCode = 400;
        throw error;
    }
    if (cleaned.length > 1400) {
        const error = new Error("Yeu cau qua dai, vui long rut gon duoi 1400 ky tu");
        error.statusCode = 400;
        throw error;
    }
    return cleaned;
};

const sanitizeChatMessages = (messages) => {
    if (!Array.isArray(messages)) return [];

    return messages
        .slice(-8)
        .map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: cleanText(message.content).slice(0, 900),
        }))
        .filter((message) => message.content);
};

const sensitiveSupportPattern = new RegExp(
    [
        "thanh toan",
        "payos",
        "chuyen khoan",
        "ngan hang",
        "hoan tien",
        "refund",
        "tien",
        "phi",
        "gia",
        "tai khoan ngan hang",
        "so dien thoai",
        "email",
        "dia chi",
        "ho ten",
        "mat khau",
        "password",
        "otp",
        "cccd",
        "cmnd",
        "thong tin ca nhan",
        "sua thong tin",
        "doi thong tin",
    ].join("|"),
    "i",
);

const normalizeVietnamese = (value) =>
    cleanText(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const isSensitiveSupportTicket = (ticket, messages = []) => {
    if (ticket.topic === "PAYMENT" || ticket.topic === "ACCOUNT") return true;
    const content = normalizeVietnamese(
        [ticket.topic, ticket.title, ticket.orderCode, ...messages.map((item) => item.message)].join(" "),
    );
    return sensitiveSupportPattern.test(content);
};

const sanitizeBlogDraft = (draft, imageCandidates = []) => {
    const thumbnail = imageCandidates[0] || (/^https?:\/\//i.test(cleanText(draft.thumbnail)) ? cleanText(draft.thumbnail) : "");

    return {
        title: cleanText(draft.title, "Bai viet moi tu DPWOOD").slice(0, 180),
        thumbnail,
        summary: cleanText(draft.summary).slice(0, 500),
        content: cleanText(draft.content, "<p>Noi dung dang duoc cap nhat.</p>"),
        author: cleanText(draft.author, "DPWOOD"),
        isPublished: false,
        metaTitle: cleanText(draft.metaTitle || draft.title).slice(0, 180),
        metaDescription: cleanText(draft.metaDescription || draft.summary).slice(0, 300),
        metaKeywords: Array.isArray(draft.metaKeywords)
            ? draft.metaKeywords.map((item) => cleanText(item)).filter(Boolean).join(", ")
            : cleanText(draft.metaKeywords),
    };
};

const sanitizeBlogBatchDrafts = (value, imageCandidates = []) => {
    const drafts = Array.isArray(value?.blogs) ? value.blogs : Array.isArray(value) ? value : [];

    return drafts.map((draft, index) => sanitizeBlogDraft(draft, imageCandidates.slice(index, index + 3)));
};

const sanitizeProductDraft = (draft, imageCandidates = []) => {
    const variants = Array.isArray(draft.variants)
        ? draft.variants.slice(0, 12).map((variant, index) => ({
              variantId: `ai-${Date.now()}-${index}`,
              color: cleanText(variant.color),
              size: cleanText(variant.size),
              price: clampNumber(variant.price, 0, 999999999, 0),
              stock: clampNumber(variant.stock, 0, 99999, 0),
              imageUrl: cleanText(variant.imageUrl),
          }))
        : [];

    const category = CATEGORY_VALUES.includes(draft.category) ? draft.category : "cookware";
    const aiImages = Array.isArray(draft.images)
        ? draft.images.map((item) => cleanText(item)).filter((item) => /^https?:\/\//i.test(item)).slice(0, 6)
        : [];
    const images = imageCandidates.length ? imageCandidates.slice(0, 4) : aiImages;

    return {
        name: cleanText(draft.name, "San pham nha bep moi").slice(0, 180),
        description: cleanText(draft.description),
        price: clampNumber(draft.price, 0, 999999999, 0),
        stock: variants.length
            ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
            : clampNumber(draft.stock, 0, 99999, 0),
        imageUrl: images[0] || "",
        images,
        variants,
        category,
        material: cleanText(draft.material),
        color: cleanText(draft.color),
        brand: cleanText(draft.brand, "DPWOOD Kitchen"),
        capacity: cleanText(draft.capacity),
        warranty: cleanText(draft.warranty, "12 thang"),
        origin: cleanText(draft.origin, "Viet Nam"),
        dishwasherSafe: cleanBoolean(draft.dishwasherSafe),
        microwaveSafe: cleanBoolean(draft.microwaveSafe),
    };
};

const sanitizeProductBatchDrafts = (value, imageCandidates = []) => {
    const drafts = Array.isArray(value?.products) ? value.products : Array.isArray(value) ? value : [];

    return drafts.map((draft, index) => sanitizeProductDraft(draft, imageCandidates.slice(index, index + 4)));
};

const buildFallbackProductDrafts = (prompt, count = 10) => {
    return Array.from({ length: count }, (_, index) => {
        const template = FALLBACK_PRODUCT_TEMPLATES[index % FALLBACK_PRODUCT_TEMPLATES.length];
        const suffix = index >= FALLBACK_PRODUCT_TEMPLATES.length ? ` ${Math.floor(index / FALLBACK_PRODUCT_TEMPLATES.length) + 1}` : "";
        const color = index % 3 === 0 ? "Trắng" : index % 3 === 1 ? "Đen" : "Hồng pastel";
        const size = index % 2 === 0 ? "Tiêu chuẩn" : "Cỡ lớn";
        const price = Math.round((template.price + index * 17000) / 1000) * 1000;
        const stock = Math.max(30, template.stock - index * 3);

        return {
            name: `${template.name}${suffix} DPWOOD`,
            description: `Sản phẩm ${template.name.toLowerCase()} phù hợp cho gian bếp gia đình. ${prompt ? `Gợi ý từ yêu cầu: ${prompt}.` : ""} Thiết kế thực dụng, dễ vệ sinh và dùng hằng ngày.`,
            price,
            stock,
            images: [],
            category: template.category,
            material: template.material,
            color,
            brand: "DPWOOD Kitchen",
            capacity: size,
            warranty: "12 tháng",
            origin: "Việt Nam",
            dishwasherSafe: ["tableware", "storage"].includes(template.category),
            microwaveSafe: template.category === "tableware" || template.category === "storage",
            variants: [
                { color, size: "Tiêu chuẩn", price, stock: Math.floor(stock / 2), imageUrl: "" },
                { color: color === "Trắng" ? "Đen" : "Trắng", size, price: price + 30000, stock: Math.ceil(stock / 2), imageUrl: "" },
            ],
        };
    });
};

const translateImageAttribute = (value) => {
    const normalized = normalizeSearchText(value);
    if (!normalized) return "";

    const dictionary = [
        { pattern: /ma vang|vang|gold/i, value: "gold" },
        { pattern: /hong|pink/i, value: "pink" },
        { pattern: /den|black/i, value: "black" },
        { pattern: /trang|white/i, value: "white" },
        { pattern: /bac|silver/i, value: "silver" },
        { pattern: /inox|stainless/i, value: "stainless steel" },
        { pattern: /go|wood|tre|bamboo/i, value: "wooden" },
        { pattern: /su|ceramic|porcelain/i, value: "ceramic" },
        { pattern: /thuy tinh|glass/i, value: "glass" },
        { pattern: /silicone/i, value: "silicone" },
        { pattern: /nhua|plastic/i, value: "plastic" },
        { pattern: /da|stone/i, value: "stone coating" },
    ];
    const matches = dictionary.filter((item) => item.pattern.test(normalized)).map((item) => item.value);
    return [...new Set(matches)].join(" ");
};

const findImageKeyword = (rules, primaryText, secondaryText = "") => {
    const primary = normalizeSearchText(primaryText);
    const secondary = normalizeSearchText(secondaryText);
    return (
        rules.find((item) => item.pattern.test(primary)) ||
        rules.find((item) => item.pattern.test(secondary)) ||
        null
    );
};

const buildBlogImageSearchText = (blog, basePrompt = "") => {
    const primaryText = [blog.title, blog.metaTitle].join(" ");
    const secondaryText = [blog.summary, blog.metaDescription, blog.metaKeywords, basePrompt].join(" ");
    const matched = findImageKeyword(BLOG_IMAGE_KEYWORDS, primaryText, secondaryText);
    const text = [primaryText, secondaryText].join(" ");
    const materialKeyword = translateImageAttribute(text);

    return [
        matched?.keyword || "modern kitchen lifestyle",
        materialKeyword,
        "high quality editorial photo",
    ]
        .filter(Boolean)
        .join(" ");
};

const enrichBlogDraftImages = async (drafts, basePrompt, useFreeResources) => {
    const enriched = [];
    const usedUrls = new Set();

    for (const [index, draft] of drafts.entries()) {
        const searchText = buildBlogImageSearchText(draft, basePrompt);
        const imageResult = await mergeImageCandidates(searchText, 3, useFreeResources, {
            usedUrls,
            offset: index,
        });
        const blogWithImage = sanitizeBlogDraft(draft, imageResult.urls);
        if (blogWithImage.thumbnail) usedUrls.add(blogWithImage.thumbnail);
        enriched.push(blogWithImage);
    }

    return enriched;
};

const buildProductImageSearchText = (product, basePrompt = "") => {
    const matched = findImageKeyword(
        PRODUCT_IMAGE_KEYWORDS,
        product.name,
        [product.description, product.material, product.color, product.capacity, basePrompt].join(" "),
    );
    const categoryKeyword = CATEGORY_IMAGE_KEYWORDS[product.category] || "kitchenware product";

    // Keep web image queries short and object-focused. Long queries like
    // "blender kitchen glass 1 5l" often return no free image results.
    return matched?.keyword || categoryKeyword;
};

const buildProductExactImageQuery = (product) =>
    buildImageSearchQuery(
        [
            product.name,
            product.material,
            product.capacity,
            "product photo",
        ]
            .join(" ")
            .replace(/\bDPWOOD\b/gi, "")
            .replace(/\b(cao cap|premium|kitchen|style|pro)\b/gi, ""),
    );

const buildProductImageSearchTexts = (product, basePrompt = "") => {
    const matched = findImageKeyword(
        PRODUCT_IMAGE_KEYWORDS,
        product.name,
        [product.description, product.material, product.color, product.capacity, basePrompt].join(" "),
    );
    const categoryKeyword = CATEGORY_IMAGE_KEYWORDS[product.category] || "kitchenware product";
    const categoryFallbacks = CATEGORY_IMAGE_FALLBACKS[product.category] || ["kitchenware product photo"];
    const materialKeyword = translateImageAttribute(product.material);
    const exactProductQuery = buildProductExactImageQuery(product);

    return [
        matched?.keyword,
        matched?.keyword ? `${matched.keyword} product photo` : "",
        [categoryKeyword, materialKeyword].filter(Boolean).join(" "),
        categoryKeyword,
        ...categoryFallbacks,
        exactProductQuery,
        "kitchenware product photo",
    ].filter(Boolean);
};

const enrichProductDraftImages = async (req, drafts, basePrompt, useFreeResources) => {
    const enriched = [];
    const usedUrls = new Set();

    for (const [index, draft] of drafts.entries()) {
        const searchTexts = buildProductImageSearchTexts(draft, basePrompt);
        const imageResult = await mergeImageCandidatesFromQueries(searchTexts, 5, useFreeResources, {
            usedUrls,
            offset: index,
        });
        const productWithImages = sanitizeProductDraft(draft, imageResult.urls);
        for (const url of productWithImages.images || []) {
            usedUrls.add(url);
        }
        enriched.push(proxifyProductImages(req, productWithImages));
    }

    return enriched;
};

const createBlogDraft = async (req, res) => {
    try {
        const prompt = ensurePrompt(req.body.prompt);
        const tone = cleanText(req.body.tone, "than thien, chuyen nghiep");
        const useFreeResources = req.body.useFreeResources !== false;
        const freeContext = useFreeResources ? await getFreeResourceContext(prompt, 4) : { images: [], references: [] };

        const draft = await generateJson({
            systemInstruction:
                "You are an ecommerce content assistant for DPWOOD, a Vietnamese kitchenware store. Return only valid JSON. Write in natural Vietnamese UTF-8.",
            prompt: `
Tao ban nhap blog cho website thuong mai dien tu do gia dung nha bep DPWOOD.
Yeu cau cua admin: ${prompt}
Giong van: ${tone}
${buildReferencePrompt(freeContext.references)}

Tra ve JSON voi dung cac truong:
{
  "title": "string",
  "summary": "string",
            "content": "HTML string with h2, p, ul/li when useful",
  "thumbnail": "leave empty if you do not have a real existing image URL",
  "author": "DPWOOD",
  "metaTitle": "string",
  "metaDescription": "string",
  "metaKeywords": ["string"]
}
Khong chen markdown, khong giai thich ngoai JSON.
            `,
        });

        const imageResult = await mergeImageCandidates(
            buildBlogImageSearchText(draft, prompt),
            3,
            useFreeResources,
        );
        const sanitizedDraft = sanitizeBlogDraft(draft, imageResult.urls);
        sanitizedDraft.content = `${sanitizedDraft.content}${buildReferenceHtml(freeContext.references)}`;

        res.status(200).json({
            draft: sanitizedDraft,
            resources: {
                images: imageResult.resources.images,
                references: freeContext.references,
            },
        });
    } catch (error) {
        console.error("createBlogDraft error:", error.message);
        res.status(error.statusCode || 500).json({ message: error.message || "Khong the tao nhap blog bang AI" });
    }
};

const createBlogBatch = async (req, res) => {
    try {
        const prompt = ensurePrompt(req.body.prompt);
        const tone = cleanText(req.body.tone, "than thien, chuyen nghiep");
        const count = clampNumber(req.body.count, 1, 20, 5);
        const publish = cleanBoolean(req.body.publish);
        const useFreeResources = req.body.useFreeResources !== false;
        const freeContext = useFreeResources ? await getFreeResourceContext(prompt, Math.min(count * 2, 20)) : { images: [], references: [] };

        const draftResponse = await generateJson({
            systemInstruction:
                "You are an ecommerce content operations assistant for DPWOOD, a Vietnamese kitchenware store. Return only valid JSON. Write natural Vietnamese UTF-8.",
            prompt: `
Tao ${count} ban nhap blog rieng biet cho website thuong mai dien tu do gia dung nha bep DPWOOD.
Chien dich/noi dung admin yeu cau: ${prompt}
Giong van: ${tone}
${buildReferencePrompt(freeContext.references)}

Moi bai can khac nhau ve goc tiep can, khong lap title.
Content la HTML ngan gon voi h2, p, ul/li khi huu ich. Khong dung markdown.

Tra ve JSON dung dang:
{
  "blogs": [
    {
      "title": "string",
      "summary": "string",
      "content": "HTML string",
      "thumbnail": "",
      "author": "DPWOOD AI",
      "metaTitle": "string",
      "metaDescription": "string",
      "metaKeywords": ["string"]
    }
  ]
}
Khong giai thich ngoai JSON.
            `,
            temperature: 0.75,
        });

        const rawDrafts = sanitizeBlogBatchDrafts(draftResponse).slice(0, count);
        const drafts = await enrichBlogDraftImages(rawDrafts, prompt, useFreeResources);

        if (!drafts.length) {
            const error = new Error("AI chua tao duoc danh sach blog hop le");
            error.statusCode = 502;
            throw error;
        }

        const createdBlogs = [];
        for (const [index, draft] of drafts.entries()) {
            const slug = await buildUniqueBlogSlug(draft.title, index);
            const blog = await Blog.create({
                title: draft.title,
                slug,
                thumbnail: draft.thumbnail,
                summary: draft.summary,
                content: `${draft.content}${buildReferenceHtml(freeContext.references)}`,
                author: draft.author || "DPWOOD AI",
                isPublished: publish,
                metaTitle: draft.metaTitle,
                metaDescription: draft.metaDescription,
                metaKeywords: draft.metaKeywords,
            });
            createdBlogs.push(blog);
        }

        res.status(201).json({
            message: `AI da tao ${createdBlogs.length} blog ${publish ? "cong khai" : "ban nhap"}.`,
            blogs: createdBlogs,
            resources: {
                images: drafts.map((draft) => draft.thumbnail).filter(Boolean),
                references: freeContext.references,
            },
        });
    } catch (error) {
        console.error("createBlogBatch error:", error.message);
        res.status(error.statusCode || 500).json({ message: error.message || "Khong the tao blog hang loat bang AI" });
    }
};

const createProductDraft = async (req, res) => {
    try {
        const prompt = ensurePrompt(req.body.prompt);
        const useFreeResources = req.body.useFreeResources !== false;

        const draft = await generateJson({
            systemInstruction:
                "You are an ecommerce merchandising assistant for DPWOOD, a Vietnamese kitchenware store. Return only valid JSON. Use realistic VND prices and inventory. Do not invent image URLs.",
            prompt: `
Tao ban nhap san pham do gia dung nha bep cho DPWOOD.
Yeu cau cua admin: ${prompt}

Category chi duoc chon 1 trong: ${CATEGORY_VALUES.join(", ")}.
Neu san pham co mau/kich co, tao variants doc lap de moi mau co the di voi nhieu kich co khi hop ly.
Tra ve JSON voi dung cac truong:
{
  "name": "string",
  "description": "string",
  "price": 0,
  "stock": 0,
  "images": [],
  "category": "cookware|tableware|utensils|storage|appliances|cleaning",
  "material": "string",
  "color": "string",
  "brand": "string",
  "capacity": "string",
  "warranty": "string",
  "origin": "string",
  "dishwasherSafe": false,
  "microwaveSafe": false,
  "variants": [
    { "color": "string", "size": "string", "price": 0, "stock": 0, "imageUrl": "" }
  ]
}
Khong chen markdown, khong giai thich ngoai JSON.
            `,
        });

        const sanitizedDraft = sanitizeProductDraft(draft);
        const imageResult = await mergeImageCandidatesFromQueries(
            buildProductImageSearchTexts(sanitizedDraft, prompt),
            5,
            useFreeResources,
        );

        res.status(200).json({
            draft: proxifyProductImages(req, sanitizeProductDraft(sanitizedDraft, imageResult.urls)),
            resources: imageResult.resources,
        });
    } catch (error) {
        console.error("createProductDraft error:", error.message);
        res.status(error.statusCode || 500).json({ message: error.message || "Khong the tao nhap san pham bang AI" });
    }
};

const createProductBatch = async (req, res) => {
    try {
        const prompt = ensurePrompt(req.body.prompt);
        const count = clampNumber(req.body.count, 1, 50, 10);
        const useFreeResources = req.body.useFreeResources !== false;
        const createMode = cleanText(req.body.createMode, "review") === "auto" ? "auto" : "review";

        let draftResponse;
        let usedLocalFallback = false;

        try {
            draftResponse = await generateJson({
                systemInstruction:
                    "You are an ecommerce merchandising operations assistant for DPWOOD, a Vietnamese kitchenware store. Return only valid JSON. Write natural Vietnamese UTF-8. Use realistic VND prices and inventory.",
                prompt: `
Tao ${count} san pham do gia dung nha bep cho DPWOOD.
Yeu cau cua admin: ${prompt}

Moi san pham phai khac nhau ve ten, gia, cong dung hoac phan loai.
Category chi duoc chon 1 trong: ${CATEGORY_VALUES.join(", ")}.
Neu san pham co mau/kich co, tao variants doc lap de moi mau co the di voi nhieu kich co khi hop ly.
Khong tu bia ra URL anh. Truong images co the de [] neu khong chac URL ton tai.

Tra ve JSON dung dang:
{
  "products": [
    {
      "name": "string",
      "description": "string",
      "price": 0,
      "stock": 0,
      "images": [],
      "category": "cookware|tableware|utensils|storage|appliances|cleaning",
      "material": "string",
      "color": "string",
      "brand": "string",
      "capacity": "string",
      "warranty": "string",
      "origin": "string",
      "dishwasherSafe": false,
      "microwaveSafe": false,
      "variants": [
        { "color": "string", "size": "string", "price": 0, "stock": 0, "imageUrl": "" }
      ]
    }
  ]
}
Khong giai thich ngoai JSON.
            `,
                temperature: 0.72,
            });
        } catch (error) {
            if (!error.isQuotaExceeded) throw error;
            usedLocalFallback = true;
            draftResponse = { products: buildFallbackProductDrafts(prompt, count) };
        }

        const rawDrafts = sanitizeProductBatchDrafts(draftResponse).slice(0, count);
        const drafts = await enrichProductDraftImages(req, rawDrafts, prompt, useFreeResources);

        if (!drafts.length) {
            const error = new Error("AI chua tao duoc danh sach san pham hop le");
            error.statusCode = 502;
            throw error;
        }

        if (createMode === "review") {
            return res.status(200).json({
                message: usedLocalFallback
                    ? `Gemini dang het quota, he thong da tao ${drafts.length} ban nhap noi bo de duyet.`
                    : `AI da tao ${drafts.length} ban nhap san pham de duyet.`,
                products: drafts,
                created: false,
                fallback: usedLocalFallback,
                resources: { images: [], references: [] },
            });
        }

        const createdProducts = await Product.bulkCreate(drafts.map(normalizeProductImagesForStorage));

        res.status(201).json({
            message: usedLocalFallback
                ? `Gemini dang het quota, he thong da tao ${createdProducts.length} san pham noi bo.`
                : `AI da tao ${createdProducts.length} san pham moi.`,
            products: createdProducts,
            created: true,
            fallback: usedLocalFallback,
            resources: { images: [], references: [] },
        });
    } catch (error) {
        console.error("createProductBatch error:", error.message);
        res.status(error.statusCode || 500).json({
            message: error.message || "Khong the tao san pham hang loat bang AI",
        });
    }
};

const saveProductBatchDrafts = async (req, res) => {
    try {
        const products = Array.isArray(req.body.products) ? req.body.products : [];
        const drafts = products
            .map((product) => normalizeProductImagesForStorage(sanitizeProductDraft(product)))
            .filter((product) => product.name && product.price);

        if (!drafts.length) {
            const error = new Error("Khong co san pham hop le de luu");
            error.statusCode = 400;
            throw error;
        }

        const createdProducts = await Product.bulkCreate(drafts);

        res.status(201).json({
            message: `Da luu ${createdProducts.length} san pham da duyet.`,
            products: createdProducts,
        });
    } catch (error) {
        console.error("saveProductBatchDrafts error:", error.message);
        res.status(error.statusCode || 500).json({
            message: error.message || "Khong the luu danh sach san pham da duyet",
        });
    }
};

const proxyImage = async (req, res) => {
    try {
        const targetUrl = cleanText(req.query.url);
        if (!/^https?:\/\//i.test(targetUrl)) {
            return res.status(400).send("Invalid image URL");
        }

        const response = await fetch(targetUrl, {
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 DPWOOD Image Proxy",
                Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            return res.status(502).send("Image source unavailable");
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) {
            return res.status(415).send("URL is not an image");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        res.status(200).send(buffer);
    } catch (error) {
        console.error("proxyImage error:", error.message);
        res.status(500).send("Cannot load image");
    }
};

const productImagePlaceholder = (req, res) => {
    const name = cleanText(req.query.name, "DPWOOD").slice(0, 70);
    const category = cleanText(req.query.category, "Kitchenware").slice(0, 36);
    const initials = normalizeSearchText(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("") || "DP";
    const safeName = name.replace(/[<>&"]/g, "");
    const safeCategory = category.replace(/[<>&"]/g, "");
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <rect width="900" height="900" fill="#f8f8f8"/>
  <rect x="42" y="42" width="816" height="816" fill="#ffffff" stroke="#f09b90" stroke-width="6"/>
  <circle cx="450" cy="330" r="138" fill="#f09b90" opacity="0.16"/>
  <text x="450" y="368" text-anchor="middle" font-family="Arial, sans-serif" font-size="118" font-weight="800" fill="#f09b90">${initials}</text>
  <text x="450" y="548" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#111111">DPWOOD</text>
  <text x="450" y="614" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#777777">${safeCategory}</text>
  <foreignObject x="110" y="660" width="680" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:32px;font-weight:700;color:#222;text-align:center;line-height:1.25;word-break:break-word;">${safeName}</div>
  </foreignObject>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.status(200).send(svg);
};

const createSupportChatReply = async (req, res) => {
    try {
        const messages = sanitizeChatMessages(req.body.messages);
        const prompt = ensurePrompt(req.body.prompt || messages[messages.length - 1]?.content);
        const conversation = messages
            .map((message) => `${message.role === "assistant" ? "AI" : "Khach hang"}: ${message.content}`)
            .join("\n");

        const draft = await generateJson({
            systemInstruction:
                "You are DPWOOD AI Support, a concise Vietnamese customer support assistant for an ecommerce kitchenware website. Return only valid JSON. Only answer questions related to DPWOOD website usage, products, kitchenware, cart, coupons, orders, payment, account, shipping, returns, and support. If the question is outside scope, politely redirect to DPWOOD support topics. Do not claim you can access private user data or real-time order status.",
            prompt: `
Hoi thoai gan day:
${conversation || `Khach hang: ${prompt}`}

Cau hoi moi: ${prompt}

Tra ve JSON:
{
  "answer": "Cau tra loi ngan gon, than thien, bang tieng Viet co dau. Neu can, huong dan tung buoc.",
  "suggestions": ["toi da 3 goi y cau hoi tiep theo"]
}
Khong chen markdown, khong giai thich ngoai JSON.
            `,
            temperature: 0.45,
        });

        const suggestions = Array.isArray(draft.suggestions)
            ? draft.suggestions.map((item) => cleanText(item).slice(0, 90)).filter(Boolean).slice(0, 3)
            : [];

        res.status(200).json({
            answer: cleanText(
                draft.answer,
                "Mình chưa có đủ thông tin để trả lời. Bạn có thể hỏi về sản phẩm, giỏ hàng, mã giảm giá, thanh toán hoặc đơn hàng trên DPWOOD.",
            ),
            suggestions,
        });
    } catch (error) {
        console.error("createSupportChatReply error:", error.message);
        res.status(error.statusCode || 500).json({
            message: error.message || "Khong the tao cau tra loi ho tro bang AI",
        });
    }
};

const autoResolveSupportTickets = async (req, res) => {
    try {
        const limit = clampNumber(req.body.limit, 1, 20, 5);
        const closeResolved = cleanBoolean(req.body.closeResolved);

        const tickets = await SupportTicket.findAll({
            where: { status: ["PENDING", "PROCESSING"] },
            include: [{ model: User, attributes: ["name", "email"] }],
            order: [["createdAt", "ASC"]],
            limit,
        });

        const handled = [];
        const skipped = [];

        for (const ticket of tickets) {
            const messages = await TicketMessage.findAll({
                where: { ticketId: ticket.id },
                order: [["createdAt", "ASC"]],
                limit: 8,
            });

            if (isSensitiveSupportTicket(ticket, messages)) {
                skipped.push({
                    id: ticket.id,
                    ticketCode: ticket.ticketCode,
                    title: ticket.title,
                    reason: "Ticket lien quan tien bac, thanh toan hoac thong tin ca nhan",
                });
                continue;
            }

            const conversation = messages
                .map((message) => `${message.isAdmin ? "Admin" : "Khach hang"}: ${message.message}`)
                .join("\n");

            const draft = await generateJson({
                systemInstruction:
                    "You are DPWOOD AI Support for an ecommerce kitchenware website. Return only valid JSON. You may resolve only safe operational questions. Do not handle payments, refunds, bank transfers, order money disputes, password/OTP, phone, email, address, identity, or personal data changes. If sensitive, say it must be handled by admin.",
                prompt: `
Ticket: ${ticket.ticketCode}
Chu de: ${ticket.topic}
Tieu de: ${ticket.title}
Ma don hang neu co: ${ticket.orderCode || "khong co"}
Hoi thoai:
${conversation}

Neu ticket an toan, viet cau tra loi ngan gon, lich su, bang tieng Viet co dau, huong dan tung buoc khi can.
Neu co dau hieu lien quan tien bac/thanh toan/hoan tien/sua thong tin ca nhan, tra ve shouldResolve=false.

Tra ve JSON:
{
  "shouldResolve": true,
  "answer": "string",
  "internalNote": "ly do ngan gon"
}
Khong giai thich ngoai JSON.
                `,
                temperature: 0.35,
            });

            if (draft.shouldResolve !== true) {
                skipped.push({
                    id: ticket.id,
                    ticketCode: ticket.ticketCode,
                    title: ticket.title,
                    reason: cleanText(draft.internalNote, "AI danh dau can admin xu ly"),
                });
                continue;
            }

            const answer = cleanText(draft.answer);
            if (answer.length < 20) {
                skipped.push({
                    id: ticket.id,
                    ticketCode: ticket.ticketCode,
                    title: ticket.title,
                    reason: "AI khong tao duoc cau tra loi du dai",
                });
                continue;
            }

            const aiMessage = await TicketMessage.create({
                ticketId: ticket.id,
                senderId: req.user.id,
                isAdmin: true,
                message: `${answer}\n\n--\nPhan hoi tu AI Support DPWOOD. Neu van can ho tro, ban co the phan hoi lai ticket nay de admin tiep tuc xu ly.`,
            });

            await ticket.update({ status: closeResolved ? "CLOSED" : "RESOLVED" });

            const io = req.app.get("io");
            if (io) io.emit("receive_message", aiMessage);

            handled.push({
                id: ticket.id,
                ticketCode: ticket.ticketCode,
                title: ticket.title,
                status: closeResolved ? "CLOSED" : "RESOLVED",
                answer,
            });
        }

        res.status(200).json({
            message: `AI da xu ly ${handled.length} ticket, bo qua ${skipped.length} ticket can admin.`,
            handled,
            skipped,
        });
    } catch (error) {
        console.error("autoResolveSupportTickets error:", error.message);
        res.status(error.statusCode || 500).json({
            message: error.message || "Khong the tu dong xu ly ticket ho tro bang AI",
        });
    }
};

module.exports = {
    createBlogDraft,
    createBlogBatch,
    createProductDraft,
    createProductBatch,
    saveProductBatchDrafts,
    proxyImage,
    productImagePlaceholder,
    createSupportChatReply,
    autoResolveSupportTickets,
};
