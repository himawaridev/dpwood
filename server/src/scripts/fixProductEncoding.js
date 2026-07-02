require("dotenv").config();

const { sequelize } = require("../config/connectSequelize");
const Product = require("../models/product");

const cp1252ToByte = new Map([
    [0x20ac, 0x80],
    [0x201a, 0x82],
    [0x0192, 0x83],
    [0x201e, 0x84],
    [0x2026, 0x85],
    [0x2020, 0x86],
    [0x2021, 0x87],
    [0x02c6, 0x88],
    [0x2030, 0x89],
    [0x0160, 0x8a],
    [0x2039, 0x8b],
    [0x0152, 0x8c],
    [0x017d, 0x8e],
    [0x2018, 0x91],
    [0x2019, 0x92],
    [0x201c, 0x93],
    [0x201d, 0x94],
    [0x2022, 0x95],
    [0x2013, 0x96],
    [0x2014, 0x97],
    [0x02dc, 0x98],
    [0x2122, 0x99],
    [0x0161, 0x9a],
    [0x203a, 0x9b],
    [0x0153, 0x9c],
    [0x017e, 0x9e],
    [0x0178, 0x9f],
]);

const mojibakeCodes = new Set([
    0x00c2,
    0x00c3,
    0x00c4,
    0x00ba,
    0x00bb,
    0x2018,
    0x2019,
    0x201c,
    0x201d,
    0x2122,
]);

const hasMojibake = (value) =>
    typeof value === "string" && [...value].some((char) => mojibakeCodes.has(char.codePointAt(0)));

const encodeWindows1252 = (value) =>
    Buffer.from(
        [...value].map((char) => {
            const code = char.codePointAt(0);
            if (code <= 0xff) return code;
            return cp1252ToByte.get(code) || 0x3f;
        }),
    );

const fixText = (value) => {
    if (!hasMojibake(value)) return value;

    const fixedValue = encodeWindows1252(value).toString("utf8");
    return fixedValue.includes("\uFFFD") ? value : fixedValue;
};

const fixDeep = (value) => {
    if (typeof value === "string") return fixText(value);
    if (Array.isArray(value)) return value.map(fixDeep);
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, fixDeep(entry)]));
    }
    return value;
};

const fieldsToFix = [
    "name",
    "description",
    "material",
    "color",
    "brand",
    "capacity",
    "warranty",
    "origin",
    "variants",
];

const imageByCategory = {
    cookware: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=900&q=80",
    tableware: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=900&q=80",
    utensils: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
    storage: "https://images.unsplash.com/photo-1606914469633-bd39206ea739?auto=format&fit=crop&w=900&q=80",
    appliances: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80",
    cleaning: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=900&q=80",
};

const isBrokenImageUrl = (value) =>
    typeof value === "string" &&
    (value.includes("4kwallpapers.com") ||
        value.includes("thumbs_2t") ||
        value.includes("photo-1584990347449-a89291d7b127"));

const fixImageUrl = (product, value) => {
    if (!isBrokenImageUrl(value)) return value;
    return imageByCategory[product.category] || imageByCategory.cookware;
};

const fixImages = (product, value) => {
    if (!Array.isArray(value)) return value;
    return value.map((imageUrl) => fixImageUrl(product, imageUrl));
};

const fixVariantImages = (product, value) => {
    if (!Array.isArray(value)) return value;

    return value.map((variant) => {
        if (!variant || typeof variant !== "object") return variant;
        return {
            ...variant,
            imageUrl: fixImageUrl(product, variant.imageUrl),
        };
    });
};

async function fixProductEncoding() {
    await sequelize.authenticate();

    const products = await Product.findAll();
    let changedCount = 0;

    for (const product of products) {
        const updates = {};

        fieldsToFix.forEach((field) => {
            const originalValue = product.get(field);
            const fixedValue = fixDeep(originalValue);

            if (JSON.stringify(originalValue) !== JSON.stringify(fixedValue)) {
                updates[field] = fixedValue;
            }
        });

        const fixedImageUrl = fixImageUrl(product, product.imageUrl);
        const fixedImages = fixImages(product, product.images);
        const fixedVariants = fixVariantImages(product, updates.variants || product.variants);

        if (fixedImageUrl !== product.imageUrl) updates.imageUrl = fixedImageUrl;
        if (JSON.stringify(fixedImages) !== JSON.stringify(product.images)) updates.images = fixedImages;
        if (JSON.stringify(fixedVariants) !== JSON.stringify(product.variants)) updates.variants = fixedVariants;

        if (Object.keys(updates).length) {
            await product.update(updates);
            changedCount += 1;
            console.log(`Fixed product text: ${updates.name || product.name}`);
        }
    }

    console.log(`Product encoding fix completed. Updated ${changedCount} product(s).`);
}

fixProductEncoding()
    .catch((error) => {
        console.error("Product encoding fix failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
