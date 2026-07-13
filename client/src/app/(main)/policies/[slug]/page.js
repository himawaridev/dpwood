import Link from "next/link";
import { notFound } from "next/navigation";
import { POLICY_UPDATED_AT, legalPolicies, policyLinks } from "@/data/legalPolicies";

export const dynamicParams = false;

export function generateStaticParams() {
    return policyLinks.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const policy = legalPolicies[slug];
    if (!policy) return {};
    return {
        title: `${policy.title} | DPWOOD`,
        description: policy.summary,
    };
}

export default async function PolicyPage({ params }) {
    const { slug } = await params;
    const policy = legalPolicies[slug];
    if (!policy) notFound();

    return (
        <main className="dp-page dp-legal-page">
            <div className="dp-container dp-legal-layout">
                <aside className="dp-legal-nav" aria-label="Danh sách chính sách">
                    <strong>Điều khoản & chính sách</strong>
                    <nav>
                        {policyLinks.map((item) => (
                            <Link className={item.slug === slug ? "is-active" : ""} href={item.href} key={item.slug}>
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </aside>

                <article className="dp-legal-document">
                    <span className="dp-eyebrow">DPWOOD POLICY</span>
                    <h1>{policy.title}</h1>
                    <p className="dp-legal-summary">{policy.summary}</p>
                    <p className="dp-legal-updated">Cập nhật lần cuối: {POLICY_UPDATED_AT}</p>

                    {policy.sections.map((section) => (
                        <section key={section.title}>
                            <h2>{section.title}</h2>
                            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                            {section.bullets?.length > 0 && (
                                <ul>
                                    {section.bullets.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            )}
                        </section>
                    ))}

                    <div className="dp-legal-contact">
                        <strong>Cần hỗ trợ thêm?</strong>
                        <p>Gửi yêu cầu để DPWOOD kiểm tra theo tài khoản và mã đơn hàng của bạn.</p>
                        <Link href="/support">Đi đến Trung tâm hỗ trợ</Link>
                    </div>
                </article>
            </div>
        </main>
    );
}
