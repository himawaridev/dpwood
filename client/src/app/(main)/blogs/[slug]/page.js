import api from "@/utils/axios";
import ClientBlogDetail from "./ClientBlogDetail";

// Tối ưu SEO: Google Bot sẽ đọc được dữ liệu này
export async function generateMetadata({ params }) {
    // 🔴 QUAN TRỌNG: Phải await params trong Next.js 15
    const { slug } = await params;

    try {
        const res = await api.get(`/blogs/${slug}`);
        const blog = res.data;

        if (!blog) return { title: "Không tìm thấy bài viết" };

        return {
            title: blog.metaTitle || blog.title,
            description: blog.metaDescription || blog.summary,
            openGraph: {
                images: [blog.thumbnail],
            },
        };
    } catch (error) {
        return { title: "Cẩm nang nội thất" };
    }
}

export default async function BlogDetailPage({ params }) {
    // 🔴 QUAN TRỌNG: Phải await params trước khi truyền xuống Client Component
    const { slug } = await params;

    return <ClientBlogDetail slug={slug} />;
}
