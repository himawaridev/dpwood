import { fetchServerJson } from "@/lib/serverApi";

const siteUrl = "https://dpwood.store";

const getProduct = async (id) => fetchServerJson(`/products/${encodeURIComponent(id)}`, { revalidate: 120 });

export async function generateMetadata({ params }) {
    const { id } = await params;
    const product = await getProduct(id);
    if (!product) return { title: "Sản phẩm không tồn tại", robots: { index: false, follow: false } };
    const description = String(product.description || `Mua ${product.name} chính hãng tại DPWOOD.`)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160);
    const images = (product.images?.length ? product.images : [product.imageUrl]).filter(Boolean);
    return {
        title: product.name,
        description,
        alternates: { canonical: `/products/${product.id}` },
        openGraph: {
            title: product.name,
            description,
            url: `${siteUrl}/products/${product.id}`,
            type: "website",
            images: images.slice(0, 4).map((url) => ({ url, alt: product.name })),
        },
        twitter: { card: "summary_large_image", title: product.name, description, images: images.slice(0, 1) },
    };
}

export default async function ProductSeoLayout({ children, params }) {
    const { id } = await params;
    const product = await getProduct(id);
    if (!product) return children;
    const productUrl = `${siteUrl}/products/${product.id}`;
    const images = (product.images?.length ? product.images : [product.imageUrl]).filter(Boolean);
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: String(product.description || "").replace(/<[^>]*>/g, " ").trim(),
        image: images,
        sku: product.sku || product.id,
        ...(product.gtin ? { gtin: product.gtin } : {}),
        ...(product.mpn ? { mpn: product.mpn } : {}),
        brand: { "@type": "Brand", name: product.brand || "DPWOOD Kitchen" },
        offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "VND",
            price: Number(product.price || 0),
            itemCondition: "https://schema.org/NewCondition",
            availability: Number(product.stock || 0) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: "DPWOOD Store" },
            shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingDestination: { "@type": "DefinedRegion", addressCountry: "VN" },
                deliveryTime: {
                    "@type": "ShippingDeliveryTime",
                    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
                    transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5, unitCode: "DAY" },
                },
            },
            hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "VN",
                returnPolicyCategory: product.returnEligible === false
                    ? "https://schema.org/MerchantReturnNotPermitted"
                    : "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: Number(product.returnWindowDays || 7),
                returnMethod: "https://schema.org/ReturnByMail",
            },
        },
        ...(Number(product.ratingCount || 0) > 0
            ? {
                  aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: Number(product.rating || 0),
                      reviewCount: Number(product.ratingCount || 0),
                  },
              }
            : {}),
    };
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Sản phẩm", item: `${siteUrl}/products` },
            { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
        ],
    };
    const json = JSON.stringify([productSchema, breadcrumbSchema]).replace(/</g, "\\u003c");
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />{children}</>;
}
