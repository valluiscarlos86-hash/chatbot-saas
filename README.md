# 🤖 AtentIA — Atención al Cliente con IA para WhatsApp

> Plataforma SaaS multi-tenant que permite a PyMEs automatizar su atención al cliente en WhatsApp usando IA generativa (RAG), con transición fluida a agentes humanos desde un panel web propio.

---

## 📋 Tabla de Contenidos

- [¿Qué es este proyecto?](#qué-es-este-proyecto)
- [Estado actual del proyecto](#estado-actual-del-proyecto)
- [Arquitectura del sistema](#arquitectura-del-sistema)
- [Stack tecnológico](#stack-tecnológico)
- [Modelo de datos](#modelo-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cómo correr el proyecto localmente](#cómo-correr-el-proyecto-localmente)
- [Variables de entorno](#variables-de-entorno)
- [Roadmap](#roadmap)
- [Decisiones técnicas clave](#decisiones-técnicas-clave)

---

## ¿Qué es este proyecto?

Una plataforma donde **cualquier empresa puede registrarse**, conectar su número de WhatsApp, subir documentos con información de su negocio (catálogos, precios, FAQ, políticas), y en minutos tener un **chatbot con IA respondiendo automáticamente** a sus clientes 24/7 — usando información real del negocio, no respuestas genéricas.

### Flujo desde el punto de vista de la empresa cliente

```
Registro → Conectar WhatsApp → Subir documentos → Configurar bot → Activar
```

Una vez activo, el sistema:
- Recibe mensajes de clientes en WhatsApp
- Los procesa con IA usando la información del negocio (RAG)
- Responde automáticamente en segundos
- Si la consulta es compleja o el cliente lo pide, deriva a un agente humano
- El agente atiende desde el panel web, con la opción de pedir un resumen del chat generado por IA

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

> El detalle estratégico del producto, pricing y go-to-market vive en `ESTRATEGIA.md`.

---

## Estado actual del proyecto

### ✅ Completado

| Componente | Descripción | Estado |
|---|---|---|
| Entorno de desarrollo | Git, Node.js, pnpm, Docker | ✅ Listo |
| Monorepo | Turborepo + pnpm workspaces | ✅ Listo |
| Frontend base | Next.js 16 + TypeScript + Tailwind CSS | ✅ localhost:3000 |
| Backend base | NestJS + TypeScript | ✅ localhost:3001 |
| Docker | PostgreSQL (pgvector) + Redis | ✅ Listo |
| Autenticación | Clerk — login, registro, sesiones | ✅ Listo |
| Base de datos | Drizzle ORM + 7 tablas + migraciones | ✅ Listo |
| Webhook Clerk | Crea organización automáticamente | ✅ Listo |
| Período de prueba | 7 días automáticos al registrarse | ✅ Listo |
| Dashboard | 7 páginas con datos reales de la DB | ✅ Listo |
| Config chatbot | Formulario guardado en PostgreSQL | ✅ Listo |
| WhatsApp API | Recibe y responde mensajes automáticamente | ✅ Listo |
| **Pipeline RAG** | pgvector + embeddings + búsqueda semántica | ✅ Listo |
| **Upload documentos** | PDF/TXT → chunking → embeddings, con estado en vivo | ✅ Listo |
| **Chat de prueba** | Probar el bot desde el dashboard sin WhatsApp | ✅ Listo |
| **Conversaciones en tiempo real** | Guardado de mensajes + panel estilo WhatsApp Web | ✅ Listo |
| **Handoff a humano** | Tomar control / reactivar bot / cerrar conversación | ✅ Listo |
| **Log de eventos del sistema** | Mensajes de sistema en el hilo (tomas, reactivaciones) | ✅ Listo |
| **Captura de nombre de WhatsApp** | Guarda el nombre de perfil del contacto | ✅ Listo |
| **Notas internas** | Nota por conversación, solo visible en el dashboard | ✅ Listo |
| **Resumen con IA** | Resumen on-demand de la conversación para el agente | ✅ Listo |
| **Página de inicio con datos reales** | Métricas y conversaciones recientes desde la DB | ✅ Listo |
| GitHub | Repositorio conectado y versionado | ✅ Listo |

### 🔄 En progreso / próximo

| Componente | Descripción |
|---|---|
| Integraciones WhatsApp | Que cada empresa conecte su propio número desde el dashboard |
| Deploy a producción | Vercel (frontend) + Railway (backend) |
| Billing | Planes y suscripciones (medio de pago a definir para LatAm) |

### 📋 Pendiente (Roadmap)

| Componente | Descripción |
|---|---|
| Pipeline RAG avanzado | Reranking, semantic cache, control de presupuesto de tokens |
| Modo borrador / aprobación | El bot redacta pero pide OK antes de enviar (guardrail) |
| Detección de leads calientes | Aviso al dueño cuando un cliente está listo para comprar |
| Reporte semanal por WhatsApp | Resumen automático de la semana al dueño |
| Sistema de turnos propio | Calendario nativo — abre peluquerías/consultorios (Nivel 2) |
| Tools / integraciones externas | Function calling — abre hospitales/municipios (Nivel 3) |
| Widget web embebible | Chat en el sitio web del cliente, unificado en el panel |
| Rediseño visual completo | Identidad de marca, componentes, estados vacíos |

---

## Arquitectura del sistema

### Visión general (estado actual)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE TIER                          │
│   Next.js Dashboard    │   WhatsApp (cliente final)          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     API / BFF TIER                           │
│   Next.js API Routes (proxy + Clerk auth)                    │
│                              │                               │
│   NestJS — Webhooks · Conversations · Documents · AI         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                              │
│   PostgreSQL + pgvector   │   Redis   │   OpenAI API         │
└─────────────────────────────────────────────────────────────┘
```

> **Nota:** el procesamiento actual de mensajes es síncrono dentro del webhook. La cola asincrónica (BullMQ) está prevista como mejora cuando el volumen lo justifique — ver `ESTRATEGIA.md`.

### Patrón de comunicación frontend ↔ backend

Para evitar problemas de CORS entre `localhost:3000` (Next.js) y `localhost:3001` (NestJS), el frontend nunca llama directo al backend desde el browser. En su lugar:

```
Browser → Next.js API Route (mismo origen, valida Clerk auth, resuelve orgId)
              ↓ (server-to-server, sin CORS)
          NestJS (lógica de negocio, sin auth propia)
              ↓
          PostgreSQL / OpenAI / WhatsApp API
```

Este patrón (proxy con Clerk auth) se repite en documentos, chat de prueba y conversaciones.

### Flujo de un mensaje entrante de WhatsApp

```
1. Cliente escribe en WhatsApp al número de la empresa
2. Meta envía webhook HTTP al backend (NestJS)
3. Se extrae phone_number_id y se hace upsert de whatsapp_accounts
4. Se hace upsert de la conversación (captura nombre de perfil del contacto)
5. Si la conversación está en 'human_takeover':
   → se guarda el mensaje del cliente y NO se llama a la IA (responde un humano)
6. Si está en 'bot_active':
   → se lee el historial de la conversación
   → se ejecuta el pipeline RAG (embedding + búsqueda en pgvector + OpenAI)
   → se envía la respuesta por WhatsApp
   → se guardan el mensaje entrante (user) y la respuesta (assistant)
```

### Multi-tenancy

Cada empresa que se registra es un **tenant** con datos aislados. Todas las tablas tienen un campo `org_id` que vincula los datos a una organización específica, y todas las queries filtran por ese campo.

### Pipeline de IA (RAG)

**RAG** = Retrieval Augmented Generation. En lugar de responder desde su entrenamiento genérico, la IA primero busca información relevante en los documentos del negocio y la usa para responder con precisión.

```
Query del cliente
      │
      ▼
Generar embedding (OpenAI text-embedding-3-small)
      │
      ▼
Buscar chunks similares en pgvector (cosine similarity, threshold + LIMIT)
      │
      ▼
Armar prompt: [Sistema + config del negocio] + [Chunks relevantes] + [Historial]
      │
      ▼
Llamar a OpenAI (GPT-4o-mini)
      │
      ▼
Enviar respuesta por WhatsApp + persistir en la DB
```

---

## Stack tecnológico

### Frontend — `apps/web`

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 16.x | Framework React — App Router, Server Components, Server Actions |
| **TypeScript** | 5.x | JavaScript tipado |
| **Tailwind CSS** | 4.x | Utilidades CSS |
| **React** | 19.x | Librería de componentes UI |
| **Clerk** | 6.x | Autenticación — login, registro, sesiones |

### Backend — `apps/api`

| Tecnología | Versión | Rol |
|---|---|---|
| **NestJS** | 11.x | Framework Node.js modular |
| **TypeScript** | 5.x | JavaScript tipado |
| **Node.js** | 24.x | Runtime |
| **Drizzle ORM** | 0.4x | ORM TypeScript type-safe |
| **Axios** | 1.x | Cliente HTTP para la Meta API |

### Base de datos

| Tecnología | Rol |
|---|---|
| **PostgreSQL 16** | Base de datos principal |
| **pgvector** | Extensión para embeddings de IA (vector 1536) |
| **Redis 7** | Cache + cola de jobs (preparado para BullMQ) |

### IA

| Tecnología | Rol |
|---|---|
| **OpenAI API** | GPT-4o-mini (respuestas) + text-embedding-3-small (embeddings) |

### Integraciones e infra de desarrollo

| Tecnología | Rol |
|---|---|
| **Meta WhatsApp Business API** | Recepción y envío de mensajes |
| **Clerk** | Autenticación y gestión de usuarios |
| **ngrok** | Túnel para exponer el webhook local a Meta durante desarrollo |
| **Docker / Docker Compose** | PostgreSQL y Redis en contenedores locales |

### Infraestructura de producción _(próximo)_

| Tecnología | Rol |
|---|---|
| **Vercel** | Deploy del frontend (Next.js) |
| **Railway** | Deploy del backend (NestJS) |

---

## Modelo de datos

7 tablas principales, todas con `org_id` para aislamiento multi-tenant:

| Tabla | Rol |
|---|---|
| `organizations` | Cada empresa cliente (tenant). Incluye plan, trial, límites |
| `whatsapp_accounts` | Números de WhatsApp conectados por organización |
| `conversations` | Conversación con un cliente final. `status`: `bot_active` / `human_takeover` / `closed`. `metadata` (jsonb) para notas internas |
| `messages` | Mensajes de la conversación. `role`: `user` / `assistant` / `system` |
| `chatbot_configs` | Configuración del bot por empresa (nombre, tono, reglas de escalada, etc.) |
| `knowledge_documents` | Documentos subidos. `status`: `pending` / `processing` / `ready` / `error` |
| `embeddings` | Chunks vectorizados (`vector(1536)`) para la búsqueda RAG, vinculados a un documento |

---

## Estructura del proyecto

```
chatbot-saas/
│
├── apps/
│   ├── web/                          # Frontend — Next.js 16
│   │   ├── app/
│   │   │   ├── dashboard/            # Panel principal (7 páginas)
│   │   │   │   ├── page.tsx          # Inicio con métricas reales
│   │   │   │   ├── conversations/    # Bandeja + handoff + resumen IA
│   │   │   │   ├── chatbot/          # Config + chat de prueba
│   │   │   │   ├── documents/        # Upload + estado en vivo
│   │   │   │   ├── analytics/        # Métricas (próximo)
│   │   │   │   ├── integrations/     # WhatsApp + widget (próximo)
│   │   │   │   └── settings/         # Cuenta y plan
│   │   │   ├── api/                  # Route Handlers (proxy + Clerk auth)
│   │   │   │   ├── conversations/    # list, messages, status, agent-message, metadata, summary
│   │   │   │   ├── documents/        # list, upload
│   │   │   │   ├── chatbot-config/
│   │   │   │   └── test-chat/
│   │   │   ├── sign-in/ · sign-up/   # Clerk
│   │   │   └── layout.tsx
│   │   └── lib/db.ts                 # Conexión a PostgreSQL
│   │
│   └── api/                          # Backend — NestJS
│       └── src/
│           ├── ai.service.ts         # RAG: embeddings, búsqueda, generateResponse, generateSummary
│           ├── ai.controller.ts      # POST /ai/test-chat
│           ├── documents.*           # Ingesta y procesamiento de documentos
│           ├── conversations/        # CRUD + status + agent-message + metadata + summary
│           ├── webhooks/             # Clerk + WhatsApp (flujo completo del mensaje)
│           ├── organizations/        # CRUD de organizaciones
│           ├── database/             # Módulo de DB + Drizzle
│           └── app.module.ts         # Módulo raíz
│
├── packages/
│   ├── database/                     # Schema Drizzle + migraciones (7 tablas)
│   └── shared-types/                 # Tipos compartidos
│
├── infrastructure/
│   └── docker-compose.dev.yml        # PostgreSQL + Redis local
│
├── PRODUCT.md                        # Documento de producto
├── ESTRATEGIA.md                     # Estrategia, pricing, killer features, riesgos
└── README.md                         # Este archivo
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
cd ../packages/database
npm run db:migrate

# 5. Frontend (terminal 1)
cd ../../apps/web
pnpm dev          # → http://localhost:3000

# 6. Backend (terminal 2)
cd ../api
pnpm start:dev    # → http://localhost:3001

# 7. Ngrok para los webhooks de WhatsApp (terminal 3)
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

> ⚠️ Nunca subas archivos `.env` a GitHub. Están en `.gitignore`.

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

# OpenAI
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

- [x] Monorepo (Next.js + NestJS)
- [x] Docker con PostgreSQL (pgvector) + Redis
- [x] Autenticación con Clerk
- [x] Schema de base de datos con Drizzle ORM (7 tablas)
- [x] Webhook de Clerk → crea organización
- [x] Período de prueba de 7 días automático
- [x] Dashboard con 7 páginas y datos reales
- [x] Webhook de WhatsApp funcionando

### Fase 2 — Core del producto ✅ Completada

- [x] Pipeline RAG (pgvector + embeddings + OpenAI)
- [x] Upload y procesamiento de documentos
- [x] Chat de prueba integrado en el dashboard
- [x] Conversaciones en tiempo real en el dashboard
- [x] Handoff a agente humano
- [x] Log de eventos del sistema
- [x] Captura del nombre de WhatsApp del contacto
- [x] Notas internas por conversación
- [x] Resumen de conversación con IA (on-demand)
- [x] Página de inicio con métricas reales

### Fase 3 — Salida al mercado 🔄 En progreso

- [ ] Integraciones WhatsApp (cada empresa conecta su número)
- [ ] Deploy a producción (Vercel + Railway)
- [ ] Billing y planes
- [ ] Modo borrador / aprobación (guardrail de IA)
- [ ] Detección de leads calientes
- [ ] Reporte semanal por WhatsApp
- [ ] Rediseño visual completo del dashboard

### Fase 4 — Expansión vertical

- [ ] Sistema de turnos propio (Nivel 2 — peluquerías, consultorios)
- [ ] Tools / integraciones externas (Nivel 3 — hospitales, municipios)
- [ ] Widget web embebible
- [ ] Control de presupuesto de tokens por tenant
- [ ] Semantic cache + reranking
- [ ] Pipeline asincrónico con BullMQ

---

## Decisiones técnicas clave

### 1. Multi-tenancy por `org_id`
Todas las tablas llevan `org_id` y todas las queries filtran por él. Aísla los datos de cada empresa. (La migración futura a RLS de PostgreSQL está contemplada como refuerzo.)

### 2. Proxy Next.js con Clerk auth
El frontend no llama directo al backend (evita CORS y centraliza la autenticación). Cada llamada pasa por un Route Handler de Next.js que valida la sesión de Clerk, resuelve el `orgId` del usuario, y recién ahí llama a NestJS server-to-server.

### 3. pgvector sobre Pinecone (MVP)
Misma base de datos, menos dependencias externas, ahorro de ~$70/mes. Migración posible cuando supere ~5M vectores.

### 4. Meta WhatsApp Cloud API directa
Evita intermediarios (Twilio/BSP) que agregan costo y latencia por mensaje.

### 5. Drizzle ORM
Queries type-safe, migraciones versionadas, errores detectados en compilación.

### 6. Resumen con IA on-demand
El resumen de conversación se genera solo cuando el agente lo pide (no se persiste), para no gastar tokens en conversaciones que nadie va a leer. Excluye los mensajes de sistema del resumen.

### 7. Procesamiento síncrono en el MVP
Hoy el pipeline corre dentro del webhook. Es simple y suficiente para el volumen actual. La cola asincrónica (BullMQ sobre Redis) está prevista para cuando el volumen y la concurrencia lo justifiquen.

---

*Documentación viva — se actualiza con el desarrollo. Última actualización: Junio 2026.*