/**
 * URL Utilities for DNA Newsroom Audit
 */

export function normalizeUrl(url: string): string {
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
  } catch {
    return url;
  }
}

export function isInternalUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url, baseUrl);
    const baseObj = new URL(baseUrl);
    return urlObj.hostname === baseObj.hostname;
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

export function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

export function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

export function getPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function isHomepage(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return pathname === '/' || pathname === '/index.html' || pathname === '/index.htm';
  } catch {
    return false;
  }
}

export function deduplicateUrls(urls: string[]): string[] {
  const normalized = new Map<string, string>();
  for (const url of urls) {
    const norm = normalizeUrl(url);
    if (!normalized.has(norm)) {
      normalized.set(norm, url);
    }
  }
  return Array.from(normalized.values());
}
