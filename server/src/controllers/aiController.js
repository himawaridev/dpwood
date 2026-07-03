const { generateJson } = require("../services/geminiService");
const Product = require("../models/product");
const Blog = require("../models/blog");
const SupportTicket = require("../models/supportTicket");
const TicketMessage = require("../models/ticketMessage");
const User = require("../models/user");

const CATEGORY_VALUES = ["cookware", "tableware", "utensils", "storage", "appliances", "cleaning"];

const clampNumber = (value, min, max, fallback) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
};

const cleanText = (value, fallback = "") => String(value || fallback).trim();

const cleanBoolean = (value) => value === true || value === "true";

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
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const getProductImages = (product) => {
    const images = Array.isArray(product.images) ? product.images : [];
    return [product.imageUrl, ...images]
        .map((item) => cleanText(item))
        .filter((item) => /^https?:\/\//i.test(item));
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

const buildFallbackImageUrls = (searchText, limit = 4) => {
    const query = encodeURIComponent(buildImageSearchQuery(searchText) || "kitchenware");
    const seed = normalizeSearchText(searchText) || "kitchenware";
    const urls = [];

    for (let index = 0; index < limit; index += 1) {
        urls.push(`https://source.unsplash.com/900x900/?${query},kitchenware&sig=${index + 1}`);
    }

    for (let index = 0; urls.length < limit * 2; index += 1) {
        urls.push(`https://picsum.photos/seed/${encodeURIComponent(`${seed}-${index}`)}/900/900`);
    }

    return urls.slice(0, limit);
};

const searchOpenverseImages = async (searchText, limit = 6, sourceMode = "safe") => {
    const query = cleanText(searchText, "kitchenware").slice(0, 180);
    const params = new URLSearchParams({
        q: query,
        per_page: String(Math.min(Math.max(limit, 1), 20)),
    });
    if (sourceMode !== "broad") {
        params.set("license", "cc0,pdm");
    }

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

const getFreeResourceContext = async (searchText, imageLimit = 6, sourceMode = "safe") => {
    const [imagesResult, referencesResult] = await Promise.allSettled([
        searchOpenverseImages(searchText, imageLimit, sourceMode),
        searchWikipediaReferences(searchText, 3),
    ]);

    return {
        images: imagesResult.status === "fulfilled" ? imagesResult.value : [],
        references: referencesResult.status === "fulfilled" ? referencesResult.value : [],
    };
};

const mergeImageCandidates = async (searchText, limit = 6, useFreeResources = true, sourceMode = "safe") => {
    const freeResources = useFreeResources
        ? await getFreeResourceContext(searchText, limit, sourceMode)
        : { images: [], references: [] };
    const catalogImages = await getImageCandidatesFromCatalog(searchText, limit);
    const fallbackImages = sourceMode === "broad" ? buildFallbackImageUrls(searchText, limit) : [];
    const urls = [];

    for (const image of freeResources.images) {
        if (!urls.includes(image.url)) urls.push(image.url);
        if (urls.length >= limit) break;
    }

    for (const url of catalogImages) {
        if (!urls.includes(url)) urls.push(url);
        if (urls.length >= limit) break;
    }

    for (const url of fallbackImages) {
        if (!urls.includes(url)) urls.push(url);
        if (urls.length >= limit) break;
    }

    return { urls, resources: freeResources };
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
    const thumbnail = /^https?:\/\//i.test(cleanText(draft.thumbnail))
        ? cleanText(draft.thumbnail)
        : imageCandidates[0] || "";

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
    const images = aiImages.length ? aiImages : imageCandidates.slice(0, 4);

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
            [prompt, draft.title, draft.summary, draft.metaKeywords].join(" "),
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

        const imageResult = await mergeImageCandidates(prompt, Math.min(count * 3, 24), useFreeResources);
        const drafts = sanitizeBlogBatchDrafts(draftResponse, imageResult.urls).slice(0, count);

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
                images: imageResult.resources.images,
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
        const imageSourceMode = cleanText(req.body.imageSourceMode, "safe") === "broad" ? "broad" : "safe";

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

        const imageResult = await mergeImageCandidates(
            [
                prompt,
                draft.name,
                draft.description,
                draft.category,
                draft.material,
                draft.color,
                draft.brand,
                draft.capacity,
            ].join(" "),
            4,
            useFreeResources,
            imageSourceMode,
        );

        res.status(200).json({ draft: sanitizeProductDraft(draft, imageResult.urls), resources: imageResult.resources });
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
        const imageSourceMode = cleanText(req.body.imageSourceMode, "safe") === "broad" ? "broad" : "safe";
        const createMode = cleanText(req.body.createMode, "review") === "auto" ? "auto" : "review";

        const draftResponse = await generateJson({
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

        const imageResult = await mergeImageCandidates(
            prompt,
            Math.min(count * 4, 40),
            useFreeResources,
            imageSourceMode,
        );
        const drafts = sanitizeProductBatchDrafts(draftResponse, imageResult.urls).slice(0, count);

        if (!drafts.length) {
            const error = new Error("AI chua tao duoc danh sach san pham hop le");
            error.statusCode = 502;
            throw error;
        }

        if (createMode === "review") {
            return res.status(200).json({
                message: `AI da tao ${drafts.length} ban nhap san pham de duyet.`,
                products: drafts,
                created: false,
                resources: imageResult.resources,
            });
        }

        const createdProducts = await Product.bulkCreate(drafts);

        res.status(201).json({
            message: `AI da tao ${createdProducts.length} san pham moi.`,
            products: createdProducts,
            created: true,
            resources: imageResult.resources,
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
        const drafts = products.map((product) => sanitizeProductDraft(product)).filter((product) => product.name && product.price);

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
    createSupportChatReply,
    autoResolveSupportTickets,
};
