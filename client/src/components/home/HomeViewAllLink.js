import Link from "next/link";

export default function HomeViewAllLink({ href, label, icon }) {
    return (
        <div className="webcake-view-all">
            <Link className="webcake-view-all-button" href={href} aria-label={label}>
                {icon}
                <span>{label}</span>
            </Link>
        </div>
    );
}
