export default function robots() {
    return {
        rules: [
            { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/profile", "/cart"] },
        ],
        sitemap: "https://dpwood.store/sitemap.xml",
        host: "https://dpwood.store",
    };
}
