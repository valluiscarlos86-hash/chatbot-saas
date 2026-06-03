# 🤖 AtentIA — Atención al Cliente con IA para WhatsApp

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

| Plan | Mensajes/mes | Precio | Agentes |
|---|---|---|---|
| Free (prueba 7 días) | 150 | $0 | 1 |
| Basic | 1.000 | $29 USD | 2 |
| Pro | 5.000 | $79 USD | 5 |
| Enterprise | Ilimitado | A convenir | Ilimitado |

---

## Estado actual del proyecto

### ✅ Completado

| Componente | Descripción | Estado |
|---|---|---|
| Entorno de desarrollo | Git, Node.js, pnpm, Docker instalados | ✅ Listo |
| Monorepo | Estructura base con Turborepo | ✅ Listo |
| Frontend base | Next.js 15 + TypeScript + Tailwind CSS | ✅ localhost:3000 |
| Backend base | NestJS + TypeScript | ✅ localhost:3001 |
| Docker | PostgreSQL (pgvector) + Redis | ✅ Listo |
| Autenticación | Clerk — login, registro, sesiones | ✅ Listo |
| Base de datos | Drizzle ORM + 6 tablas + migraciones | ✅ Listo |
| Webhook Clerk | Crea organización automáticamente en PostgreSQL | ✅ Listo |
| Período de prueba | 7 días automáticos al registrarse | ✅ Listo |
| Dashboard | 7 páginas con datos reales de la DB | ✅ Listo |
| Config chatbot | Formulario guardado en PostgreSQL | ✅ Listo |
| WhatsApp API | Recibe y responde mensajes automáticamente | ✅ Listo |
| GitHub | Repositorio conectado y versionado | ✅ Listo |

### 🔄 En progreso

| Componente | Descripción | Estado |
|---|---|---|
| Pipeline IA | OpenAI + contexto del chatbot | 🔄 Siguiente paso |

### 📋 Pendiente (Roadmap)

| Componente | Descripción |
|---|---|
| Pipeline RAG | pgvector + embeddings + búsqueda semántica |
| Upload documentos | PDF, Word, TXT → procesamiento → knowledge base |
| Billing | Stripe — planes y suscripciones |
| Deploy | Vercel (frontend) + Railway (backend) |
| Flow Builder | Constructor visual de flujos conversacionales |

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
│  Webhooks Service │ Organizations Service │ AI Orchestrator  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                              │
│   PostgreSQL + pgvector  │  Redis  │  S3/R2 (archivos)      │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de un mensaje entrante de WhatsApp

```
1. Cliente escribe en WhatsApp al número de la empresa
2. Meta envía webhook HTTP al backend (NestJS)
3. Backend valida y procesa el mensaje
4. Busca la configuración del chatbot en PostgreSQL
5. Construye el prompt con el contexto del negocio
6. Llama a OpenAI GPT-4o-mini / GPT-4o
7. Evalúa si derivar a humano (reglas de escalada)
8. Envía la respuesta de vuelta a WhatsApp vía Meta API
9. Actualiza historial de conversación
```

### Multi-tenancy

Cada empresa que se registra es un **tenant** con datos completamente aislados. Todas las tablas tienen un campo `org_id` que vincula los datos a una organización específica.

### Pipeline de IA (RAG) — próximo

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
Enviar respuesta por WhatsApp
```

---

## Stack tecnológico

### Frontend — `apps/web`

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 15.x | Framework React con App Router, SSR, Server Actions |
| **TypeScript** | 5.x | JavaScript tipado |
| **Tailwind CSS** | 4.x | Utilidades CSS |
| **React** | 19.x | Librería de componentes UI |
| **Clerk** | 7.x | Autenticación — login, registro, sesiones |

### Backend — `apps/api`

| Tecnología | Versión | Rol |
|---|---|---|
| **NestJS** | 11.x | Framework Node.js modular |
| **TypeScript** | 5.x | JavaScript tipado |
| **Node.js** | 24.x | Runtime |
| **Drizzle ORM** | 0.45.x | ORM TypeScript type-safe |
| **Axios** | 1.x | Cliente HTTP para Meta API |

### Base de datos

| Tecnología | Rol |
|---|---|
| **PostgreSQL 16** | Base de datos principal |
| **pgvector** | Extensión para embeddings de IA |
| **Redis 7** | Cache + cola de jobs |

### IA

| Tecnología | Rol |
|---|---|
| **OpenAI API** | GPT-4o-mini + GPT-4o + embeddings |

### Integraciones

| Tecnología | Rol |
|---|---|
| **Meta WhatsApp Business API** | Recepción y envío de mensajes |
| **Clerk** | Autenticación y gestión de usuarios |
| **ngrok** | Túnel para desarrollo local |

---

## Estructura del proyecto

```
chatbot-saas/
│
├── apps/
│   ├── web/                         # Frontend — Next.js 15
│   │   ├── app/
│   │   │   ├── dashboard/           # Panel principal (7 páginas)
│   │   │   │   ├── layout.tsx       # Sidebar + navegación
│   │   │   │   ├── page.tsx         # Inicio con métricas
│   │   │   │   ├── chatbot/         # Configuración del bot
│   │   │   │   ├── conversations/   # Bandeja de conversaciones
│   │   │   │   ├── documents/       # Upload de documentos
│   │   │   │   ├── analytics/       # Métricas y gráficos
│   │   │   │   ├── integrations/    # WhatsApp + widget web
│   │   │   │   └── settings/        # Cuenta y plan
│   │   │   ├── sign-in/             # Login con Clerk
│   │   │   └── sign-up/             # Registro con Clerk
│   │   └── lib/
│   │       └── db.ts                # Conexión a PostgreSQL
│   │
│   └── api/                         # Backend — NestJS
│       └── src/
│           ├── database/            # Módulo de DB + Drizzle
│           ├── organizations/       # CRUD de organizaciones
│           ├── webhooks/            # Clerk + WhatsApp webhooks
│           └── app.module.ts        # Módulo raíz
│
├── packages/
│   ├── database/                    # Schema Drizzle + migraciones
│   │   ├── src/schema/index.ts      # 6 tablas definidas
│   │   └── migrations/              # SQL versionado
│   └── shared-types/                # Tipos compartidos
│
├── infrastructure/
│   └── docker-compose.dev.yml       # PostgreSQL + Redis local
│
├── PRODUCT.md                       # Documento de producto
└── README.md                        # Este archivo
```

---

## Cómo correr el proyecto localmente

### Requisitos previos

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

# 2. Instalar dependencias
pnpm install

# 3. Levantar base de datos y Redis
cd infrastructure
docker compose -f docker-compose.dev.yml up -d

# 4. Correr migraciones
cd packages/database
npm run db:migrate

# 5. Frontend (terminal 1)
cd apps/web
pnpm dev
# → http://localhost:3000

# 6. Backend (terminal 2)
cd apps/api
pnpm start:dev
# → http://localhost:3001

# 7. Ngrok para webhooks de WhatsApp (terminal 3)
ngrok http 3001
```

### Servicios corriendo

| URL | Servicio |
|---|---|
| http://localhost:3000 | Frontend (Next.js) |
| http://localhost:3001 | Backend (NestJS) |
| localhost:5432 | PostgreSQL |
| localhost:6379 | Redis |

---

## Variables de entorno

> ⚠️ Nunca subas archivos `.env` a GitHub.

### `apps/api/.env`

```bash
# Base de datos
DATABASE_URL=postgresql://chatbot:chatbot123@localhost:5432/chatbot_dev

# Clerk
CLERK_WEBHOOK_SECRET=whsec_...

# WhatsApp
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_VERIFY_TOKEN=atentia_webhook_2026

# OpenAI (próximo)
OPENAI_API_KEY=sk-...
```

### `apps/web/.env.local`

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
DATABASE_URL=postgresql://chatbot:chatbot123@localhost:5432/chatbot_dev
```

---

## Roadmap

### Fase 1 — Fundaciones ✅ Completada

- [x] Monorepo configurado (Next.js + NestJS)
- [x] Docker con PostgreSQL (pgvector) + Redis
- [x] Autenticación con Clerk
- [x] Schema de base de datos con Drizzle ORM (6 tablas)
- [x] Webhook de Clerk → crea organización automáticamente
- [x] Período de prueba de 7 días automático
- [x] Dashboard con 7 páginas y datos reales
- [x] Configuración del chatbot guardada en PostgreSQL
- [x] Webhook de WhatsApp funcionando
- [x] AtentIA recibe y responde mensajes por WhatsApp

### Fase 2 — Core del producto 🔄 En progreso

- [ ] Pipeline de IA con OpenAI
- [ ] Pipeline RAG (pgvector + embeddings)
- [ ] Upload y procesamiento de documentos
- [ ] Conversaciones en tiempo real en el dashboard
- [ ] Handoff a agente humano
- [ ] Widget embebible para web

### Fase 3 — Escala y negocio

- [ ] Billing con Stripe
- [ ] Analytics dashboard
- [ ] Respuestas rápidas para agentes
- [ ] Flow Builder visual
- [ ] Deploy en Vercel + Railway
- [ ] CI/CD con GitHub Actions

---

## Decisiones técnicas clave

**pgvector sobre Pinecone (MVP)** — misma base de datos, menos dependencias, ahorro de ~$70/mes. Migración posible cuando supere los 5M vectores.

**Meta WhatsApp Cloud API directa** — evita intermediarios (Twilio) que agregan costo y latencia innecesarios.

**Drizzle ORM** — queries type-safe, migraciones versionadas, detección de errores en tiempo de compilación.

**Server Actions de Next.js** — el frontend puede hacer queries directos a la DB sin pasar por la API para operaciones simples del dashboard.

---

*Última actualización: Junio 2026.*