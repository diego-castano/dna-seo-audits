# DNA Newsroom SEO/GEO Audit Dashboard - Guía Completa

## Resumen Ejecutivo

El Dashboard SEO/GEO es una interfaz web profesional que consolida y visualiza todos los hallazgos de auditoría de múltiples fuentes:
- **Audit Runner** (análisis técnico automatizado)
- **SEMrush** (broken links, metadata, JS impact)
- **Lighthouse** (performance, SEO, accessibility)
- **GTmetrix** (load times, page size)

**Ubicación**: `seo-geo-dashboard/`

**Fecha de creación**: Enero 30, 2026

**Sitios analizados**: 
- newsroom.dna.online
- newsroom.upscrolled.com

## Características Principales

### 1. Multi-Domain Support
- Tabs para cambiar entre dominios
- Cada tab muestra status pill (CRITICAL/WARN/PASS)
- Counts de issues por prioridad (P0/P1/P2)

### 2. Executive Summary
- **Status Banner**: Estado general con explicación
- **KPI Cards** (6 métricas clave):
  - P0 Blockers count
  - Indexable Surface score (0-100)
  - Inventory Confidence (LOW/MED/HIGH)
  - SEMrush Errors total
  - Lighthouse SEO score
  - GTmetrix Load time
- **Key Findings**: 8 bullets con íconos de severidad

### 3. P0 Blockers Section
Cards expandibles para cada blocker crítico:
- **robots.txt returns HTML**
  - Impact explanation
  - Evidence snippet (primeras 10 líneas)
  - Detection signals (Content-Type, body signature, hash match)
  - Link a recomendación completa
- **sitemap.xml returns HTML** (6 variantes probadas)
- **Template placeholders** ({{link}}, {{url}}, {{fileLink}})
- **87% shell duplication** (CSR sin SSR)

### 4. Crawlability & Discovery
- **Link Graph Health**:
  - Total anchors: 24
  - Internal anchors: 17
  - Placeholder anchors: 6
  - Crawlable ratio: 46%
- **Listing Routes**: 7 rutas encontradas (todas shell)
- **Pagination**: No detectada
- **Warning Callout**: Placeholders detectados

### 5. Indexability Analysis
Tabla per-URL con columnas:
- URL
- Status code
- Title (empty/present)
- Canonical (missing/present)
- OG Tags
- JSON-LD count
- Issues summary

### 6. SPA/JS Detection
- **Shell Cluster Visualization**: Barra de progreso mostrando 87%
- **Soft 404 Detection**: 15 de 23 páginas sospechosas
- **Detection Criteria**:
  - Status 200 pero título vacío
  - OG tags vacíos
  - Texto bajo (< 500 chars)
  - Parte de shell cluster
- **Info Callout**: Por qué importa para AI/GEO

### 7. Structured Data & GEO Readiness
**Checklist con 8 items**:
- ✗ Organization Schema
- ✗ WebSite Schema
- ✗ Article/NewsArticle
- ✗ BreadcrumbList
- ✗ FAQPage Schema
- ✗ RSS Feed
- ⚠ llms.txt (found but issues)
- ✗ Open Graph (partial)

**GEO Posture**: LOW - structured data missing, content hubs not crawlable

### 8. Content Inventory
- **Inventory Confidence Banner**: LOW con 4 razones
- **Inventory Grid** (6 tipos):
  - Home: 1
  - Listings: 0 ⚠️
  - Articles: 0 ⚠️
  - Trust Pages: 0 ⚠️
  - Admin Routes: 4 🔴
  - Other/Unknown: 18
- **Coverage Estimate**: 23 URLs, likely incomplete

### 9. GEO Content Gap Analysis
Tabla con páginas faltantes/necesitan enhancement:
- `/about` - P1 - Needs Enhancement
- `/contact` - P1 - Needs Enhancement
- `/privacy` - P1 - Needs Enhancement
- `/terms` - P1 - Needs Enhancement
- `/faq` - P1 - Needs Enhancement
- `/editorial-policy` - P1 - Critical for news credibility
- `/authors` - P1 - Missing/Not Crawlable
- `/topics` - P1 - Missing/Not Crawlable
- `/rss.xml` - P1 - Returns HTML
- `/methodology` - P2 - Missing

### 10. SEMrush Analysis
**Errors Summary**:
- 250 Broken internal links
- 120 Broken JS/CSS files
- 104 Duplicate content issues
- 73 Missing title tags
- 46 Duplicate title tags
- 21 Broken images
- 16 4xx errors
- 13 5xx errors

**Warnings Summary**:
- 119/119 Missing meta descriptions
- 117/119 Missing H1 tags
- 110/119 Low text-to-HTML ratio
- 299 Missing alt attributes
- 2,541 Uncompressed JS/CSS
- 662 Non-descriptive anchors
- 304 Temporary redirects

**JS Impact (newsroom.upscrolled.com)**:
- Before JS: 141/141 missing title, 141/141 missing description
- After JS: 80/141 still missing title, 141/141 still missing description

### 11. Performance Analysis
**Lighthouse Scores**:
- Performance: 59 ⚠️
- SEO: 67 ⚠️
- Accessibility: 52 🔴
- Best Practices: 77 ⚠️
- LCP: 13.4s 🔴 (target: < 2.5s)

**GTmetrix Results**:
- Total Requests: 103
- Page Size: 4.3 MB
- onLoad Time: 7.6s ⚠️
- Fully Loaded: 8.2s

### 12. Recommendations
Prioritized action plan con 6 recomendaciones principales:

**P0 Recommendations**:
1. **Fix robots.txt and sitemap.xml serving HTML**
   - Root Cause: SPA catch-all rewrite
   - Option A: Exclude from rewrite rules
   - Option B: Serve static files with sitemap directive
   - Validation: `curl -s https://newsroom.dna.online/robots.txt | head -5`
   - Target Team: Dev

2. **Implement SSR/Pre-rendering**
   - Root Cause: CSR-only architecture
   - Option A: Use prerender.io for critical pages
   - Option B: Migrate to Next.js/Nuxt
   - Target Team: Dev

3. **Replace template placeholders**
   - Root Cause: {{link}}, {{url}} not resolved server-side
   - Target Team: Dev

**P1 Recommendations**:
4. **Add server-side metadata**
   - 119/119 pages missing meta descriptions
   - Target Team: Dev

5. **Implement JSON-LD structured data**
   - Add Organization, NewsArticle, BreadcrumbList, FAQPage schemas
   - Target Team: Dev + Content

6. **Block/noindex admin routes**
   - Add to robots.txt Disallow + X-Robots-Tag: noindex
   - Target Team: Dev

### 13. Appendix
Collapsible evidence sections:
- robots.txt Evidence (HTML snippet)
- Placeholder URLs Found (SEMrush)
- Broken Links Sample (Top 10)

Export buttons:
- Download Full JSON Report
- Print Report

## Diseño y UX

### Color System
- **CRITICAL**: Red (#dc2626) - P0 blockers
- **FAIL**: Orange (#ea580c) - Severe issues
- **WARN**: Yellow (#ca8a04) - Should be addressed
- **PASS**: Green (#16a34a) - Check passed
- **Accent**: Blue (#3b82f6) - Interactive elements

### Typography
- Font: Inter (Google Fonts)
- Hierarchy: Clear h1-h5 with proper weights
- Code: Monospace for URLs, commands, snippets

### Layout
- **Header**: Logo, title, date, export buttons
- **Domain Tabs**: Sticky navigation between sites
- **Sidebar**: Filters + quick navigation (collapsible)
- **Main Content**: Sections with smooth scroll

### Animations
- **KPI Counters**: Count-up animation (800ms)
- **Finding Items**: Staggered slide-in
- **Blocker Cards**: Expand/collapse with height transition
- **Evidence Snippets**: Typewriter effect (subtle)
- **Scroll**: Fade-in on intersection

### Responsive Design
- Desktop: Full sidebar + 2-column layouts
- Tablet: Sidebar hidden, single column
- Mobile: Stacked cards, 2-column KPI grid

## Datos Consolidados

### newsroom.dna.online

**Status**: CRITICAL

**Summary**:
- P0 Blockers: 12
- P1 Issues: 15
- P2 Issues: 44
- Total Findings: 71
- Indexable Surface: 5/100
- Inventory Confidence: LOW
- Pages Discovered: 23

**SEMrush**:
- Pages Audited: 119
- Errors: 250+ broken links, 120 broken JS/CSS, 104 duplicate content
- Warnings: 119/119 missing meta desc, 117/119 missing H1

**Lighthouse**:
- Performance: 59
- SEO: 67
- Accessibility: 52
- Best Practices: 77
- LCP: 13.4s

**GTmetrix**:
- Requests: 103
- Page Size: 4.3 MB
- onLoad: 7.6s
- Fully Loaded: 8.2s

**Technical SEO**:
- robots.txt: CRITICAL (HTML)
- sitemap.xml: CRITICAL (all 6 variants HTML)
- Catch-all: Detected (robots matches home)

**Crawlability**:
- Total Anchors: 24
- Internal: 17
- Placeholders: 6
- Crawlable Ratio: 46%
- Listing Routes: 7 (all shell)
- Pagination: Not found

**SPA Detection**:
- Shell Duplication: 87%
- Shell Cluster Size: 20/23
- Soft 404s: 15

**Structured Data**:
- JSON-LD: 0
- All schemas: Missing
- RSS: Not found

**Broken Links** (top patterns):
- `/blogs/updates/2` → 404 (50+ pages)
- `/company-files/download/*` → 403 (multiple)
- `/blog-posts/download-all/*` → 502
- `/microsoft/login` → 500

**Admin Routes Exposed**:
- `/administrators/view-account`
- `/administrators/view-dashboard`
- `/administrators/view-login`
- `/companies/view-login`
- `/companies/logout`

### newsroom.upscrolled.com

**Status**: CRITICAL

**Summary**: Identical to newsroom.dna.online

**SEMrush**:
- Pages Audited: 152
- Errors: 86 broken links, 143 broken JS/CSS, 129 duplicate content
- Warnings: 141/141 missing meta desc, 141/141 missing H1
- JS Impact: 141/141 no title before JS, 80/141 still missing after JS

**Lighthouse**:
- Performance: 56
- SEO: 67
- Accessibility: 52
- Best Practices: 77
- LCP: 11.2s

**GTmetrix**:
- Requests: 111
- Page Size: 2.2 MB
- onLoad: 5.6s
- Fully Loaded: 6.1s

**Structured Data**:
- llms.txt: Found but has formatting issues

**Placeholder URLs** (SEMrush encontró):
- `https://newsroom.upscrolled.com/{{fileLink}}`
- `https://newsroom.upscrolled.com/{{link}}`
- `https://newsroom.upscrolled.com/{{url}}`
- `https://newsroom.upscrolled.com/blog-posts/view/5849/{{downloadLink}}`
- `https://newsroom.upscrolled.com/blog-posts/view/5873/{{fileLink}}`
- `https://newsroom.upscrolled.com/companies/{{fileLink}}`

**Admin Routes Exposed**:
- Same as newsroom.dna.online plus:
- `/microsoft/login` (500 error)

## Uso del Dashboard

### Abrir el Dashboard

```bash
# Opción 1: Abrir directamente
open seo-geo-dashboard/index.html

# Opción 2: Servir con servidor local
cd seo-geo-dashboard
python3 -m http.server 8000
# Abrir http://localhost:8000
```

### Navegación

1. **Cambiar de dominio**: Click en tabs superiores
2. **Filtrar findings**: Usar checkboxes en sidebar
3. **Ver detalles**: Click en blocker cards para expandir
4. **Copiar evidencia**: Click en botón "Copy" en snippets
5. **Navegar secciones**: Click en quick navigation links
6. **Exportar**: Usar botones en header

### Funcionalidades Interactivas

**Toggle Technical View**:
- Click en "Non-Technical View" para ocultar detalles técnicos
- Útil para presentaciones a stakeholders no técnicos

**Export PDF**:
- Click en "PDF" para imprimir/guardar como PDF
- Usa window.print() del navegador

**Export JSON**:
- Click en "JSON" para descargar datos completos
- Archivo: `{domain}-audit-report.json`

**Share Report**:
- Click en "Share" para copiar URL al clipboard

**Copy Evidence**:
- Click en "Copy" junto a snippets de evidencia
- Copia el código al clipboard

### Filtros Disponibles

**Por Severidad**:
- CRITICAL (P0 blockers)
- FAIL (severe issues)
- WARN (should be addressed)
- PASS (checks passed)

**Por Categoría**:
- Technical SEO
- Crawlability
- Indexability
- SPA/JS Detection
- Structured Data
- GEO Readiness

**Por Fuente**:
- Audit Runner
- SEMrush
- Lighthouse
- GTmetrix

## Actualizar Datos

Para actualizar el dashboard con nuevos datos de auditoría:

### 1. Ejecutar Nuevo Audit

```bash
cd dna-newsroom-audit
npm run audit -- https://newsroom.dna.online/ https://newsroom.upscrolled.com/ \
  --max-urls 30 \
  --formats json \
  --output ./audit-reports-new
```

### 2. Editar app.js

Abrir `seo-geo-dashboard/app.js` y actualizar el objeto `auditData`:

```javascript
const auditData = {
  'newsroom.dna.online': {
    status: 'CRITICAL',  // o 'WARN', 'PASS'
    timestamp: '2026-01-30T03:20:42.351Z',
    siteMode: 'agency',  // o 'newsroom', 'hybrid'
    summary: {
      p0Count: 12,
      p1Count: 15,
      p2Count: 44,
      // ... actualizar con nuevos valores
    },
    // ... resto de datos
  }
};
```

### 3. Actualizar Métricas de SEMrush

Si tienes nuevos reportes de SEMrush:

```javascript
semrush: {
  errors: {
    brokenInternalLinks: 250,  // actualizar
    fourXXErrors: 16,
    // ...
  },
  warnings: {
    missingMetaDesc: 119,  // actualizar
    // ...
  }
}
```

### 4. Actualizar Lighthouse/GTmetrix

```javascript
lighthouse: {
  performance: 59,  // actualizar
  seo: 67,
  // ...
},
gtmetrix: {
  requests: 103,  // actualizar
  pageSize: '4.3 MB',
  // ...
}
```

### 5. Refrescar Dashboard

Simplemente recargar `index.html` en el navegador.

## Personalización

### Cambiar Colores

Editar variables CSS en `styles.css`:

```css
:root {
  --critical: #dc2626;  /* Cambiar color CRITICAL */
  --fail: #ea580c;      /* Cambiar color FAIL */
  --warn: #ca8a04;      /* Cambiar color WARN */
  --pass: #16a34a;      /* Cambiar color PASS */
  --accent: #3b82f6;    /* Cambiar color accent */
}
```

### Cambiar Logo

Reemplazar `seo-geo-dashboard/logo.png` con tu logo.

### Agregar Nueva Sección

1. Agregar HTML en `index.html`:

```html
<section id="nueva-seccion" class="section">
  <div class="section-header">
    <h2>Nueva Sección</h2>
    <span class="section-badge">Badge</span>
  </div>
  <!-- Contenido -->
</section>
```

2. Agregar link en sidebar:

```html
<a href="#nueva-seccion" class="nav-link">Nueva Sección</a>
```

3. Agregar estilos si necesario en `styles.css`

### Agregar Nuevo Dominio

1. Agregar tab en HTML:

```html
<button class="domain-tab" data-domain="nuevo-dominio.com" onclick="switchDomain('nuevo-dominio.com')">
  <span class="domain-name">nuevo-dominio.com</span>
  <span class="status-pill critical">CRITICAL</span>
  <div class="tab-counts">
    <span class="count p0">P0: X</span>
    <span class="count p1">P1: Y</span>
    <span class="count p2">P2: Z</span>
  </div>
</button>
```

2. Agregar datos en `app.js`:

```javascript
const auditData = {
  // ... dominios existentes
  'nuevo-dominio.com': {
    status: 'CRITICAL',
    // ... datos completos
  }
};
```

## Troubleshooting

### Dashboard no carga

**Problema**: Página en blanco o errores en consola

**Solución**:
1. Verificar que todos los archivos estén presentes (index.html, styles.css, app.js, logo.png)
2. Abrir DevTools (F12) y revisar errores en Console
3. Verificar que app.js no tenga errores de sintaxis

### Animaciones no funcionan

**Problema**: Counters no animan, cards no expanden

**Solución**:
1. Verificar que JavaScript esté habilitado
2. Probar en navegador diferente (Chrome, Firefox)
3. Revisar Console para errores

### Estilos rotos

**Problema**: Colores incorrectos, layout roto

**Solución**:
1. Verificar que styles.css esté cargando (Network tab en DevTools)
2. Limpiar caché del navegador (Cmd+Shift+R en Mac)
3. Verificar que no haya conflictos con extensiones del navegador

### Logo no aparece

**Problema**: Imagen rota en header

**Solución**:
1. Verificar que logo.png exista en `seo-geo-dashboard/`
2. Verificar ruta en HTML: `<img src="logo.png">`
3. Verificar permisos del archivo

### Export JSON no funciona

**Problema**: Click en "JSON" no descarga archivo

**Solución**:
1. Verificar que navegador permita descargas
2. Revisar Console para errores
3. Probar en modo incógnito (sin extensiones)

## Mejoras Futuras

### Corto Plazo
- [ ] Agregar más gráficos (charts.js)
- [ ] Implementar búsqueda en tablas
- [ ] Agregar tooltips explicativos
- [ ] Modo oscuro (dark mode)
- [ ] Comparación histórica (before/after)

### Mediano Plazo
- [ ] Backend API para datos dinámicos
- [ ] Autenticación de usuarios
- [ ] Scheduled audits automáticos
- [ ] Email notifications
- [ ] Integración con Jira/Trello

### Largo Plazo
- [ ] Multi-tenant support
- [ ] Custom branding per client
- [ ] AI-powered recommendations
- [ ] Automated fix deployment
- [ ] Real-time monitoring

## Referencias

- **Audit Runner**: `dna-newsroom-audit/`
- **Documentación Técnica**: `DOCS/04-ARCHITECTURE.md`
- **Guía de Findings**: `DOCS/05-FINDINGS-GUIDE.md`
- **Especificaciones**: `.kiro/specs/audit-for-sites/`

## Contacto

Para preguntas sobre el dashboard:
1. Revisar esta documentación
2. Revisar código fuente (bien comentado)
3. Revisar DOCS/ para contexto técnico
