const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { connectDB, sequelize } = require("../config/connectSequelize");
const Product = require("../models/product");
const ProductRating = require("../models/productRating");
const OrderItem = require("../models/orderItem");
const Wishlist = require("../models/wishlist");
const { normalizeProductPayload, validateProductPayload } = require("../utils/productData");

const apply = process.argv.includes("--apply");
const dedupe = process.argv.includes("--dedupe");
const archiveInvalid = process.argv.includes("--archive-invalid");

const qualityScore = (product) =>
    (product.imageUrl ? 1000 : 0) +
    (Array.isArray(product.images) ? product.images.length * 40 : 0) +
    (Array.isArray(product.variants) ? product.variants.length * 15 : 0) +
    Math.min(300, String(product.description || "").length) +
    Number(product.ratingCount || 0) * 5 +
    Number(product.sold || 0);

const remapProductRelations = async (sourceId, targetId, transaction) => {
    const [orderItems] = await OrderItem.update(
        { productId: targetId },
        { where: { productId: sourceId }, transaction },
    );

    let wishlists = 0;
    const sourceWishlists = await Wishlist.findAll({ where: { productId: sourceId }, transaction });
    for (const wishlist of sourceWishlists) {
        const existing = await Wishlist.findOne({
            where: { userId: wishlist.userId, productId: targetId },
            transaction,
        });
        if (existing) await wishlist.destroy({ transaction });
        else await wishlist.update({ productId: targetId }, { transaction });
        wishlists += 1;
    }

    let ratings = 0;
    const sourceRatings = await ProductRating.findAll({ where: { productId: sourceId }, transaction });
    for (const rating of sourceRatings) {
        const existing = await ProductRating.findOne({
            where: { userId: rating.userId, productId: targetId },
            transaction,
        });
        if (existing) {
            if (new Date(rating.updatedAt) > new Date(existing.updatedAt)) {
                await existing.update({
                    rating: rating.rating,
                    comment: rating.comment,
                    images: rating.images,
                    isVerifiedPurchase: rating.isVerifiedPurchase,
                    orderId: rating.orderId,
                }, { transaction });
            }
            await rating.destroy({ transaction });
        } else {
            await rating.update({ productId: targetId }, { transaction });
        }
        ratings += 1;
    }

    return { orderItems, wishlists, ratings };
};

const refreshRatingSummary = async (productId, transaction) => {
    const summary = await ProductRating.findOne({
        where: { productId },
        attributes: [
            [sequelize.fn("AVG", sequelize.col("rating")), "average"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        raw: true,
        transaction,
    });
    await Product.update({
        rating: Number(summary?.average || 0),
        ratingCount: Number(summary?.count || 0),
    }, { where: { id: productId }, transaction });
};

async function run() {
    await connectDB();
    const products = await Product.findAll({ order: [["createdAt", "ASC"]] });
    const originalProducts = products.map((product) => product.toJSON());
    if (apply) {
        const backupDir = path.join(__dirname, "../../backups");
        fs.mkdirSync(backupDir, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        fs.writeFileSync(
            path.join(backupDir, `products-before-normalization-${stamp}.json`),
            JSON.stringify({ createdAt: new Date().toISOString(), products: originalProducts }, null, 2),
        );
    }
    const report = {
        total: products.length,
        ready: 0,
        invalid: 0,
        updated: 0,
        archivedInvalid: 0,
        archivedDuplicates: 0,
        remappedOrderItems: 0,
        remappedWishlists: 0,
        remappedRatings: 0,
        duplicateNames: [],
    };
    const names = new Map();
    for (const product of products) {
        const json = product.toJSON();
        const normalizedName = String(json.name || "").trim().toLocaleLowerCase("vi");
        names.set(normalizedName, [...(names.get(normalizedName) || []), json.id]);
        const normalized = normalizeProductPayload(json);
        const errors = validateProductPayload(normalized);
        if (errors.length) {
            report.invalid += 1;
            console.warn(`[INVALID] ${json.name}: ${errors.join("; ")}`);
            if (apply && archiveInvalid && json.isActive) {
                await product.update({ isActive: false, stock: 0 });
                report.archivedInvalid += 1;
            }
            continue;
        }
        report.ready += 1;
        if (apply) {
            await product.update(normalized);
            report.updated += 1;
        }
    }
    report.duplicateNames = [...names.entries()]
        .filter(([name, ids]) => name && ids.length > 1)
        .map(([name, ids]) => ({ name, ids }));

    if (apply && dedupe) {
        for (const group of report.duplicateNames) {
            const allCandidates = products.filter((product) => group.ids.includes(product.id));
            const candidates = allCandidates
                .filter((product) => product.isActive)
                .sort((a, b) => qualityScore(b) - qualityScore(a));
            if (!candidates.length) continue;
            const keeper = candidates[0];
            const merged = normalizeProductPayload({
                ...keeper.toJSON(),
                images: allCandidates.flatMap((item) => item.images || [item.imageUrl]).filter(Boolean),
                variants: allCandidates.flatMap((item) => item.variants || []),
                stock: Math.max(...allCandidates.map((item) => Number(item.stock || 0))),
                sold: Math.max(...allCandidates.map((item) => Number(item.sold || 0))),
            });
            await sequelize.transaction(async (transaction) => {
                await keeper.update(merged, { transaction });
                for (const duplicate of allCandidates.filter((item) => item.id !== keeper.id)) {
                    const remapped = await remapProductRelations(duplicate.id, keeper.id, transaction);
                    report.remappedOrderItems += remapped.orderItems;
                    report.remappedWishlists += remapped.wishlists;
                    report.remappedRatings += remapped.ratings;
                    if (duplicate.isActive) report.archivedDuplicates += 1;
                    await duplicate.update({ isActive: false, stock: 0 }, { transaction });
                }
                await refreshRatingSummary(keeper.id, transaction);
            });
        }
    }

    console.log(JSON.stringify(report, null, 2));
    await sequelize.close();
}

run().catch(async (error) => {
    console.error(error);
    await sequelize.close().catch(() => undefined);
    process.exitCode = 1;
});
