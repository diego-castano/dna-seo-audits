# DNA Newsroom SEO/GEO Audit Runner - Findings & Fix Guide

## Overview

Esta guía explica cada tipo de finding que el sistema puede detectar, su impacto en SEO/GEO, y cómo implementar las correcciones recomendadas.

## Tabla de Contenidos

1. [Technical SEO Issues](#technical-seo-issues)
2. [Crawlability Issues](#crawlability-issues)
3. [Indexability Issues](#indexability-issues)
4. [SPA/CSR Issues](#spacsr-issues)
5. [Structured Data Issues](#structured-data-issues)
6. [GEO Readiness Gaps](#geo-readiness-gaps)

---

## Technical SEO Issues

### 🔴 CRITICAL: robots.txt Returns HTML

**Qué significa**: El archivo `/robots.txt` está devolviendo HTML en lugar de texto plano.

**Por qué ocurre**: El catch-all rewrite de tu SPA (React/Vue/Angular) está interceptando la petición a `/robots.txt` y sirviendo el app shell.

**Impacto SEO**:
- Los motores de búsqueda no pueden leer las directivas de crawling
- No descubren el sitemap
- Pueden considerar el sitio mal configurado
- **Severidad**: P0 blocker

**Cómo verificar**:
```bash
curl -s https://newsroom.dna.online/robots.txt | head -10
```

**Resultado esperado**:
```
User-agent: *
Allow: /
Sitemap: https://newsroom.dna.online/sitemap.xml
```

**Resultado actual (problema)**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DNA Newsroom</title>
  <script src="/static/js/main.js"></script>
```

**Cómo corregir**:

#### Opción A: Excluir de rewrite (mínimo)

**Nginx**:
```nginx
location = /robots.txt {
  root /var/www/static;
  try_files $uri =404;
}

location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess)**:
```apache
RewriteEngine On
RewriteRule ^robots\.txt$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Cloudflare Workers**:
```javascript
addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/robots.txt') {
    return event.respondWith(
      fetch('https://origin.example.com/robots.txt')
    );
  }
  
  // Normal SPA handling
  event.respondWith(handleRequest(event.request));
});
```

#### Opción B: Servir archivo estático (ideal)

1. Crear `/public/robots.txt` en tu proyecto:
```
User-agent: *
Allow: /

# Sitemap
Sitemap: https://newsroom.dna.online/sitemap.xml

# Disallow admin routes
Disallow: /admin
Disallow: /login
Disallow: /dashboard
```

2. Configurar build para copiar a dist:
```json
// package.json
{
  "scripts": {
    "build": "vite build && cp public/robots.txt dist/"
  }
}
```

3. Configurar servidor para servir estático antes de SPA:
```nginx
location = /robots.txt {
  root /var/www/dist;
  add_header Content-Type text/plain;
}
```

**Validar corrección**:
```bash
# Debe mostrar "User-agent:" no HTML
curl -s https://newsroom.dna.online/robots.txt | head -5

# Content-Type debe ser text/plain
curl -I https://newsroom.dna.online/robots.txt | grep -i content-type
```

---

### 🔴 CRITICAL: sitemap.xml Returns HTML

**Qué significa**: El archivo `/sitemap.xml` está devolviendo HTML en lugar de XML.

**Por qué ocurre**: Mismo problema que robots.txt - catch-all rewrite.

**Impacto SEO**:
- Los motores de búsqueda no pueden descubrir URLs
- Indexación incompleta o nula
- **Severidad**: P0 blocker

**Cómo verificar**:
```bash
curl -s https://newsroom.dna.online/sitemap.xml | head -10
```

**Resultado esperado**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://newsroom.dna.online/</loc>
    <lastmod>2025-01-30</lastmod>
  </url>
```

**Resultado actual (problema)**:
```html
<!DOCTYPE html>
<html>...
```

**Cómo corregir**:

#### Opción A: Excluir de rewrite (mínimo)

Similar a robots.txt, excluir `/sitemap*.xml` del rewrite:

**Nginx**:
```nginx
location ~* ^/sitemap.*\.xml$ {
  root /var/www/static;
  add_header Content-Type application/xml;
  try_files $uri =404;
}
```

**Apache**:
```apache
RewriteRule ^sitemap.*\.xml$ - [L]
```

#### Opción B: Generar sitemap dinámico (ideal)

1. Crear endpoint API para generar sitemap:
```typescript
// api/sitemap.xml.ts
export async function GET() {
  const posts = await db.posts.findAll({ published: true });
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://newsroom.dna.online/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
  ${posts.map(post => `
  <url>
    <loc>https://newsroom.dna.online/blog-posts/view/${post.id}/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  });
}
```

2. Configurar rewrite para este endpoint:
```nginx
location = /sitemap.xml {
  proxy_pass http://api:3000/api/sitemap.xml;
  add_header Content-Type application/xml;
}
```

**Validar corrección**:
```bash
# Debe mostrar XML no HTML
curl -s https://newsroom.dna.online/sitemap.xml | head -5

# Debe parsear como XML
curl -s https://newsroom.dna.online/sitemap.xml | xmllint --format - | head
```

---

### 🔴 CRITICAL: Catch-All Fallback Detected

**Qué significa**: Múltiples URLs (robots, sitemap, páginas) devuelven el mismo HTML (app shell).

**Por qué ocurre**: El servidor no diferencia entre rutas válidas e inválidas, siempre sirve el SPA.

**Impacto SEO**:
- Soft 404s (páginas que no existen pero devuelven 200)
- Crawlers ven contenido duplicado
- Desperdicio de crawl budget
- **Severidad**: P0 blocker

**Cómo verificar**:
```bash
# Comparar hashes de diferentes URLs
curl -s https://newsroom.dna.online/robots.txt | md5
curl -s https://newsroom.dna.online/sitemap.xml | md5
curl -s https://newsroom.dna.online/ | md5
curl -s https://newsroom.dna.online/ruta-inexistente | md5

# Si todos son iguales = catch-all fallback
```

**Cómo corregir**:

#### Opción A: Configurar 404 real para rutas inválidas

**Nginx**:
```nginx
location / {
  # Intentar archivo, luego directorio, luego SPA, luego 404
  try_files $uri $uri/ /index.html =404;
}

# Para rutas API que no existen
location /api/ {
  proxy_pass http://backend:3000;
  # Si backend devuelve 404, no servir SPA
  proxy_intercept_errors on;
  error_page 404 = @404;
}

location @404 {
  return 404;
}
```

#### Opción B: Validar rutas en servidor (ideal)

**Next.js/Nuxt (SSR)**:
```typescript
// pages/[...slug].tsx
export async function getServerSideProps({ params }) {
  const slug = params.slug.join('/');
  const page = await db.pages.findBySlug(slug);
  
  if (!page) {
    return { notFound: true };  // Real 404
  }
  
  return { props: { page } };
}
```

**Express API**:
```typescript
app.get('*', async (req, res) => {
  // Rutas estáticas
  if (req.path === '/robots.txt') {
    return res.sendFile('/static/robots.txt');
  }
  
  // Validar ruta existe en DB
  const route = await db.routes.findByPath(req.path);
  if (!route) {
    return res.status(404).send('Not Found');
  }
  
  // Servir SPA con datos
  res.sendFile('/dist/index.html');
});
```

**Validar corrección**:
```bash
# Ruta válida debe devolver 200
curl -I https://newsroom.dna.online/ | grep HTTP

# Ruta inválida debe devolver 404
curl -I https://newsroom.dna.online/ruta-inexistente | grep HTTP
```

---

## Crawlability Issues

### 🔴 CRITICAL: Non-Crawlable Navigation

**Qué significa**: Los enlaces de navegación usan JavaScript/buttons sin `<a href>`, impidiendo que crawlers descubran páginas.

**Por qué ocurre**: Implementación con React Router, Vue Router, etc. sin SSR o sin `<a>` tags.

**Impacto SEO**:
- Crawlers no pueden descubrir páginas enlazadas
- Páginas quedan huérfanas (orphan pages)
- Indexación incompleta
- **Severidad**: P0 blocker

**Cómo verificar**:
```bash
# Contar enlaces reales en homepage
curl -s https://newsroom.dna.online/ | grep -o '<a href' | wc -l

# Debería ser > 20 para newsroom, actual puede ser < 5
```

**Patrones detectados**:
1. **Template placeholders**: `<a href="{{link}}">Article</a>`
2. **Empty hrefs**: `<a href="">Article</a>`
3. **Hash-only**: `<a href="#">Article</a>`
4. **Buttons sin href**: `<button onclick="navigate()">Article</button>`
5. **"See more" sin href**: `<div onclick="loadMore()">See more</div>`

**Cómo corregir**:

#### Opción A: Agregar `<a href>` a componentes (mínimo)

**React**:
```tsx
// ❌ MALO - No crawleable
<div onClick={() => navigate(`/post/${id}`)}>
  {title}
</div>

// ✅ BUENO - Crawleable
<a href={`/blog-posts/view/${id}/${slug}`} onClick={(e) => {
  e.preventDefault();
  navigate(`/post/${id}`);
}}>
  {title}
</a>
```

**Vue**:
```vue
<!-- ❌ MALO -->
<div @click="$router.push(`/post/${id}`)">
  {{ title }}
</div>

<!-- ✅ BUENO -->
<a :href="`/blog-posts/view/${id}/${slug}`" @click.prevent="$router.push(`/post/${id}`)">
  {{ title }}
</a>
```

#### Opción B: SSR con navegación real (ideal)

**Next.js**:
```tsx
import Link from 'next/link';

// Next.js Link genera <a href> automáticamente
<Link href={`/blog-posts/view/${id}/${slug}`}>
  {title}
</Link>
```

**Nuxt**:
```vue
<NuxtLink :to="`/blog-posts/view/${id}/${slug}`">
  {{ title }}
</NuxtLink>
```

#### Casos específicos:

**Paginación**:
```tsx
// ❌ MALO
<button onClick={() => setPage(page + 1)}>Next</button>

// ✅ BUENO
<a href={`?page=${page + 1}`} onClick={(e) => {
  e.preventDefault();
  setPage(page + 1);
}}>Next</a>

// ✅ MEJOR - con rel
<a href={`?page=${page + 1}`} rel="next">Next</a>
```

**"Load more"**:
```tsx
// ❌ MALO
<button onClick={loadMore}>Load more</button>

// ✅ BUENO - Reemplazar con paginación real
<a href={`?page=${page + 1}`}>Load more articles</a>
```

**Validar corrección**:
```bash
# Debe mostrar > 20 enlaces en homepage
curl -s https://newsroom.dna.online/ | grep -o '<a href="[^"]*"' | wc -l

# Debe mostrar enlaces a artículos
curl -s https://newsroom.dna.online/ | grep -o '<a href="/blog-posts/view/[^"]*"'
```

---

### 🟡 WARN: Low Internal Linking

**Qué significa**: La página tiene pocos enlaces internos según su tipo.

**Umbrales**:
- Newsroom/listing: < 20 enlaces internos
- Homepage institucional: < 5 enlaces internos
- Artículo: < 5 enlaces internos

**Impacto SEO**:
- Dificulta descubrimiento de contenido
- Reduce link equity distribution
- Afecta crawl depth

**Cómo corregir**:

1. **Homepage**: Agregar enlaces a secciones principales
2. **Listings**: Mostrar más artículos por página
3. **Artículos**: Agregar related posts, breadcrumbs, navegación

---

## Indexability Issues

### 🟠 FAIL: Canonical Points to Homepage

**Qué significa**: Más del 20% de las páginas tienen canonical apuntando a la homepage.

**Por qué ocurre**: Canonical generado incorrectamente, probablemente hardcoded.

**Impacto SEO**:
- Google indexa solo la homepage
- Contenido interno no se indexa
- **Severidad**: P0 blocker

**Cómo verificar**:
```bash
curl -s https://newsroom.dna.online/blog-posts/view/123/article | \
  grep -o '<link rel="canonical" href="[^"]*"'

# Si muestra href="https://newsroom.dna.online/" = problema
```

**Cómo corregir**:

#### Opción A: Generar canonical dinámico (SSR)

**Next.js**:
```tsx
// pages/blog-posts/view/[id]/[slug].tsx
import Head from 'next/head';

export default function Post({ post }) {
  const canonicalUrl = `https://newsroom.dna.online/blog-posts/view/${post.id}/${post.slug}`;
  
  return (
    <>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      {/* content */}
    </>
  );
}
```

#### Opción B: Remover canonical si no puedes generarlo correctamente

```tsx
// Mejor no tener canonical que tener uno incorrecto
// Google usará la URL de la página
```

**Validar corrección**:
```bash
# Canonical debe coincidir con URL actual
curl -s https://newsroom.dna.online/blog-posts/view/123/article | \
  grep canonical
```

---

### 🟡 WARN: Missing Metadata

**Qué significa**: Faltan title, meta description, o OG tags.

**Por qué ocurre**: Metadata generada solo client-side.

**Impacto SEO**:
- Snippets pobres en SERPs
- Bajo CTR
- Mala presentación en redes sociales

**Cómo verificar**:
```bash
curl -s https://newsroom.dna.online/blog-posts/view/123/article | \
  grep -E '<title>|<meta name="description"|<meta property="og:'
```

**Cómo corregir**:

#### SSR con metadata dinámica

**Next.js**:
```tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.id);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name]
    }
  };
}
```

**Validar corrección**:
```bash
curl -s URL | grep '<title>' # Debe mostrar título específico
curl -s URL | grep 'og:title' # Debe tener OG tags
```

---

## SPA/CSR Issues

### 🔴 CRITICAL: Shell Duplication 87%

**Qué significa**: 87% de las páginas devuelven el mismo HTML (app shell vacío).

**Por qué ocurre**: SPA con CSR puro, sin SSR ni pre-rendering.

**Impacto SEO**:
- Crawlers ven páginas vacías
- Contenido no se indexa
- **Severidad**: P0 blocker

**Cómo verificar**:
```bash
# Comparar HTML de diferentes artículos
curl -s https://newsroom.dna.online/blog-posts/view/1/article-1 > page1.html
curl -s https://newsroom.dna.online/blog-posts/view/2/article-2 > page2.html
diff page1.html page2.html

# Si son idénticos = shell duplication
```

**Cómo corregir**:

#### Opción A: Pre-render páginas críticas (mínimo)

**Usando Prerender.io o similar**:
```nginx
location / {
  # Si es bot, servir versión pre-renderizada
  if ($http_user_agent ~* "googlebot|bingbot|yandex|baiduspider") {
    proxy_pass https://service.prerender.io/https://newsroom.dna.online$request_uri;
  }
  
  # Si es usuario, servir SPA
  try_files $uri /index.html;
}
```

**Usando react-snap (build time)**:
```json
{
  "scripts": {
    "build": "react-scripts build && react-snap"
  }
}
```

#### Opción B: Migrar a SSR (ideal)

**Next.js**:
```tsx
// Automático con App Router
export default async function Post({ params }) {
  const post = await getPost(params.id);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

**Nuxt**:
```vue
<script setup>
const { id } = useRoute().params;
const { data: post } = await useFetch(`/api/posts/${id}`);
</script>

<template>
  <article>
    <h1>{{ post.title }}</h1>
    <div v-html="post.content" />
  </article>
</template>
```

**Validar corrección**:
```bash
# Debe mostrar contenido específico
curl -s URL | grep -o '<title>.*</title>'
curl -s URL | grep -o '<h1>.*</h1>'

# Títulos deben ser diferentes entre páginas
```

---

## Structured Data Issues

### 🟡 WARN: Missing Article Schema

**Qué significa**: Artículos no tienen JSON-LD con schema Article/NewsArticle.

**Impacto SEO**:
- No aparece en Google News
- No elegible para rich snippets
- Menor visibilidad en AI/GEO

**Cómo corregir**:

```tsx
export default function Post({ post }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "image": post.image,
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "author": {
      "@type": "Person",
      "name": post.author.name,
      "url": `https://newsroom.dna.online/authors/${post.author.id}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "DNA Newsroom",
      "logo": {
        "@type": "ImageObject",
        "url": "https://newsroom.dna.online/logo.png"
      }
    },
    "description": post.excerpt
  };
  
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
      {/* content */}
    </>
  );
}
```

**Validar**:
```bash
curl -s URL | grep 'application/ld+json' -A 20
```

---

## GEO Readiness Gaps

### 🟡 P1: Missing FAQ Page

**Por qué es importante**: FAQs son críticas para:
- Featured snippets
- Voice search
- AI/GEO citation
- Long-tail keywords

**Cómo crear**:

1. **Identificar preguntas frecuentes** de clientes/usuarios
2. **Crear página `/faq`** con estructura clara
3. **Agregar FAQPage schema**:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Qué es DNA Newsroom?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DNA Newsroom es una plataforma de comunicación digital..."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cómo puedo publicar contenido?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Para publicar contenido, primero debes..."
      }
    }
  ]
}
</script>
```

4. **Enlazar desde footer** y páginas relevantes

---

### 🟡 P1: Missing Editorial Policy (Newsroom)

**Por qué es importante**:
- E-E-A-T signal para Google
- Credibilidad para AI/GEO
- Requerido para Google News

**Qué incluir**:
- Proceso editorial
- Fact-checking methodology
- Corrections policy
- Conflict of interest disclosure
- Contact information

**Ejemplo de estructura**:

```markdown
# Editorial Policy

## Our Mission
[Misión del newsroom]

## Editorial Standards
- Accuracy and fact-checking
- Source verification
- Transparency

## Corrections Policy
We correct errors promptly and transparently.

## Contact
editorial@dna.online
```

---

### 🟡 P1: Missing About/Contact Pages

**Por qué son importantes**:
- Trust signals
- E-E-A-T
- Local SEO (contact)
- Required for Organization schema

**About page debe incluir**:
- Company history
- Mission/values
- Team (con fotos y bios)
- Organization schema

**Contact page debe incluir**:
- Email, phone, address
- Contact form
- Social media links
- ContactPoint schema

---

## Priorización de Fixes

### P0 (Inmediato - Blockers)
1. robots.txt/sitemap.xml HTML → Fix catch-all
2. Shell duplication → Implementar SSR/pre-render
3. Non-crawlable navigation → Agregar `<a href>`
4. Canonical to home → Fix canonical generation

### P1 (1-2 semanas - SEO Impact)
1. Missing metadata → Implementar SSR metadata
2. Missing Article schema → Agregar JSON-LD
3. Missing FAQ page → Crear con FAQPage schema
4. Missing editorial policy → Crear página

### P2 (1 mes - Enhancement)
1. Low internal linking → Agregar related posts
2. Missing Organization schema → Agregar a homepage
3. Missing BreadcrumbList → Agregar navegación
4. Pillar content → Crear guías evergreen

---

## Validación Post-Fix

Después de implementar fixes, re-ejecutar audit:

```bash
npm run audit -- https://newsroom.dna.online/ \
  --formats html,json \
  --output ./reports/after-fix
```

Comparar métricas:
- Shell duplication: 87% → < 10%
- URLs discovered: 10 → 50+
- Inventory confidence: LOW → HIGH
- CRITICAL findings: 5 → 0

---

## Recursos Adicionales

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org)
- [Web.dev SEO](https://web.dev/learn/seo)
- [Next.js SEO](https://nextjs.org/learn/seo/introduction-to-seo)

## Contacto

Para dudas sobre implementación, revisar:
- `DOCS/03-USAGE-GUIDE.md` - Guía de uso
- `DOCS/04-ARCHITECTURE.md` - Arquitectura técnica
- `.kiro/specs/audit-for-sites/` - Especificaciones completas
