import { fetchServerJson } from "@/lib/serverApi";

const escapeXml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const renderProductItem = (product, variant = null) => {
    const link = `https://dpwood.store/products/${product.id}`;
    const itemId = variant?.sku || product.sku || product.id;
    const imageUrl = variant?.imageUrl || product.imageUrl;
    const price = Number(variant?.price ?? product.price ?? 0);
    const stock = Number(variant?.stock ?? product.stock ?? 0);
    const additionalImages = (product.images || [])
        .filter((url) => url && url !== imageUrl)
        .slice(0, 10);
    return `<item>
<g:id>${escapeXml(itemId)}</g:id>
<title>${escapeXml(product.name)}</title>
<description>${escapeXml(String(product.description || product.name).replace(/<[^>]*>/g, " "))}</description>
<link>${escapeXml(link)}</link>
<g:image_link>${escapeXml(imageUrl)}</g:image_link>
${additionalImages.map((url) => `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`).join("\n")}
<g:availability>${stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
<g:price>${Math.round(price)} VND</g:price>
<g:condition>new</g:condition>
<g:brand>${escapeXml(product.brand || "DPWOOD Kitchen")}</g:brand>
${variant ? `<g:item_group_id>${escapeXml(product.sku || product.id)}</g:item_group_id>` : ""}
${variant?.color ? `<g:color>${escapeXml(variant.color)}</g:color>` : ""}
${variant?.size ? `<g:size>${escapeXml(variant.size)}</g:size>` : ""}
${product.gtin ? `<g:gtin>${escapeXml(product.gtin)}</g:gtin>` : ""}
${product.mpn ? `<g:mpn>${escapeXml(product.mpn)}</g:mpn>` : ""}
${!product.gtin && !product.mpn ? "<g:identifier_exists>false</g:identifier_exists>" : ""}
${product.googleProductCategory ? `<g:google_product_category>${escapeXml(product.googleProductCategory)}</g:google_product_category>` : ""}
${product.packageWeightGrams ? `<g:shipping_weight>${escapeXml(product.packageWeightGrams)} g</g:shipping_weight>` : ""}
<g:shipping><g:country>VN</g:country><g:service>Tiêu chuẩn</g:service><g:price>30000 VND</g:price></g:shipping>
<g:product_type>${escapeXml(product.categoryLabel || product.category || "Đồ gia dụng nhà bếp")}</g:product_type>
</item>`;
};

export async function GET() {
    const products = (await fetchServerJson("/products", { revalidate: 900 })) || [];
    const items = products
        .filter((item) => item.imageUrl && Number(item.price) > 0)
        .flatMap((product) => {
            const variants = Array.isArray(product.variants)
                ? product.variants.filter((variant) => (variant.imageUrl || product.imageUrl) && Number(variant.price || product.price) > 0)
                : [];
            return variants.length
                ? variants.map((variant) => renderProductItem(product, variant))
                : [renderProductItem(product)];
        })
        .join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>
<title>DPWOOD Store</title><link>https://dpwood.store</link>
<description>Đồ gia dụng nhà bếp DPWOOD</description>${items}</channel></rss>`;
    return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    });
}
