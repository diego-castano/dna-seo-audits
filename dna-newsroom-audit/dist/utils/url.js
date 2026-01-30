"use strict";
/**
 * URL Utilities for DNA Newsroom Audit
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUrl = normalizeUrl;
exports.isInternalUrl = isInternalUrl;
exports.extractDomain = extractDomain;
exports.getBaseUrl = getBaseUrl;
exports.resolveUrl = resolveUrl;
exports.getPathname = getPathname;
exports.isHomepage = isHomepage;
exports.deduplicateUrls = deduplicateUrls;
function normalizeUrl(url) {
    try {
        const parsed = new URL(url);
        // Remove trailing slash (except for root)
        let pathname = parsed.pathname;
        if (pathname.length > 1 && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }
        // Remove fragment
        parsed.hash = '';
        // Reconstruct
        return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
    }
    catch {
        return url;
    }
}
function isInternalUrl(url, baseUrl) {
    try {
        const urlObj = new URL(url, baseUrl);
        const baseObj = new URL(baseUrl);
        return urlObj.hostname === baseObj.hostname;
    }
    catch {
        return false;
    }
}
function extractDomain(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname;
    }
    catch {
        return url;
    }
}
function getBaseUrl(url) {
    try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.host}`;
    }
    catch {
        return url;
    }
}
function resolveUrl(href, baseUrl) {
    try {
        return new URL(href, baseUrl).href;
    }
    catch {
        return href;
    }
}
function getPathname(url) {
    try {
        return new URL(url).pathname;
    }
    catch {
        return url;
    }
}
function isHomepage(url) {
    try {
        const pathname = new URL(url).pathname;
        return pathname === '/' || pathname === '/index.html' || pathname === '/index.htm';
    }
    catch {
        return false;
    }
}
function deduplicateUrls(urls) {
    const normalized = new Map();
    for (const url of urls) {
        const norm = normalizeUrl(url);
        if (!normalized.has(norm)) {
            normalized.set(norm, url);
        }
    }
    return Array.from(normalized.values());
}
//# sourceMappingURL=url.js.map