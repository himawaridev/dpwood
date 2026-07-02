const { generateJson } = require("../services/geminiService");
const Product = require("../models/product");

const CATEGORY_VALUES = ["cookware", "tableware", "utensils", "storage", "appliances", "cleaning"];

const clampNumber = (value, min, max, fallback) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
};

const cleanText = (value, fallback = "") => String(value || fallback).trim();

const cleanBoolean = (value) => value === true || value === "true";

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

const createBlogDraft = async (req, res) => {
    try {
        const prompt = ensurePrompt(req.body.prompt);
        const tone = cleanText(req.body.tone, "than thien, chuyen nghiep");

        const draft = await generateJson({
            systemInstruction:
                "You are an ecommerce content assistant for DPWOOD, a Vietnamese kitchenware store. Return only valid JSON. Write in natural Vietnamese UTF-8.",
            prompt: `
Tao ban nhap blog cho website thuong mai dien tu do gia dung nha bep DPWOOD.
Yeu cau cua admin: ${prompt}
Giong van: ${tone}

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

        const imageCandidates = await getImageCandidatesFromCatalog(
            [prompt, draft.title, draft.summary, draft.metaKeywords].join(" "),
            3,
        );

        res.status(200).json({ draft: sanitizeBlogDraft(draft, imageCandidates) });
    } catch (error) {
        console.error("createBlogDraft error:", error.message);
        res.status(error.statusCode || 500).json({ message: error.message || "Khong the tao nhap blog bang AI" });
    }
};

const createProductDraft = async (req, res) => {
    try {
        const prompt = ensurePrompt(req.body.prompt);

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

        const imageCandidates = await getImageCandidatesFromCatalog(
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
        );

        res.status(200).json({ draft: sanitizeProductDraft(draft, imageCandidates) });
    } catch (error) {
        console.error("createProductDraft error:", error.message);
        res.status(error.statusCode || 500).json({ message: error.message || "Khong the tao nhap san pham bang AI" });
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

module.exports = { createBlogDraft, createProductDraft, createSupportChatReply };
