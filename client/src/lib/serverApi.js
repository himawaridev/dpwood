const fallbackApi = "https://dpwood.onrender.com/api";

export const getServerApiBase = () =>
    String(process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || fallbackApi).replace(/\/$/, "");

export async function fetchServerJson(path, options = {}) {
    const response = await fetch(`${getServerApiBase()}${path}`, {
        next: { revalidate: options.revalidate ?? 300 },
        headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return response.json();
}
