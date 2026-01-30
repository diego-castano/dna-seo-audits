import { FetchResult, FetcherConfig, UA_PROFILES, UAComparisonEntry, BodySignature } from '../models/types';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);

const DEFAULT_CONFIG: FetcherConfig = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  userAgent: UA_PROFILES.default,
  concurrency: 5,
  rateLimit: 10
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function decompressGzip(buffer: Buffer): Promise<string> {
  try {
    const decompressed = await gunzip(buffer);
    return decompressed.toString('utf-8');
  } catch (error) {
    throw new Error(`Gzip decompression failed: ${error}`);
  }
}

export async function fetchUrl(
  url: string,
  config: Partial<FetcherConfig> = {}
): Promise<FetchResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  
  let lastError: Error | null = null;
  let redirectChain: string[] = [];
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
          const headers: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
          });

          const contentType = headers['content-type'] || '';
          const contentEncoding = headers['content-encoding'] || '';
          const contentLength = parseInt(headers['content-length'] || '0', 10);
          const cacheControl = headers['cache-control'] || '';
          const xRobotsTag = headers['x-robots-tag'] || '';

          // Get body
          let body: string;
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
            } catch {
              body = buffer.toString('utf-8');
            }
          } else {
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
        } catch (fetchError) {
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

    } catch (error) {
      lastError = error as Error;
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

export async function fetchBatch(
  urls: string[],
  config: Partial<FetcherConfig> = {},
  onProgress?: (completed: number, total: number) => void
): Promise<FetchResult[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const results: FetchResult[] = [];
  const queue = [...urls];
  let completed = 0;
  let lastRequestTime = 0;
  const minInterval = 1000 / cfg.rateLimit;

  const workers = Array(cfg.concurrency).fill(null).map(async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;

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

export async function fetchWithMultipleUAs(
  url: string,
  uaProfiles: string[] = ['default', 'googlebot', 'bingbot'],
  config: Partial<FetcherConfig> = {}
): Promise<UAComparisonEntry[]> {
  const results: UAComparisonEntry[] = [];

  for (const profile of uaProfiles) {
    const ua = UA_PROFILES[profile as keyof typeof UA_PROFILES] || profile;
    const result = await fetchUrl(url, { ...config, userAgent: ua });
    
    // Import detectBodySignature dynamically to avoid circular deps
    const { detectBodySignature } = await import('./parser');
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

export { UA_PROFILES };
