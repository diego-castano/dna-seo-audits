"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBodySignature = detectBodySignature;
exports.parseHTML = parseHTML;
exports.extractAnchors = extractAnchors;
exports.detectNonCrawlableNavigation = detectNonCrawlableNavigation;
exports.extractJsonLd = extractJsonLd;
exports.normalizeHTML = normalizeHTML;
exports.computeHash = computeHash;
exports.calculateSimilarity = calculateSimilarity;
exports.parseXMLSitemap = parseXMLSitemap;
exports.getEvidenceSnippet = getEvidenceSnippet;
const cheerio = __importStar(require("cheerio"));
const crypto = __importStar(require("crypto"));
// ============================================
// BODY SIGNATURE DETECTION
// ============================================
const APP_SHELL_PATTERNS = [
    /<script\s+src=/i,
    /jquery/i,
    /main\.css/i,
    /bundle\./i,
    /chunk\./i,
    /webpack/i,
    /react/i,
    /angular/i,
    /vue\./i,
    /__NEXT_DATA__/i,
    /_app\./i,
    /manifest\.json/i
];
function detectBodySignature(body) {
    const trimmed = body.trim().toLowerCase();
    const isHTML = trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
    const isXML = trimmed.startsWith('<?xml') ||
        body.includes('<urlset') ||
        body.includes('<sitemapindex');
    const isPlainText = body.includes('User-agent:');
    const appShellSignals = [];
    for (const pattern of APP_SHELL_PATTERNS) {
        if (pattern.test(body)) {
            appShellSignals.push(pattern.source);
        }
    }
    // Calculate text ratio
    const textOnly = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const textRatio = body.length > 0 ? textOnly.length / body.length : 0;
    return {
        isHTML,
        isXML,
        isPlainText,
        hasAppShellSignals: appShellSignals.length > 0,
        appShellSignals,
        textRatio
    };
}
// ============================================
// HTML PARSING
// ============================================
function parseHTML(html, baseUrl) {
    const $ = cheerio.load(html);
    // Title
    const title = $('title').first().text().trim();
    // H1s
    const h1 = [];
    $('h1').each((_, el) => {
        h1.push($(el).text().trim());
    });
    // Meta description
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    // Meta robots
    const metaRobots = $('meta[name="robots"]').attr('content') || '';
    // Canonical
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    // OG Tags
    const ogTags = {
        title: $('meta[property="og:title"]').attr('content') || '',
        description: $('meta[property="og:description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
        type: $('meta[property="og:type"]').attr('content') || ''
    };
    // Hreflang
    const hreflang = [];
    $('link[rel="alternate"][hreflang]').each((_, el) => {
        const lang = $(el).attr('hreflang') || '';
        const url = $(el).attr('href') || '';
        if (lang && url) {
            hreflang.push({ lang, url });
        }
    });
    // Anchors
    const anchors = extractAnchors(html, baseUrl);
    // JSON-LD
    const jsonLd = extractJsonLd(html);
    // Body text
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const bodyTextLength = bodyText.length;
    const bodyTextRatio = html.length > 0 ? bodyTextLength / html.length : 0;
    // Scripts
    const scriptSources = [];
    $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src)
            scriptSources.push(src);
    });
    const scriptCount = $('script').length;
    // Hashes
    const normalizedHash = computeHash(normalizeHTML(html));
    const rawHash = computeHash(html);
    return {
        title,
        h1,
        metaDescription,
        metaRobots,
        canonical,
        ogTags,
        hreflang,
        anchors,
        jsonLd,
        bodyTextLength,
        bodyTextRatio,
        scriptCount,
        scriptSources,
        normalizedHash,
        rawHash
    };
}
// ============================================
// ANCHOR EXTRACTION
// ============================================
const PLACEHOLDER_PATTERNS = [
    /\{\{link\}\}/i,
    /\{\{url\}\}/i,
    /\{link\}/i,
    /\{url\}/i,
    /%link%/i,
    /%url%/i
];
function extractAnchors(html, baseUrl) {
    const $ = cheerio.load(html);
    const anchors = [];
    const baseUrlObj = new URL(baseUrl);
    $('a').each((_, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const text = $el.text().trim();
        const rel = $el.attr('rel') || '';
        // Determine context
        let context = 'unknown';
        if ($el.closest('nav').length > 0 || $el.closest('header').length > 0) {
            context = 'nav';
        }
        else if ($el.closest('footer').length > 0) {
            context = 'footer';
        }
        else if ($el.closest('main, article, section').length > 0) {
            context = 'content';
        }
        // Check for placeholder
        const isPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(href));
        // Check internal/external
        let isInternal = false;
        let isExternal = false;
        if (href && !href.startsWith('javascript:') && !href.startsWith('#') && href !== '') {
            try {
                const hrefUrl = new URL(href, baseUrl);
                isInternal = hrefUrl.hostname === baseUrlObj.hostname;
                isExternal = !isInternal && hrefUrl.protocol.startsWith('http');
            }
            catch {
                // Invalid URL
            }
        }
        anchors.push({
            href,
            text,
            rel,
            isInternal,
            isExternal,
            isEmpty: href === '',
            isHashOnly: href === '#' || (href.startsWith('#') && href.length > 1),
            isJavascript: href.startsWith('javascript:'),
            isPlaceholder,
            isButtonWithoutHref: false,
            context
        });
    });
    // Also check for buttons with onclick but no href
    $('button[onclick], div[onclick], span[onclick]').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim().toLowerCase();
        if (text.includes('more') || text.includes('load') || text.includes('ver') || text.includes('see')) {
            anchors.push({
                href: '',
                text: $el.text().trim(),
                rel: '',
                isInternal: false,
                isExternal: false,
                isEmpty: true,
                isHashOnly: false,
                isJavascript: false,
                isPlaceholder: false,
                isButtonWithoutHref: true,
                context: 'content'
            });
        }
    });
    return anchors;
}
// ============================================
// NON-CRAWLABLE NAVIGATION DETECTION
// ============================================
function detectNonCrawlableNavigation(anchors) {
    const issues = [];
    // Placeholders
    const placeholders = anchors.filter(a => a.isPlaceholder);
    if (placeholders.length > 0) {
        issues.push({
            type: 'placeholder',
            evidence: placeholders.slice(0, 3).map(a => a.href).join(', '),
            context: 'Template placeholders found in href attributes',
            count: placeholders.length
        });
    }
    // Empty hrefs in content
    const emptyInContent = anchors.filter(a => a.isEmpty && a.context === 'content');
    if (emptyInContent.length > 0) {
        issues.push({
            type: 'empty',
            evidence: `${emptyInContent.length} empty href attributes in content area`,
            context: 'Links with href="" cannot be crawled',
            count: emptyInContent.length
        });
    }
    // Hash-only in content (likely article cards)
    const hashOnlyInContent = anchors.filter(a => a.isHashOnly && a.context === 'content');
    if (hashOnlyInContent.length > 0) {
        issues.push({
            type: 'hashOnly',
            evidence: `${hashOnlyInContent.length} hash-only links in content area`,
            context: 'Links with href="#" are not crawlable',
            count: hashOnlyInContent.length
        });
    }
    // JavaScript links
    const jsLinks = anchors.filter(a => a.isJavascript);
    if (jsLinks.length > 0) {
        issues.push({
            type: 'javascript',
            evidence: jsLinks.slice(0, 3).map(a => a.href.substring(0, 50)).join(', '),
            context: 'javascript: links are not crawlable',
            count: jsLinks.length
        });
    }
    // Buttons without href
    const buttonsNoHref = anchors.filter(a => a.isButtonWithoutHref);
    if (buttonsNoHref.length > 0) {
        issues.push({
            type: 'buttonNoHref',
            evidence: buttonsNoHref.slice(0, 3).map(a => a.text).join(', '),
            context: 'Buttons/divs with onclick but no <a href> are not crawlable',
            count: buttonsNoHref.length
        });
    }
    return issues;
}
// ============================================
// JSON-LD EXTRACTION
// ============================================
function extractJsonLd(html) {
    const $ = cheerio.load(html);
    const schemas = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const content = $(el).html();
            if (content) {
                const parsed = JSON.parse(content);
                const types = [];
                // Handle @type
                if (parsed['@type']) {
                    if (Array.isArray(parsed['@type'])) {
                        types.push(...parsed['@type']);
                    }
                    else {
                        types.push(parsed['@type']);
                    }
                }
                // Handle @graph
                if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
                    for (const item of parsed['@graph']) {
                        if (item['@type']) {
                            if (Array.isArray(item['@type'])) {
                                types.push(...item['@type']);
                            }
                            else {
                                types.push(item['@type']);
                            }
                        }
                    }
                }
                schemas.push({
                    type: types[0] || 'Unknown',
                    types,
                    raw: parsed,
                    isComplete: types.length > 0 && types[0] !== 'Unknown'
                });
            }
        }
        catch {
            // Invalid JSON-LD
        }
    });
    return schemas;
}
// ============================================
// HTML NORMALIZATION & HASHING
// ============================================
function normalizeHTML(html) {
    return html
        // Remove whitespace
        .replace(/\s+/g, ' ')
        // Remove nonces
        .replace(/nonce="[^"]*"/gi, '')
        // Remove timestamps
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '')
        // Remove version querystrings
        .replace(/\?v=[^"&\s]*/gi, '')
        .replace(/\?_=[^"&\s]*/gi, '')
        // Remove build IDs
        .replace(/buildId":"[^"]*"/gi, '')
        .replace(/_buildManifest\.js/gi, '')
        // Remove CSRF tokens
        .replace(/csrf[^"]*"[^"]*"/gi, '')
        .trim();
}
function computeHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}
function calculateSimilarity(html1, html2, hash1, hash2) {
    const reasons = [];
    // Exact match
    if (hash1 === hash2) {
        return { isExactMatch: true, isHighSimilarity: true, score: 1.0, reasons: ['Exact hash match'] };
    }
    // Length similarity
    const lengthRatio = Math.min(html1.length, html2.length) / Math.max(html1.length, html2.length);
    if (lengthRatio > 0.95) {
        reasons.push('Length within 5%');
    }
    // Both are small (likely shells)
    if (html1.length < 5000 && html2.length < 5000) {
        reasons.push('Both HTML < 5KB');
    }
    // Script sources comparison
    const scripts1 = new Set(html1.match(/src="[^"]*\.js[^"]*"/g) || []);
    const scripts2 = new Set(html2.match(/src="[^"]*\.js[^"]*"/g) || []);
    const scriptsMatch = scripts1.size > 0 &&
        [...scripts1].every(s => scripts2.has(s)) &&
        [...scripts2].every(s => scripts1.has(s));
    if (scriptsMatch && scripts1.size > 0) {
        reasons.push('Same script sources');
    }
    const score = reasons.length / 3;
    const isHighSimilarity = reasons.length >= 2;
    return { isExactMatch: false, isHighSimilarity, score, reasons };
}
// ============================================
// XML PARSING
// ============================================
function parseXMLSitemap(xml) {
    const urls = [];
    const isSitemapIndex = xml.includes('<sitemapindex');
    // Extract URLs from <loc> tags
    const locMatches = xml.match(/<loc>([^<]+)<\/loc>/gi) || [];
    for (const match of locMatches) {
        const url = match.replace(/<\/?loc>/gi, '').trim();
        if (url)
            urls.push(url);
    }
    return { urls, isSitemapIndex };
}
function getEvidenceSnippet(content, lines = 10) {
    return content.split('\n').slice(0, lines).join('\n');
}
//# sourceMappingURL=parser.js.map