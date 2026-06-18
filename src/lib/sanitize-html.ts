import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML for safe rendering via dangerouslySetInnerHTML.
 * Strips <script>, event handlers (on*), and dangerous protocols
 * while preserving safe content tags, attributes, and data: URIs
 * for epub-embedded images.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr", "div", "span", "a", "img",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "b", "i", "u", "s", "mark", "small", "sub", "sup",
      "ul", "ol", "li", "dl", "dt", "dd",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
      "blockquote", "pre", "code", "kbd", "samp",
      "figure", "figcaption", "picture", "source",
      "details", "summary",
      "abbr", "cite", "q", "time", "address",
      "section", "article", "nav", "aside", "header", "footer", "main",
      "ruby", "rt", "rp",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id", "lang", "dir",
      "width", "height", "colspan", "rowspan", "scope", "headers",
      "type", "value", "start", "reversed", "open",
      "cite", "datetime", "abbr", "align", "valign",
      "loading", "decoding", "srcset", "sizes",
      "data-*", "aria-*", "role", "tabindex",
      "target", "rel", "download",
    ],
    ALLOW_DATA_ATTR: true,
    ADD_URI_SAFE_ATTR: ["poster"],
    // data: URIs needed for epub-embedded images
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}
