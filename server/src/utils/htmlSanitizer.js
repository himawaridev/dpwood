const sanitizeHtml = require("sanitize-html");

const richTextOptions = {
    allowedTags: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "blockquote",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "h2",
        "h3",
        "h4",
        "pre",
        "code",
        "span",
    ],
    allowedAttributes: {
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "title", "width", "height"],
        span: ["class"],
        code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
        img: ["http", "https", "data"],
    },
    transformTags: {
        a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
};

const plainTextOptions = {
    allowedTags: [],
    allowedAttributes: {},
};

const sanitizeRichHtml = (value = "") => sanitizeHtml(String(value || ""), richTextOptions);
const sanitizePlainText = (value = "") => sanitizeHtml(String(value || ""), plainTextOptions).trim();

module.exports = {
    sanitizeRichHtml,
    sanitizePlainText,
};

