const configuredApiUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://dpwood.onrender.com/api";
const backendApiUrl = configuredApiUrl.replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${backendApiUrl}/:path*`,
            },
        ];
    },
};

export default nextConfig;
