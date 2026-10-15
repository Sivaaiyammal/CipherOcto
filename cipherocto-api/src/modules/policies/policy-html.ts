import sanitizeHtml from "sanitize-html"

// Uploaded policy HTML is untrusted input that we then serve from our own origin.
// Defence in depth: (1) sanitize to an allow-list here, (2) wrap it in our own
// document, (3) serve it with a CSP that forbids scripts, frames and network calls.

const CSS_VALUE = /^[#a-z0-9(),.\s%+-]+$/i
const LENGTH = /^-?\d+(\.\d+)?(px|em|rem|%|pt|vh|vw)?$/i

const allowedStyles = {
  "*": {
    color: [CSS_VALUE],
    "background-color": [CSS_VALUE],
    "text-align": [/^(left|right|center|justify)$/i],
    "text-decoration": [/^(none|underline|line-through)$/i],
    "font-weight": [/^(normal|bold|bolder|lighter|[1-9]00)$/i],
    "font-style": [/^(normal|italic|oblique)$/i],
    "font-size": [LENGTH],
    "line-height": [LENGTH],
    margin: [LENGTH],
    "margin-top": [LENGTH],
    "margin-bottom": [LENGTH],
    "margin-left": [LENGTH],
    "margin-right": [LENGTH],
    padding: [LENGTH],
    "padding-left": [LENGTH],
    width: [LENGTH],
    "max-width": [LENGTH],
  },
}

/** CSS inside a <style> block: no imports, no url(), no legacy script hooks. */
function cleanCss(css: string): string {
  return css
    .replace(/@import[^;]*;?/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\([^)]*\)/gi, "none")
    .replace(/behaviou?r\s*:[^;}]*/gi, "")
    .replace(/-moz-binding\s*:[^;}]*/gi, "")
    .replace(/<\/?style/gi, "")
}

const IMG_SRC = /^(https:\/\/|data:image\/(png|jpe?g|gif|webp);base64,)/i
const STYLE_BLOCK = /<style([^>]*)>([\s\S]*?)<\/style>/gi

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "a", "abbr", "address", "article", "aside", "b", "blockquote", "br", "caption", "cite", "code",
    "col", "colgroup", "dd", "details", "div", "dl", "dt", "em", "figcaption", "figure", "footer",
    "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "li", "main", "mark", "nav",
    "ol", "p", "pre", "q", "s", "section", "small", "span", "strong", "style", "sub", "summary",
    "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "u", "ul",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "width", "height", "title"],
    td: ["colspan", "rowspan", "align"],
    th: ["colspan", "rowspan", "align", "scope"],
    ol: ["start", "type"],
    "*": ["id", "class", "lang", "dir", "title", "style"],
  },
  allowedStyles,
  allowedSchemes: ["https", "http", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  // `style` blocks are allowed (policy generators emit them); cleanCss + CSP contain them.
  allowVulnerableTags: true,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: "noopener noreferrer nofollow", ...(attribs.target ? { target: "_blank" } : {}) },
    }),
  },
  // Images must be absolute https (or an inline data image); a relative src would
  // resolve against our own origin.
  exclusiveFilter: (frame) =>
    frame.tag === "img" && !IMG_SRC.test(frame.attribs.src ?? ""),
  // Drop the contents of dangerous containers rather than leaking their text.
  nonTextTags: ["script", "textarea", "option", "noscript", "template"],
}

export function sanitizePolicyHtml(raw: string): string {
  const clean = sanitizeHtml(raw, OPTIONS)
  // sanitize-html passes <style> contents through untouched, so clean them here. The
  // markup is already well-formed, so the first </style> really closes the block.
  return clean
    .replace(STYLE_BLOCK, (_m, attrs: string, css: string) => `<style${attrs}>${cleanCss(css)}</style>`)
    .trim()
}

/** True when the sanitized markup has no visible text and no images. */
export function isBlankPolicy(clean: string): boolean {
  const text = sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;|\s+/g, "")
  return text.length === 0 && !/<img\b/i.test(clean)
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// Page chrome is deliberately minimal so a policy's own styles win.
const BASE_STYLE =
  "body{margin:0;background:#fff;color:#1a1a1a;font:16px/1.65 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
  "main{max-width:760px;margin:0 auto;padding:32px 20px 64px}img{max-width:100%;height:auto}" +
  "table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #ddd;padding:6px 10px}" +
  "pre{overflow:auto}a{color:#0b57d0}"

export function renderPolicyPage(opts: { appName: string; kind: "privacy"; html: string }): string {
  const title = `${opts.appName} — Privacy Policy`
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="index,follow"><title>${escapeHtml(title)}</title>` +
    `<style>${BASE_STYLE}</style></head><body><main>${opts.html}</main></body></html>`
  )
}

export function renderNotFoundPage(): string {
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">` +
    `<title>Not found</title><style>${BASE_STYLE}</style></head>` +
    `<body><main><h1>Page not found</h1><p>This policy page has not been published.</p></main></body></html>`
  )
}

/** Blocks scripts, frames, forms and every network fetch except https images. */
export const POLICY_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
