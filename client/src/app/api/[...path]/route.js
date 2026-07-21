const DEFAULT_BACKEND_API_URL = "https://dpwood.onrender.com/api";
const TRANSIENT_STATUSES = new Set([502, 503, 504]);
const READ_RETRY_DELAYS = [0, 800, 1600, 3200, 5000];
const CANCEL_RETRY_DELAYS = [0, 900, 2200];
const BLOCKED_REQUEST_HEADERS = new Set(["accept-encoding", "connection", "content-length", "host"]);
const BLOCKED_RESPONSE_HEADERS = new Set([
    "connection",
    "content-encoding",
    "content-length",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
]);

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getBackendApiUrl = () => {
    const configuredUrl = process.env.BACKEND_API_URL || "";

    try {
        const parsedUrl = new URL(configuredUrl);
        if (!parsedUrl.hostname.endsWith("dpwood.store")) {
            return configuredUrl.replace(/\/$/, "");
        }
    } catch {
        // Relative or invalid URLs would create a proxy loop, so use the backend directly.
    }

    return DEFAULT_BACKEND_API_URL;
};

const getRetryDelays = (method, path) => {
    if (method === "GET" || method === "HEAD") return READ_RETRY_DELAYS;
    if (method === "PUT" && /^orders\/[^/]+\/cancel$/.test(path)) return CANCEL_RETRY_DELAYS;
    return [0];
};

const buildRequestHeaders = (request, requestUrl) => {
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        if (!BLOCKED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
    });
    headers.set("x-forwarded-host", requestUrl.host);
    headers.set("x-forwarded-proto", requestUrl.protocol.replace(":", ""));
    return headers;
};

const buildResponseHeaders = (sourceHeaders) => {
    const headers = new Headers();
    sourceHeaders.forEach((value, key) => {
        if (!BLOCKED_RESPONSE_HEADERS.has(key.toLowerCase())) headers.append(key, value);
    });
    headers.set("cache-control", "no-store");
    return headers;
};

const proxyRequest = async (request, context) => {
    const { path: rawPath = [] } = await context.params;
    const path = rawPath.map((segment) => encodeURIComponent(segment)).join("/");
    const requestUrl = new URL(request.url);
    const targetUrl = `${getBackendApiUrl()}/${path}${requestUrl.search}`;
    const method = request.method.toUpperCase();
    const retryDelays = getRetryDelays(method, path);
    const requestHeaders = buildRequestHeaders(request, requestUrl);
    const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
    let lastError;

    for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
        if (retryDelays[attempt] > 0) await wait(retryDelays[attempt]);

        try {
            const response = await fetch(targetUrl, {
                method,
                headers: requestHeaders,
                body: body?.byteLength ? body : undefined,
                cache: "no-store",
                redirect: "manual",
                signal: AbortSignal.timeout(15000),
            });

            const canRetry =
                TRANSIENT_STATUSES.has(response.status) && attempt < retryDelays.length - 1;
            if (canRetry) {
                await response.body?.cancel();
                continue;
            }

            return new Response(method === "HEAD" ? null : response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: buildResponseHeaders(response.headers),
            });
        } catch (error) {
            lastError = error;
            if (attempt === retryDelays.length - 1) break;
        }
    }

    console.error(`API proxy failed for ${method} /api/${path}:`, lastError?.message || lastError);
    return Response.json(
        {
            message: "Máy chủ đang khởi động. Vui lòng chờ một chút rồi thử lại.",
            retryable: true,
        },
        { status: 503, headers: { "cache-control": "no-store", "retry-after": "3" } },
    );
};

export const GET = proxyRequest;
export const HEAD = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
