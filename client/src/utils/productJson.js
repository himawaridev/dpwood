export const downloadBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const serializeProduct = (product) => {
    const images = [...new Set([
        product.imageUrl,
        ...(Array.isArray(product.images) ? product.images : []),
    ])].filter(Boolean);

    return {
        name: product.name || "",
        description: product.description || "",
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        sold: Number(product.sold || 0),
        imageUrl: images[0] || "",
        images,
        variants: (Array.isArray(product.variants) ? product.variants : []).map((variant) => ({
            variantId: variant.variantId || "",
            color: variant.color || "",
            size: variant.size || variant.capacity || "",
            price: Number(variant.price || product.price || 0),
            stock: Number(variant.stock || 0),
            imageUrl: variant.imageUrl || "",
        })),
        category: product.category || "",
        material: product.material || "",
        color: product.color || "",
        brand: product.brand || "DPWOOD Kitchen",
        capacity: product.capacity || "",
        warranty: product.warranty || "",
        origin: product.origin || "",
        dishwasherSafe: Boolean(product.dishwasherSafe),
        microwaveSafe: Boolean(product.microwaveSafe),
    };
};

export const buildProductExport = (products) => {
    const serializedProducts = products.map(serializeProduct);
    return {
        version: 1,
        source: "DPWOOD Admin Products",
        exportedAt: new Date().toISOString(),
        total: serializedProducts.length,
        products: serializedProducts,
    };
};
