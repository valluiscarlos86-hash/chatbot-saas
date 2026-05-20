# 🤖 Chatbot SaaS — Atención al Cliente con IA para WhatsApp

> Plataforma SaaS multi-tenant que permite a empresas automatizar su atención al cliente en WhatsApp usando Inteligencia Artificial.

---

## 📋 Tabla de Contenidos

- [¿Qué es este proyecto?](#qué-es-este-proyecto)
- [Estado actual del proyecto](#estado-actual-del-proyecto)
- [Arquitectura del sistema](#arquitectura-del-sistema)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cómo correr el proyecto localmente](#cómo-correr-el-proyecto-localmente)
- [Variables de entorno](#variables-de-entorno)
- [Roadmap](#roadmap)

---

## ¿Qué es este proyecto?

Una plataforma donde **cualquier empresa puede registrarse**, conectar su número de WhatsApp, subir documentos con información de su negocio (catálogos, precios, FAQ, políticas), y en minutos tener un **chatbot con IA respondiendo automáticamente** a sus clientes 24/7.

### Flujo desde el punto de vista de la empresa cliente

```
Registro → Conectar WhatsApp → Subir documentos → Configurar bot → Activar
```

Una vez activo, el sistema:
- Recibe mensajes de clientes en WhatsApp
- Los procesa con IA usando la información del negocio
- Responde automáticamente en segundos
- Si la consulta es compleja, deriva a un agente humano
- El agente atiende desde el panel web en tiempo real

### Flujo desde el punto de vista del cliente final (el que escribe por WhatsApp)

```
Cliente escribe → Bot responde en segundos → Si necesita humano → Agente toma la conversación
```

### Modelo de negocio

Suscripción mensual por empresa según volumen de mensajes:
- **Básico** — hasta 500 mensajes/mes
- **Pro** — hasta 5.000 mensajes/mes  
- **Enterprise** — mensajes ilimitados + soporte dedicado

---

## Estado actual del proyecto

### ✅ Completado

| Componente | Descripción | Estado |
|---|---|---|
| Entorno de desarrollo | Git, Node.js, pnpm, Docker instalados | ✅ Listo |
| Monorepo | Estructura base con Turborepo | ✅ Listo |
| Frontend base | Next.js 15 + TypeScript + Tailwind CSS | ✅ Corriendo en localhost:3000 |
| Backend base | NestJS + TypeScript | ✅ Corriendo en localhost:3001 |
| Configuración Git | Repositorio conectado a GitHub | ✅ Listo |

### 🔄 En progreso

| Componente | Descripción | Estado |
|---|---|---|
| Base de datos | PostgreSQL + pgvector con Docker | 🔄 Siguiente paso |
| Cache/Queue | Redis con Docker | 🔄 Siguiente paso |

### 📋 Pendiente (Roadmap)

| Componente | Descripción |
|---|---|
| Autenticación | Clerk — login, registro, multi-tenant |
| Base de datos ORM | Drizzle ORM + schema multi-tenant |
| WhatsApp API | Conexión con Meta WhatsApp Business API |
| Pipeline IA | RAG + OpenAI + pgvector |
| Dashboard | Panel de conversaciones en tiempo real |
| Billing | Stripe — planes y suscripciones |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Arquitectura del sistema

### Visión general

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE TIER                         │
│   Next.js Dashboard    │   Mobile Web   │   WhatsApp API    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY TIER                         │
│         NestJS — Rate limiting · Auth · Routing             │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    CORE SERVICES TIER                        │
│  Message Service │ AI Orchestrator │ Knowledge Service       │
│  Conversation    │ Realtime        │ Tenant Service          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     JOB QUEUE TIER                           │
│         BullMQ (Redis) — ai_jobs · ingest_jobs              │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                              │
│   PostgreSQL + pgvector  │  Redis  │  S3/R2 (archivos)      │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de un mensaje entrante de WhatsApp

```
1. Cliente escribe en WhatsApp
2. Meta envía webhook HTTP al backend (NestJS)
3. Backend valida firma HMAC y persiste el mensaje en PostgreSQL
4. Se encola un job en BullMQ (Redis)
5. AI Worker toma el job
6. Carga contexto: historial de conversación (Redis) + documentos relevantes (pgvector)
7. Construye el prompt y llama a OpenAI GPT-4o
8. Evalúa si derivar a humano (reglas de escalada)
9. Envía la respuesta de vuelta a WhatsApp vía Meta API
10. Actualiza memoria conversacional y métricas
```

### Multi-tenancy

Cada empresa que se registra es un **tenant** con datos completamente aislados. Implementado con **Row Level Security (RLS)** de PostgreSQL — todas las tablas tienen un campo `organization_id` y políticas que impiden que un tenant vea datos de otro, a nivel de base de datos.

### Pipeline de IA (RAG)

**RAG** = Retrieval Augmented Generation. En lugar de que la IA responda desde su entrenamiento genérico, primero busca información relevante en los documentos del negocio y usa esa información para responder con precisión.

```
Query del usuario
      │
      ▼
Generar embedding (OpenAI text-embedding-3-small)
      │
      ▼
Buscar chunks similares en pgvector (cosine similarity)
      │
      ▼
Armar prompt: [Sistema] + [Chunks relevantes] + [Historial] + [Pregunta]
      │
      ▼
Llamar a GPT-4o-mini (queries simples) o GPT-4o (queries complejas)
      │
      ▼
Procesar respuesta + ejecutar tools si es necesario
      │
      ▼
Enviar respuesta por WhatsApp
```

---

## Stack tecnológico

### Frontend — `apps/web`

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 15.x | Framework React con App Router, SSR, Server Actions |
| **TypeScript** | 5.x | JavaScript tipado — detecta errores antes de ejecutar |
| **Tailwind CSS** | 4.x | Utilidades CSS — estilos sin escribir CSS tradicional |
| **React** | 19.x | Librería de componentes UI |

**¿Por qué Next.js?** Combina páginas estáticas (landing, pricing) con páginas dinámicas (dashboard) en un solo framework. El App Router permite Server Components que renderizan en el servidor, reduciendo el JavaScript enviado al browser.

### Backend — `apps/api`

| Tecnología | Versión | Rol |
|---|---|---|
| **NestJS** | 11.x | Framework Node.js con arquitectura modular (DI, Guards, Interceptors) |
| **TypeScript** | 5.x | JavaScript tipado |
| **Node.js** | 24.x | Runtime — ejecuta JavaScript fuera del browser |

**¿Por qué NestJS?** Estructura modular lista para escalar. Cada feature (WhatsApp, IA, conversaciones) es un módulo independiente. Tiene inyección de dependencias, guards para auth, interceptors para logging — todo el scaffolding enterprise ya resuelto.

### Base de datos

| Tecnología | Rol |
|---|---|
| **PostgreSQL 16** | Base de datos principal — usuarios, orgs, conversaciones, mensajes |
| **pgvector** | Extensión de Postgres para guardar y buscar vectores (embeddings de IA) |
| **Redis 7** | Cache + cola de jobs (BullMQ) |
| **Drizzle ORM** | _(próximo)_ — ORM TypeScript para queries type-safe |

**¿Por qué pgvector en vez de Pinecone?** Para el MVP, mantener los embeddings en el mismo Postgres simplifica la arquitectura (un servicio menos) y es suficiente para millones de vectores. Migramos a Pinecone cuando el volumen lo justifique.

### IA

| Tecnología | Rol |
|---|---|
| **OpenAI API** | GPT-4o-mini (queries simples) + GPT-4o (queries complejas) + embeddings |
| **LangChain** | _(próximo)_ — orquestación del pipeline RAG |

### Infraestructura local (desarrollo)

| Tecnología | Rol |
|---|---|
| **Docker Desktop** | Corre PostgreSQL y Redis en contenedores locales |
| **Docker Compose** | Define y levanta todos los servicios con un comando |

### Infraestructura producción _(próximo)_

| Tecnología | Rol |
|---|---|
| **Vercel** | Deploy del frontend (Next.js) |
| **Railway** | Deploy del backend (NestJS) + workers |
| **Clerk** | Autenticación — login, registro, organizaciones multi-tenant |
| **Stripe** | Billing — suscripciones y pagos |

---

## Estructura del proyecto

Este es un **monorepo** gestionado con **pnpm workspaces** y **Turborepo**.

```
chatbot-saas/
│
├── apps/
│   ├── web/                    # Frontend — Next.js 15
│   │   ├── app/                # App Router de Next.js
│   │   │   ├── layout.tsx      # Layout raíz (fuentes, providers)
│   │   │   ├── page.tsx        # Página principal (/)
│   │   │   └── globals.css     # Estilos globales Tailwind
│   │   ├── public/             # Archivos estáticos (imágenes, íconos)
│   │   ├── next.config.ts      # Configuración de Next.js
│   │   ├── tailwind.config.ts  # Configuración de Tailwind CSS
│   │   ├── tsconfig.json       # Configuración de TypeScript
│   │   └── package.json        # Dependencias del frontend
│   │
│   └── api/                    # Backend — NestJS
│       ├── src/
│       │   ├── main.ts         # Punto de entrada — arranca el servidor (puerto 3001)
│       │   ├── app.module.ts   # Módulo raíz — registra todos los módulos
│       │   ├── app.controller.ts  # Controller raíz — maneja GET /
│       │   └── app.service.ts  # Service raíz — lógica de negocio base
│       ├── test/               # Tests e2e
│       ├── tsconfig.json       # Configuración TypeScript del backend
│       └── package.json        # Dependencias del backend
│
├── packages/
│   ├── shared-types/           # Tipos TypeScript compartidos entre frontend y backend
│   └── database/               # Schema de Drizzle ORM + migraciones (próximo)
│
├── infrastructure/
│   └── docker-compose.dev.yml  # PostgreSQL + Redis para desarrollo local
│
├── .gitignore                  # Archivos ignorados por Git
├── .npmrc                      # Configuración de pnpm
├── package.json                # Config raíz del monorepo + scripts Turborepo
├── pnpm-workspace.yaml         # Define los workspaces del monorepo
└── README.md                   # Este archivo
```

### ¿Por qué un monorepo?

Un monorepo tiene todo el código en un solo repositorio. Las ventajas para este proyecto:

- **Tipos compartidos** — si el backend define cómo luce un `Message`, el frontend puede importarlo directamente sin duplicar código
- **Un solo `pnpm install`** — instala dependencias de todos los sub-proyectos
- **Deploys coordinados** — Turborepo detecta qué cambió y solo rebuilda lo necesario
- **Refactoring global** — renombrar una interfaz actualiza todos los usos en frontend y backend simultáneamente

---

## Cómo correr el proyecto localmente

### Requisitos previos

Asegurate de tener instalado:

```bash
git --version    # 2.x.x
node --version   # v22.x.x o superior
pnpm --version   # 9.x.x o superior
docker --version # 27.x.x o superior
```

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/valluiscarlos86-hash/chatbot-saas.git
cd chatbot-saas

# 2. Instalar dependencias de todos los proyectos
pnpm install

# 3. Levantar base de datos y Redis
cd infrastructure
docker compose -f docker-compose.dev.yml up -d

# 4. Correr el frontend (en una terminal)
cd apps/web
pnpm dev
# → http://localhost:3000

# 5. Correr el backend (en otra terminal)
cd apps/api
pnpm start:dev
# → http://localhost:3001
```

### Verificar que todo corre

| URL | Servicio | Respuesta esperada |
|---|---|---|
| http://localhost:3000 | Frontend (Next.js) | Página de bienvenida |
| http://localhost:3001 | Backend (NestJS) | `Hello World!` |
| localhost:5432 | PostgreSQL | Disponible para conexiones |
| localhost:6379 | Redis | Disponible para conexiones |

---

## Variables de entorno

> ⚠️ Nunca subas archivos `.env` a GitHub. Están en `.gitignore` por seguridad.

Próximamente se agregará un archivo `.env.example` con todas las variables necesarias:

```bash
# Base de datos
DATABASE_URL=postgresql://chatbot:chatbot123@localhost:5432/chatbot_dev

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI (próximo)
OPENAI_API_KEY=sk-...

# Clerk Auth (próximo)
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# WhatsApp (próximo)
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_ACCESS_TOKEN=...
```

---

## Roadmap

### Fase 1 — MVP (semanas 1-8) 🔄 En progreso

- [x] Monorepo configurado (Next.js + NestJS)
- [x] Entorno de desarrollo local
- [ ] PostgreSQL + Redis con Docker
- [ ] Autenticación con Clerk
- [ ] Schema de base de datos + RLS multi-tenant
- [ ] Webhook de WhatsApp
- [ ] Pipeline RAG básico (pgvector + OpenAI)
- [ ] Upload de documentos
- [ ] Dashboard básico de conversaciones
- [ ] Handoff a humano

### Fase 2 — V1 Production (semanas 8-20)

- [ ] Stripe billing
- [ ] Semantic cache (reducción de costos OpenAI)
- [ ] Model routing (mini vs full)
- [ ] Analytics dashboard
- [ ] Prompt versioning
- [ ] n8n workflows para tenants
- [ ] Observabilidad (Axiom + Sentry)
- [ ] Deploy en Vercel + Railway

### Fase 3 — Escalabilidad (semanas 20-40)

- [ ] Redis Cluster
- [ ] PostgreSQL read replicas
- [ ] Worker autoscaling
- [ ] Migración a Pinecone (si >5M vectores)
- [ ] Multi-provider LLM (Anthropic como fallback)

---

## Decisiones técnicas clave

### 1. RLS en PostgreSQL para multi-tenancy
Todos los tenants comparten el mismo schema de base de datos. Row Level Security garantiza aislamiento a nivel de base de datos — si un bug en el código omite filtrar por `org_id`, la base de datos lo bloquea igual.

### 2. BullMQ para el pipeline de mensajes
Los mensajes de WhatsApp se procesan de forma asincrónica mediante una cola (BullMQ sobre Redis). Esto garantiza que si OpenAI tarda 5 segundos, el webhook de WhatsApp ya respondió y el servidor no se bloquea.

### 3. pgvector sobre Pinecone (MVP)
Mantener los embeddings en el mismo PostgreSQL elimina una dependencia externa, reduce costos (~$70/mes menos) y simplifica la arquitectura. Migración a Pinecone cuando supere 5M vectores.

### 4. Semantic cache
Las consultas frecuentes y similares (ej: múltiples clientes preguntando lo mismo) se cachean usando similitud de embeddings. Estimación: 25-35% de reducción en costos de OpenAI.

---

*Documentación generada durante el desarrollo. Última actualización: Mayo 2026.*