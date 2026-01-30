# DNA Newsroom SEO/GEO Audit Runner - Project Overview

## Executive Summary

DNA Newsroom SEO/GEO Audit Runner es un sistema de auditoría técnica especializado para analizar sitios web de newsroom, enfocado en detectar problemas de indexabilidad SEO y preparación para AI/GEO (Generative Engine Optimization).

**Fecha de inicio:** Enero 2025  
**Estado actual:** ✅ Implementación completa - Fase de producción  
**Versión:** 1.0.0

## Problema que Resuelve

Los sitios web de DNA Newsroom (newsroom.dna.online y newsroom.upscrolled.com) presentaban problemas críticos de SEO que impedían su correcta indexación por motores de búsqueda:

1. **SPA Fallback Misconfiguration**: robots.txt y sitemap.xml devolvían HTML en lugar de sus formatos correctos
2. **Shell Duplication**: 87% de las páginas compartían el mismo HTML (CSR sin SSR)
3. **Navegación No Crawleable**: Enlaces implementados con JavaScript sin `<a href>` reales
4. **Metadata Ausente**: Títulos, OG tags y canonical generados solo client-side
5. **Falta de Structured Data**: Sin JSON-LD para mejorar visibilidad en AI/GEO

## Objetivos del Proyecto

### Objetivos Primarios
- ✅ Detectar automáticamente problemas técnicos de SEO en sitios newsroom
- ✅ Identificar configuraciones incorrectas de SPA/CSR que bloquean crawlers
- ✅ Generar reportes accionables con recomendaciones específicas
- ✅ Analizar preparación para AI indexing (GEO readiness)

### Objetivos Secundarios
- ✅ Inventariar contenido existente con clasificación automática
- ✅ Identificar gaps de contenido según modelo GEO
- ✅ Soportar auditorías multi-dominio
- ✅ Exportar en múltiples formatos (JSON, HTML, CSV)

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Entry Point                         │
│                   (dna-newsroom-audit)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Module                       │
│         (coordina todas las fases del audit)                 │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Fetcher    │    │   Parser     │    │   Analyzer   │
│   Module     │    │   Module     │    │   Module     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Classifier  │    │  Gap Analyzer│    │   Reporter   │
│   Module     │    │   Module     │    │   Module     │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Tecnologías Utilizadas

- **Runtime**: Node.js 18+
- **Lenguaje**: TypeScript 5.3
- **HTTP Client**: Native Fetch API
- **HTML Parsing**: Cheerio 1.0
- **XML Parsing**: fast-xml-parser 4.3
- **CLI Framework**: Commander 11.1
- **UI/UX**: Chalk 4.1, Ora 5.4
- **Concurrency**: p-limit 3.1

## Módulos Principales

### 1. Fetcher Module
**Responsabilidad**: HTTP requests con retry logic, manejo de redirects, decompresión gzip

**Características clave**:
- Retry automático con exponential backoff
- Tracking de redirect chains
- Decompresión automática de gzip
- Rate limiting configurable
- Soporte para múltiples User-Agents

### 2. Parser Module
**Responsabilidad**: Parsing de HTML/XML, extracción de elementos, normalización

**Características clave**:
- Detección de body signatures (HTML vs XML vs text)
- Extracción de metadata (title, OG, canonical, etc.)
- Análisis de anchors con clasificación contextual
- Detección de navegación no crawleable
- Normalización de HTML para comparación

### 3. Analyzer Module
**Responsabilidad**: Análisis SEO/GEO, detección de issues, scoring

**Características clave**:
- Análisis de robots.txt con dual detection
- Análisis de sitemap con soporte gzip
- Detección de catch-all fallback
- Análisis de linkability con umbrales por tipo
- Detección de SPA shell duplication
- Análisis de structured data

### 4. Classifier Module
**Responsabilidad**: Clasificación de URLs, detección de site mode, inventory building

**Características clave**:
- Patrones genéricos + site-specific
- Detección automática de site mode (newsroom/agency/hybrid)
- Cálculo de inventory confidence
- Identificación de páginas que necesitan enhancement

### 5. Gap Analyzer Module
**Responsabilidad**: Análisis de gaps de contenido según modelo GEO

**Características clave**:
- Modelo GEO con pesos por site mode
- Detección de páginas faltantes
- Identificación de páginas existentes que necesitan mejora
- Priorización P0/P1/P2

### 6. Reporter Module
**Responsabilidad**: Generación de reportes en múltiples formatos

**Características clave**:
- Reporte HTML auto-contenido con UI moderna
- Reporte JSON con dataset completo
- Reporte CSV para análisis en spreadsheet
- Executive summary con bullets accionables

## Flujo de Ejecución

1. **Inicialización**: CLI parsea argumentos y configura audit
2. **Fase 1 - Endpoints Críticos**: Fetch robots.txt, sitemap variants, homepage
3. **Fase 2 - Homepage Analysis**: Parse homepage, analiza linkability
4. **Fase 3 - Listing Routes**: Probe rutas comunes de listings
5. **Fase 4 - URL Discovery**: Descubre URLs por crawling, probing y sitemap
6. **Fase 5 - Per-URL Analysis**: Analiza cada URL descubierta
7. **Fase 6 - SPA Detection**: Detecta shell duplication y soft 404s
8. **Fase 7 - Canonical Analysis**: Calcula ratio de canonical pointing to home
9. **Fase 8 - Structured Data**: Analiza JSON-LD y schemas
10. **Fase 9 - Classification**: Clasifica páginas y detecta site mode
11. **Fase 10 - Inventory Building**: Construye inventario con confidence
12. **Fase 11 - GEO Gap Analysis**: Identifica gaps según modelo GEO
13. **Fase 12 - Recommendations**: Genera recomendaciones con validation commands
14. **Fase 13 - Report Generation**: Genera reportes en formatos solicitados

## Resultados Actuales

### Sitios Auditados
- ✅ newsroom.dna.online
- ✅ newsroom.upscrolled.com

### Hallazgos Principales
- 🔴 **CRITICAL**: robots.txt y sitemap.xml devuelven HTML (SPA fallback)
- 🔴 **CRITICAL**: 87% de páginas comparten HTML idéntico (shell duplication)
- 🔴 **CRITICAL**: 7 elementos de navegación no crawleables
- 🟡 **WARN**: Inventory confidence LOW debido a problemas de crawlability
- 🟡 **WARN**: 10 páginas GEO recomendadas necesitan enhancement

### Métricas de Audit
- **Tiempo de ejecución**: ~30-60 segundos por dominio (30 URLs)
- **URLs descubiertas**: 10-30 por dominio (limitado por crawlability)
- **Findings generados**: 70+ por dominio
- **Recommendations**: 8-12 por dominio

## Próximos Pasos

Ver `02-IMPLEMENTATION-STATUS.md` para detalles de implementación y `03-USAGE-GUIDE.md` para instrucciones de uso.
