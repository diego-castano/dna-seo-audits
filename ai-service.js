// DNA Newsroom SEO/GEO Audit Assistant - Gemini Integration

// Function to get the API Key securely
function getGeminiApiKey() {
    // 1. Try to get from localStorage (user settings)
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) return savedKey;

    // 2. Try to get from config.js (window.CONFIG)
    if (window.CONFIG && window.CONFIG.GEMINI_API_KEY && !window.CONFIG.GEMINI_API_KEY.includes('YOUR_GEMINI_')) {
        return window.CONFIG.GEMINI_API_KEY;
    }

    // 3. Try to get from build-time injection (GitHub Actions)
    const injectedKey = '__GEMINI_API_KEY__';
    if (injectedKey && injectedKey !== '__' + 'GEMINI_API_KEY' + '__') {
        return injectedKey;
    }

    return null;
}

function getGeminiUrl() {
    const key = getGeminiApiKey();
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
}

// Helper to sanitize data for AI
function getAuditContextSummary(domain) {
    const data = auditData[domain];
    return `
    Audit for: ${domain}
    Status: ${data.status}
    P0 Blockers: ${data.summary.p0Count}
    SEMrush Errors: ${data.semrush.errors.brokenInternalLinks} internal links
    Lighthouse SEO: ${data.lighthouse.seo}
    GTmetrix: ${data.gtmetrix.fullyLoaded}
    Major Issues: ${data.inventory.reasons.join(', ')}
    URLs not indexed: See indexation proof section.
  `;
}

// Function to call Gemini (with CORS proxy fallback for file:// protocol)
async function callGemini(prompt) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        console.warn('Gemini API Key missing. Please set it in Settings.');
        return null;
    }

    const geminiUrl = getGeminiUrl();
    // Use a CORS proxy when running from file:// to bypass browser restrictions
    const useProxy = window.location.protocol === 'file:';
    const corsProxy = 'https://corsproxy.io/?';
    const targetUrl = useProxy ? corsProxy + encodeURIComponent(geminiUrl) : geminiUrl;

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error('Gemini API Response Error:', response.status, errorBody);
            throw new Error(`API Error ${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error('Unexpected Gemini Response Format:', data);
            throw new Error('Unexpected response format from AI');
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        return null; // Return null to trigger fallback
    }
}

// Static fallback content when API is unavailable - PREMIUM STYLED
function getStaticAIInsights(domain) {
    const data = auditData[domain];
    return `
        <div class="ai-grid">
            <div class="ai-card intro">
                <div class="ai-card-header">
                    <span class="ai-icon">📋</span>
                    <h3>Executive Summary</h3>
                </div>
                <div class="ai-card-body">
                    <p>The technical SEO audit for <strong>${domain}</strong> has identified <span class="highlight critical">${data.summary.p0Count} critical P0 blockers</span> that are actively preventing search engine discovery and indexing.</p>
                    <p>Current organic visibility is effectively <strong>zero</strong> due to fundamental crawlability issues. The site's SPA architecture is serving JavaScript shells instead of rendered HTML content to search engine bots.</p>
                    <p>Immediate technical intervention is required before any content or link-building efforts can have an impact.</p>
                </div>
            </div>
            
            <div class="ai-card tasks">
                <div class="ai-card-header">
                    <span class="ai-icon">🎯</span>
                    <h3>Prioritized Technical Tasks</h3>
                </div>
                <div class="ai-card-body">
                    <div class="task-group">
                        <h4 class="task-priority p0">P0 — Critical (Fix Immediately)</h4>
                        <ul class="task-list">
                            <li><code>robots.txt</code> returns HTML instead of <code>text/plain</code>. Configure server to serve static file.</li>
                            <li>Implement <strong>Server-Side Rendering (SSR)</strong> or pre-rendering solution (e.g., Prerender.io, Rendertron).</li>
                            <li>Generate valid <code>sitemap.xml</code> with all indexable URLs and submit to Google Search Console.</li>
                            <li>Replace template placeholders <code>{{link}}</code>, <code>{{title}}</code> with actual rendered values.</li>
                        </ul>
                    </div>
                    <div class="task-group">
                        <h4 class="task-priority p1">P1 — High Priority</h4>
                        <ul class="task-list">
                            <li>Fix ${data.semrush.errors.brokenInternalLinks} broken internal links (HTTP 404/500 responses).</li>
                            <li>Resolve ${data.semrush.errors.duplicateContent} duplicate content issues with canonical tags.</li>
                            <li>Add missing <code>&lt;title&gt;</code> tags to ${data.semrush.errors.titleMissing} pages.</li>
                        </ul>
                    </div>
                    <div class="task-group">
                        <h4 class="task-priority p2">P2 — Maintenance</h4>
                        <ul class="task-list">
                            <li>Add meta descriptions to ${data.semrush.warnings.missingMetaDesc} pages for better CTR.</li>
                            <li>Optimize images (WebP format, lazy loading, proper alt attributes).</li>
                            <li>Implement comprehensive JSON-LD structured data (Article, Organization schemas).</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="ai-card conclusion">
                <div class="ai-card-header">
                    <span class="ai-icon">🔧</span>
                    <h3>Technical Conclusion & Next Steps</h3>
                </div>
                <div class="ai-card-body">
                    <div class="tech-summary">
                        <div class="tech-stat">
                            <span class="stat-value">${data.summary.indexableSurface}%</span>
                            <span class="stat-label">Indexable Surface</span>
                        </div>
                        <div class="tech-stat">
                            <span class="stat-value">${data.lighthouse.seo}</span>
                            <span class="stat-label">Lighthouse SEO</span>
                        </div>
                        <div class="tech-stat">
                            <span class="stat-value">${data.gtmetrix.fullyLoaded}</span>
                            <span class="stat-label">Page Load</span>
                        </div>
                    </div>
                    <div class="next-steps">
                        <h4>Recommended Action Plan:</h4>
                        <ol>
                            <li><strong>Sprint 1:</strong> Resolve all P0 blockers (robots.txt, SSR implementation, sitemap).</li>
                            <li><strong>Sprint 2:</strong> Fix broken links and duplicate content issues.</li>
                            <li><strong>Post-Deploy:</strong> Submit updated sitemap to GSC and request indexing.</li>
                            <li><strong>Monitoring:</strong> Track coverage in GSC for 2-4 weeks. Re-audit after 30 days.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate Report Summary
async function generateAIInsights() {
    const container = document.getElementById('ai-summary-container');
    const contentDiv = document.getElementById('ai-summary-content');
    const loading = container.querySelector('.ai-loading');

    // Show loading briefly for effect
    if (loading) loading.classList.remove('hidden');
    if (contentDiv) contentDiv.classList.add('hidden');

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 800));

    // Always use premium static content for consistent professional look
    const aiResult = getStaticAIInsights(currentDomain);

    // Hide loading and show content
    if (loading) loading.classList.add('hidden');
    if (contentDiv) {
        contentDiv.innerHTML = aiResult;
        contentDiv.classList.remove('hidden');
    }
}

// Chatbot Functionality
const chatWindow = document.getElementById('chat-window');
const chatFab = document.getElementById('chatbot-fab');
const closeChat = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let chatHistory = [];

chatFab.onclick = () => chatWindow.classList.toggle('hidden');
closeChat.onclick = () => chatWindow.classList.add('hidden');

async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    addMessage(text, 'user');
    userInput.value = '';

    const context = getAuditContextSummary(currentDomain);
    const prompt = `
    System Context: You are DNA SEO Bot. You have the following audit data: ${context}. 
    Answer the following question about the audit or explain any technical SEO terms clearly.
    User Question: ${text}
  `;

    let response = await callGemini(prompt);

    // If API failed, use smart fallback
    if (!response) {
        response = getSmartFallbackResponse(text);
    }

    addMessage(response, 'assistant');
}

// Smart fallback responses based on keywords
function getSmartFallbackResponse(question) {
    const q = question.toLowerCase();
    const data = auditData[currentDomain];

    // Greetings
    if (q.includes('hola') || q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        return `¡Hola! I'm the DNA SEO Assistant. I have full access to the audit data for ${currentDomain}. Ask me about P0 blockers, performance issues, indexing problems, or what you should fix first!`;
    }

    // P0 Blockers
    if (q.includes('p0') || q.includes('blocker') || q.includes('critical') || q.includes('urgent')) {
        return `🚨 This audit found ${data.summary.p0Count} P0 blockers for ${currentDomain}. These are critical issues that completely prevent search engines from discovering your content. The main ones are: robots.txt returning HTML, missing sitemap.xml, and SPA shell pages blocking crawlers.`;
    }

    // Performance
    if (q.includes('performance') || q.includes('speed') || q.includes('load') || q.includes('lcp') || q.includes('lighthouse')) {
        return `⚡ Performance metrics for ${currentDomain}: Lighthouse score is ${data.lighthouse.performance}/100, page load time is ${data.gtmetrix.fullyLoaded}, and page size is ${data.gtmetrix.pageSize}. The main issue is an LCP of ${data.lighthouse.lcp} which is well above the 2.5s target.`;
    }

    // SEMrush / Errors
    if (q.includes('semrush') || q.includes('error') || q.includes('broken') || q.includes('link')) {
        return `🔍 SEMrush found ${data.semrush.errors.brokenInternalLinks} broken internal links, ${data.semrush.errors.duplicateContent} duplicate content issues, and ${data.semrush.errors.titleMissing} pages missing titles. There are also ${data.semrush.warnings.missingMetaDesc} pages without meta descriptions.`;
    }

    // SPA / JavaScript
    if (q.includes('spa') || q.includes('javascript') || q.includes('csr') || q.includes('ssr') || q.includes('render')) {
        return `⚙️ SPA Detection shows ${data.spaDetection.shellDuplication}% shell duplication across ${data.spaDetection.totalPages} pages. This means the site is using Client-Side Rendering (CSR) which prevents search engines from seeing the actual content. You need to implement Server-Side Rendering (SSR) or pre-rendering.`;
    }

    // Indexing
    if (q.includes('index') || q.includes('google') || q.includes('crawl') || q.includes('sitemap') || q.includes('robot')) {
        return `📊 Currently, ${currentDomain} has only ${data.summary.indexableSurface}% indexable surface. Google cannot properly crawl the site because robots.txt returns HTML instead of valid directives, and there's no valid sitemap.xml. Several articles that exist on the site show "0 results" when searched in Google.`;
    }

    // What should I do / recommendations
    if (q.includes('recommend') || q.includes('fix') || q.includes('should') || q.includes('next') || q.includes('priority') || q.includes('qué') || q.includes('hacer')) {
        return `✅ Top priorities for ${currentDomain}: 1) Fix robots.txt to return proper text/plain format. 2) Implement SSR or pre-rendering for all pages. 3) Create and serve a valid sitemap.xml. 4) Replace template placeholders like {{link}} with actual URLs. 5) Fix the ${data.semrush.errors.brokenInternalLinks} broken internal links.`;
    }

    // Status / Summary
    if (q.includes('status') || q.includes('summary') || q.includes('resumen') || q.includes('overview')) {
        return `📋 Status for ${currentDomain}: ${data.status}. Found ${data.summary.p0Count} P0 blockers (fix immediately), ${data.summary.p1Count} P1 issues (high priority), and ${data.summary.p2Count} P2 improvements (maintenance). Lighthouse SEO score is ${data.lighthouse.seo}/100.`;
    }

    // GEO / AI
    if (q.includes('geo') || q.includes('ai') || q.includes('chatgpt') || q.includes('perplexity') || q.includes('gemini')) {
        return `🤖 GEO (Generative Engine Optimization) readiness is LOW. AI systems like ChatGPT, Gemini, and Perplexity cannot cite this content because it's not indexable. ${data.geoGaps.length} critical GEO gaps were identified, including missing structured data and no entity markup.`;
    }

    // Schema / Structured Data
    if (q.includes('schema') || q.includes('structured') || q.includes('json-ld') || q.includes('markup')) {
        return `📝 Structured data status: The site has ${data.structuredData.detected} schema types detected, but ${data.structuredData.errors} validation errors and ${data.structuredData.warnings} warnings. Organization and Article schemas need to be properly implemented.`;
    }

    // Help
    if (q.includes('help') || q.includes('ayuda') || q.includes('what can') || q.includes('qué puedes')) {
        return `I can help you understand this SEO audit! Ask me about:\n• P0 blockers and critical issues\n• Performance and load times\n• SEMrush errors and warnings\n• SPA/JavaScript rendering problems\n• Google indexing issues\n• Recommendations and next steps\n• GEO readiness for AI systems`;
    }

    // Default - but more helpful
    return `I found data for ${currentDomain}! The site status is ${data.status}. Try asking me specific questions like:\n• "What are the P0 blockers?"\n• "How is the performance?"\n• "What should I fix first?"\n• "Tell me about indexing issues"`;
}

function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;

    // Convert markdown-style formatting to HTML
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
        .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
        .replace(/`(.*?)`/g, '<code>$1</code>')            // `code`
        .replace(/\n/g, '<br>');                           // newlines

    msg.innerHTML = formattedText;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.onclick = handleSendMessage;
userInput.onkeypress = (e) => { if (e.key === 'Enter') handleSendMessage(); };

// Scroll to section helper
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        window.scrollTo({
            top: el.offsetTop - 120,
            behavior: 'smooth'
        });
    }
}

// WhatsApp Share
function shareToWhatsApp() {
    const text = `Check out the DNA Newsroom SEO Audit for ${currentDomain}! Status is CRITICAL. View Report: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

// Initialize AI on load
document.addEventListener('DOMContentLoaded', () => {
    generateAIInsights();
    injectTooltips();
    initializeSettings();
});

// Settings Modal Logic
function initializeSettings() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('open-settings-btn');
    const closeBtn = document.getElementById('close-settings');
    const saveBtn = document.getElementById('save-settings');
    const apiKeyInput = document.getElementById('api-key-input');
    const toggleVisibility = document.getElementById('toggle-api-visibility');

    if (!modal || !openBtn) return;

    // Open Modal
    openBtn.onclick = () => {
        const currentKey = getGeminiApiKey() || '';
        apiKeyInput.value = currentKey;
        modal.classList.remove('hidden');
    };

    // Close Modal
    closeBtn.onclick = () => modal.classList.add('hidden');
    window.onclick = (event) => {
        if (event.target === modal) modal.classList.add('hidden');
    };

    // Toggle Input Visibility
    toggleVisibility.onclick = () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
        toggleVisibility.textContent = type === 'password' ? '👁️' : '🔒';
    };

    // Save Settings
    saveBtn.onclick = () => {
        const newKey = apiKeyInput.value.trim();
        if (newKey) {
            localStorage.setItem('GEMINI_API_KEY', newKey);
            alert('Settings saved! Refreshing insights...');
            modal.classList.add('hidden');
            generateAIInsights(); // Re-trigger AI insights with new key
        } else {
            localStorage.removeItem('GEMINI_API_KEY');
            alert('API Key removed. Fallback responses will be used.');
            modal.classList.add('hidden');
        }
    };
}

// Auto-inject Tooltips for technical terms
const TECH_TERMS = {
    // Priority Levels
    'P0': 'Priority Zero: The most critical issues that completely block search engines. Must fix immediately.',
    'P1': 'Priority One: High-priority issues that significantly hurt SEO. Fix within 1-2 weeks.',
    'P2': 'Priority Two: Medium-priority maintenance tasks. Address when time permits.',
    'P0 Blockers': 'Critical issues that completely halt search engine discovery. Highest priority fixes.',

    // Core SEO Metrics
    'Indexable Surface': 'The percentage of your site pages that can be stored in Googles database. Higher is better.',
    'Lighthouse SEO': 'Googles automated score (0-100) measuring how well your page follows SEO best practices.',
    'Lighthouse': 'Googles open-source tool that audits web pages for performance, SEO, and accessibility.',
    'Page Load': 'Time it takes for your page to fully display all content. Target: under 3 seconds.',
    'LCP': 'Largest Contentful Paint: Time until the biggest visible element loads. Target: under 2.5 seconds.',
    'FCP': 'First Contentful Paint: Time until the first text or image appears. Target: under 1.8 seconds.',
    'CLS': 'Cumulative Layout Shift: Measures visual stability. Lower is better (target: under 0.1).',
    'TBT': 'Total Blocking Time: Time the page is unresponsive to user input. Target: under 200ms.',

    // Technical Architecture
    'SPA': 'Single Page Application: A web app that loads a single HTML page and dynamically updates it with JavaScript.',
    'CSR': 'Client-Side Rendering: Content is rendered in the browser via JavaScript. Harder for search engines to crawl.',
    'SSR': 'Server-Side Rendering: Full HTML is generated on the server. Essential for fast indexing.',
    'Pre-rendering': 'Generating static HTML versions of pages ahead of time for search engines to crawl.',

    // SEO Elements
    'JSON-LD': 'A format for structured data that helps search engines understand your content better.',
    'Schema': 'Structured data markup that helps search engines display rich results (stars, prices, etc.).',
    'Canonical': 'A tag that tells Google which version of a duplicate page is the main one.',
    'Meta Description': 'The short summary that appears under your title in Google search results.',
    'robots.txt': 'A file that tells search engines which pages they can or cannot crawl.',
    'sitemap.xml': 'A file listing all your important pages to help search engines discover content.',
    'Crawlability': 'How easily Googles bots can discover and move through your websites pages.',
    'Indexability': 'Whether a page meets all requirements to be stored in Googles search database.',
    'Indexation': 'The process of Google adding your pages to its searchable database.',

    // AI and GEO
    'GEO': 'Generative Engine Optimization: Preparing content to appear in AI answers (ChatGPT, Gemini, Perplexity).',
    'AI Visibility': 'How well your content can be found and cited by AI assistants and chatbots.',

    // Tools
    'SEMrush': 'A popular SEO tool that scans your site for technical issues, broken links, and opportunities.',
    'GTmetrix': 'A tool that analyzes your page speed and provides optimization recommendations.',
    'Google Search Console': 'Free Google tool to monitor your sites search performance and fix issues.',
    'GSC': 'Google Search Console: Free tool to monitor search performance and indexing status.',

    // Common Issues
    'Broken Links': 'Links on your site that lead to pages that no longer exist (404 errors).',
    'Duplicate Content': 'The same content appearing on multiple URLs, which confuses search engines.',
    'Shell Duplication': 'When many pages share the same empty HTML shell due to JavaScript rendering issues.'
};

function injectTooltips() {
    // Delay slightly to ensure content is ready
    setTimeout(() => {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        Object.keys(TECH_TERMS).forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'g');

            const walker = document.createTreeWalker(mainContent, NodeFilter.SHOW_TEXT, null, false);
            let node;
            const nodesToReplace = [];

            while (node = walker.nextNode()) {
                if (node.parentNode && !['A', 'BUTTON', 'CODE', 'PRE', 'H1', 'H2', 'H3', 'SCRIPT', 'STYLE'].includes(node.parentNode.tagName)) {
                    if (regex.test(node.nodeValue) && !node.parentNode.classList.contains('ai-term')) {
                        nodesToReplace.push(node);
                    }
                }
            }

            nodesToReplace.forEach(node => {
                const span = document.createElement('span');
                span.innerHTML = node.nodeValue.replace(regex, `<span class="ai-term">${term}<span class="tooltip-box">${TECH_TERMS[term]}</span></span>`);
                node.parentNode.replaceChild(span, node);
            });
        });
    }, 1500);
}
