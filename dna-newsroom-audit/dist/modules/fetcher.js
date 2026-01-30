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
exports.UA_PROFILES = void 0;
exports.fetchUrl = fetchUrl;
exports.fetchBatch = fetchBatch;
exports.fetchWithMultipleUAs = fetchWithMultipleUAs;
const types_1 = require("../models/types");
Object.defineProperty(exports, "UA_PROFILES", { enumerable: true, get: function () { return types_1.UA_PROFILES; } });
const zlib = __importStar(require("zlib"));
const util_1 = require("util");
const gunzip = (0, util_1.promisify)(zlib.gunzip);
const DEFAULT_CONFIG = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    userAgent: types_1.UA_PROFILES.default,
    concurrency: 5,
    rateLimit: 10
};
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function decompressGzip(buffer) {
    try {
        const decompressed = await gunzip(buffer);
        return decompressed.toString('utf-8');
    }
    catch (error) {
        throw new Error(`Gzip decompression failed: ${error}`);
    }
}
async function fetchUrl(url, config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let lastError = null;
    let redirectChain = [];
    let currentUrl = url;
    let redirectCount = 0;
    const maxRedirects = 10;
    for (let attempt = 0; attempt <= cfg.retries; attempt++) {
        try {
            if (attempt > 0) {
                await sleep(cfg.retryDelay * attempt);
            }
            redirectChain = [url];
            currentUrl = url;
            redirectCount = 0;
            // Manual redirect following to track chain
            while (redirectCount < maxRedirects) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), cfg.timeout);
                try {
                    const response = await fetch(currentUrl, {
                        method: 'GET',
                        headers: {
                            'User-Agent': cfg.userAgent,
                            'Accept': '*/*',
                            'Accept-Encoding': 'gzip, deflate'
                        },
                        redirect: 'manual',
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    // Handle redirects
                    if ([301, 302, 303, 307, 308].includes(response.status)) {
                        const location = response.headers.get('location');
                        if (location) {
                            currentUrl = new URL(location, currentUrl).href;
                            redirectChain.push(currentUrl);
                            redirectCount++;
                            continue;
                        }
                    }
                    // Get headers
                    const headers = {};
                    response.headers.forEach((value, key) => {
                        headers[key.toLowerCase()] = value;
                    });
                    const contentType = headers['content-type'] || '';
                    const contentEncoding = headers['content-encoding'] || '';
                    const contentLength = parseInt(headers['content-length'] || '0', 10);
                    const cacheControl = headers['cache-control'] || '';
                    const xRobotsTag = headers['x-robots-tag'] || '';
                    // Get body
                    let body;
                    let wasDecompressed = false;
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    // Check if gzipped
                    const isGzipped = contentEncoding.includes('gzip') ||
                        currentUrl.endsWith('.gz') ||
                        (buffer[0] === 0x1f && buffer[1] === 0x8b);
                    if (isGzipped) {
                        try {
                            body = await decompressGzip(buffer);
                            wasDecompressed = true;
                        }
                        catch {
                            body = buffer.toString('utf-8');
                        }
                    }
                    else {
                        body = buffer.toString('utf-8');
                    }
                    return {
                        url,
                        finalUrl: currentUrl,
                        status: response.status,
                        redirectCount,
                        redirectChain,
                        headers,
                        body,
                        contentType,
                        contentLength: body.length,
                        contentEncoding,
                        cacheControl,
                        xRobotsTag,
                        responseTime: Date.now() - startTime,
                        wasDecompressed
                    };
                }
                catch (fetchError) {
                    clearTimeout(timeoutId);
                    throw fetchError;
                }
            }
            // Max redirects exceeded
            return {
                url,
                finalUrl: currentUrl,
                status: 0,
                redirectCount,
                redirectChain,
                headers: {},
                body: '',
                contentType: '',
                contentLength: 0,
                contentEncoding: '',
                cacheControl: '',
                xRobotsTag: '',
                responseTime: Date.now() - startTime,
                wasDecompressed: false,
                error: 'Max redirects exceeded'
            };
        }
        catch (error) {
            lastError = error;
        }
    }
    return {
        url,
        finalUrl: currentUrl,
        status: 0,
        redirectCount,
        redirectChain,
        headers: {},
        body: '',
        contentType: '',
        contentLength: 0,
        contentEncoding: '',
        cacheControl: '',
        xRobotsTag: '',
        responseTime: Date.now() - startTime,
        wasDecompressed: false,
        error: lastError?.message || 'Unknown error'
    };
}
async function fetchBatch(urls, config = {}, onProgress) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const results = [];
    const queue = [...urls];
    let completed = 0;
    let lastRequestTime = 0;
    const minInterval = 1000 / cfg.rateLimit;
    const workers = Array(cfg.concurrency).fill(null).map(async () => {
        while (queue.length > 0) {
            const url = queue.shift();
            if (!url)
                break;
            // Rate limiting
            const now = Date.now();
            const elapsed = now - lastRequestTime;
            if (elapsed < minInterval) {
                await sleep(minInterval - elapsed);
            }
            lastRequestTime = Date.now();
            const result = await fetchUrl(url, cfg);
            results.push(result);
            completed++;
            if (onProgress) {
                onProgress(completed, urls.length);
            }
        }
    });
    await Promise.all(workers);
    return results;
}
async function fetchWithMultipleUAs(url, uaProfiles = ['default', 'googlebot', 'bingbot'], config = {}) {
    const results = [];
    for (const profile of uaProfiles) {
        const ua = types_1.UA_PROFILES[profile] || profile;
        const result = await fetchUrl(url, { ...config, userAgent: ua });
        // Import detectBodySignature dynamically to avoid circular deps
        const { detectBodySignature } = await Promise.resolve().then(() => __importStar(require('./parser')));
        const signature = detectBodySignature(result.body);
        results.push({
            ua: profile,
            status: result.status,
            contentLength: result.contentLength,
            contentType: result.contentType,
            bodySignature: signature,
            hash: '' // Will be computed by parser
        });
    }
    return results;
}
//# sourceMappingURL=fetcher.js.map