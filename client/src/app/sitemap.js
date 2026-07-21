import { fetchServerJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

const xmlSafeImageUrl = (value) => String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&/g, "&amp;")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");

export default async function sitemap() {
    const baseUrl = "https://dpwood.store";
    const products = (await fetchServerJson("/products", { revalidate: 3600 })) || [];
    const staticPages = ["", "/products", "/blogs", "/gift-codes", "/support"];
    return [
        ...staticPages.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "daily" : "weekly" })),
        ...products.map((product) => ({
            url: `${baseUrl}/products/${product.id}`,
            lastModified: product.updatedAt || product.createdAt || new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
            images: (product.images?.length ? product.images : [product.imageUrl])
                .filter(Boolean)
                .slice(0, 4)
                .map(xmlSafeImageUrl),
        })),
    ];
}
