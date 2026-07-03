const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const stripCodeFence = (value) =>
    String(value || "")
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

const extractFirstJsonObject = (value) => {
    const text = String(value || "");
    const start = text.indexOf("{");
    if (start === -1) return "";

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
        const char = text[index];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === "\\") {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (char === "{") depth += 1;
        if (char === "}") depth -= 1;

        if (depth === 0) {
            return text.slice(start, index + 1);
        }
    }

    return "";
};

const extractTextFromGenerateContent = (data) => {
    const parts = data?.candidates?.[0]?.content?.parts || [];
    return parts.map((part) => part.text || "").join("\n").trim();
};

const parseJsonResponse = (rawText) => {
    const cleaned = stripCodeFence(rawText);
    try {
        return JSON.parse(cleaned);
    } catch {
        const jsonObject = extractFirstJsonObject(cleaned);
        if (!jsonObject) {
            throw new Error("Gemini did not return valid JSON");
        }
        return JSON.parse(jsonObject);
    }
};

const generateJson = async ({ systemInstruction, prompt, temperature = 0.65 }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

    if (!apiKey) {
        const error = new Error("GEMINI_API_KEY is not configured");
        error.statusCode = 503;
        throw error;
    }

    const callModel = async (modelName) => fetch(`${GEMINI_API_BASE_URL}/${encodeURIComponent(modelName)}:generateContent`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemInstruction }],
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature,
                responseMimeType: "application/json",
            },
        }),
    });

    const fallbackModels = ["gemini-2.5-flash", "gemini-2.0-flash"].filter((item) => item !== model);
    const modelsToTry = [model, ...fallbackModels];
    let response;
    let data = {};
    let lastErrorMessage = "";

    for (const modelName of modelsToTry) {
        response = await callModel(modelName);
        data = await response.json().catch(() => ({}));

        if (response.ok) break;

        lastErrorMessage = data?.error?.message || "Gemini request failed";
        const canFallback = response.status === 429 || response.status === 503 || response.status === 404;
        if (!canFallback) break;
    }

    if (!response.ok) {
        const message = lastErrorMessage || data?.error?.message || "Gemini request failed";
        const error = new Error(message);
        error.statusCode = response.status;
        error.isQuotaExceeded =
            response.status === 429 ||
            /quota|rate[-\s]?limit|free_tier|retry/i.test(message);
        throw error;
    }

    const rawText = extractTextFromGenerateContent(data);
    if (!rawText) {
        throw new Error("Gemini returned an empty response");
    }

    return parseJsonResponse(rawText);
};

module.exports = { generateJson };
