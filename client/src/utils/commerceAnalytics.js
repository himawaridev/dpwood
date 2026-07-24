const SESSION_KEY = "dpwood_analytics_session";

const getSessionId = () => {
    if (typeof window === "undefined") return "";
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId =
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
};

export const trackCommerceEvent = (eventName, properties = {}, path = null) => {
    if (typeof window === "undefined") return;
    const payload = {
        eventName,
        sessionId: getSessionId(),
        path: path || `${window.location.pathname}${window.location.search}`,
        properties,
    };

    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, properties);
    }

    fetch("/api/analytics/events", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token")
                ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
                : {}),
        },
        body: JSON.stringify(payload),
        keepalive: true,
    }).catch(() => {
        // Analytics must never interrupt a customer workflow.
    });
};

