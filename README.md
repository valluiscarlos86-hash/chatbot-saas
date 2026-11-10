# 🤖 AtentIA — Chatbot SaaS con IA para WhatsApp

> Plataforma SaaS multi-tenant que permite a PyMEs automatizar su atención al cliente en WhatsApp usando IA, con información real de su negocio (documentos, webs o su tienda Tiendanube) y derivación a un agente humano cuando hace falta.

> ⚠️ **Estado real del proyecto:** ver [`ESTADO.md`](./ESTADO.md) — es la fuente de verdad sobre qué está implementado vs. qué es aspiracional. Este README describe la arquitectura; `ESTADO.md` describe qué de eso está realmente andando.

---

## ¿Qué es este proyecto?

Una plataforma donde una PyME puede registrarse, conectar su número de WhatsApp, cargar el conocimiento de su negocio, y tener un chatbot con IA respondiendo a sus clientes. Cuando la consulta es compleja o el cliente pide un humano, el bot deriva a un agente que toma el control desde el panel web.

Lo distintivo: además de responder desde documentos/webs (RAG), AtentIA puede **conectarse a la tienda Tiendanube del comercio** y responder precios y stock en vivo, en tiempo real, vía la API.

### Flujo de la empresa cliente

```
Registro → Conectar WhatsApp → Cargar conocimiento → Configurar bot → Activar
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                     │
            Tiendanube (en vivo)              Documentos / webs (RAG)
            precio y stock reales             FAQs, envíos, políticas
```

### Flujo del cliente final (WhatsApp)

```
Cliente escribe → Bot responde con info real → Si necesita humano → Agente toma la conversación
```

---

## Estado actual (resumen)

> Detalle completo y honesto en [`ESTADO.md`](./ESTADO.md).

### ✅ Funcional (end-to-end)

| Componente | Estado |
|---|---|
| Monorepo (Next.js + NestJS + Drizzle) | ✅ |
| Auth multi-tenant con Clerk | ✅ |
| PostgreSQL + pgvector + Docker | ✅ |
| Pipeline RAG (Firecrawl + chunking + embeddings + pgvector) | ✅ |
| WhatsApp end-to-end (webhook + Graph API) | ✅ |
| Generación de respuestas con OpenAI (gpt-4o-mini) | ✅ |
| Derivación a humano: el asistente la decide y el sistema cambia el estado, con nota de traspaso | ✅ |
| Procesamiento de documentos y scraping de URLs | ✅ |
| Dashboard de conversaciones, config del bot, chat de prueba | ✅ |
| **Integración Tiendanube completa** (OAuth + API + function calling + precedencia) | ✅ |
| Panel de analítica: resolución sin humano, tiempo de respuesta y temas más consultados | ✅ |

### 🟡 Parcial

| Componente | Estado |
|---|---|
| Contador de mensajes (existe, no se incrementa) | 🟡 |
| Trial de 7 días (se muestra, no acciona al vencer) | 🟡 |
| Widget web (es un snippet de botón a WhatsApp, no chat embebible) | 🟡 |

### ❌ Aspiracional (documentado, sin código)

| Componente | Estado |
|---|---|
| Billing / Stripe / pagos | ❌ |
| Enforcement de límites de uso | ❌ |
| Cola de mensajes (BullMQ/Redis) — todo es síncrono hoy | ❌ |
| Row Level Security (aislamiento es por `WHERE org_id` manual) | ❌ |
| Model routing, semantic cache, control de tokens | ❌ |
| Deploy a producción | ❌ |

---

## Arquitectura real

### Flujo de un mensaje de WhatsApp (hoy: síncrono)

```
1. Cliente escribe en WhatsApp
2. Meta envía webhook al backend (NestJS)
3. Backend resuelve la org por phone_number_id
4. Upsert de la conversación; chequea si está en human_takeover
   → si está en modo humano: persiste el mensaje y NO responde (corta acá)
5. Carga historial (SELECT últimos 10 de Postgres)
6. Llama a aiService.generateResponse:
     - genera embedding de la query
     - busca chunks en pgvector (RAG)
     - si la org tiene Tiendanube conectado: ofrece tools (function calling)
     - llama a OpenAI gpt-4o-mini
     - si OpenAI pide una tool: consulta Tiendanube en vivo y vuelve a llamar
7. Persiste el mensaje del cliente
8. Envía la respuesta vía Graph API y la persiste
```

> **Importante:** todo esto ocurre dentro del mismo request HTTP del webhook. No hay cola. Funciona bien a bajo volumen; es el primer punto a resolver para escalar (ver `ESTADO.md`, sección 7).

### Multi-tenancy

Cada empresa es un tenant con datos separados por `org_id`. **El aislamiento es por convención** — cada query agrega `WHERE org_id = ...` manualmente. NO hay Row Level Security a nivel de base de datos todavía (deuda conocida).

### Pipeline RAG

```
Documento/URL → extracción → chunking (500 palabras, solapamiento 50)
   → embedding por chunk (OpenAI text-embedding-3-small)
   → guardado en pgvector
   → en query: embedding de la pregunta → cosine similarity → top chunks → prompt
```

### Precedencia de fuentes (con Tiendanube conectado)

```
Pregunta de producto/precio/stock → SIEMPRE Tiendanube (tool en vivo)
   → si no está en Tiendanube: "no disponible" (no cae al RAG)
Pregunta general (envíos, pagos, horarios) → RAG (documentos/webs)
```

---

## Stack tecnológico

### Frontend — `apps/web`
- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS** + **React**
- Actúa como proxy autenticado: el browser nunca llama directo al backend; pasa por route handlers con Clerk.

### Backend — `apps/api`
- **NestJS** (modular, DI) + **TypeScript** + **Node.js**
- Módulos: organizations, whatsapp-accounts, conversations, webhooks, documents, ai, tiendanube.

### Datos
- **PostgreSQL 16** + **pgvector** (embeddings en la misma DB)
- **Drizzle ORM** (type-safe). Nota: la tabla `embeddings` vive solo en migraciones SQL, no en el schema Drizzle.
- **Redis**: ❌ no conectado todavía (estaba previsto para cola/cache).

### IA
- **OpenAI** directo (sin LangChain): `gpt-4o-mini` para respuestas y resúmenes, `text-embedding-3-small` para embeddings.

### Integraciones externas
- **Meta WhatsApp Business API** (Cloud API directa, sin BSP)
- **Firecrawl** (scraping de URLs para el RAG)
- **Tiendanube** (OAuth + API de productos en vivo)

---

## Estructura del proyecto

```
chatbot-saas/
├── apps/
│   ├── web/                      # Frontend Next.js
│   │   └── app/
│   │       ├── dashboard/        # inicio, conversaciones, chatbot,
│   │       │                     # documentos, analitica, integraciones, settings
│   │       └── api/              # route handlers (proxy a NestJS)
│   └── api/                      # Backend NestJS
│       └── src/
│           ├── ai.service.ts     # RAG + OpenAI + function calling
│           ├── webhooks/         # webhook de WhatsApp y Clerk
│           ├── conversations/    # handoff, agente
│           ├── documents.service.ts  # ingest RAG
│           ├── firecrawl.service.ts  # scraping
│           └── tiendanube/       # integración Tiendanube
├── packages/
│   └── database/                 # schema Drizzle + migraciones
└── infrastructure/
    └── docker-compose.dev.yml    # PostgreSQL (Redis previsto, no usado aún)
```

---

## Cómo correr localmente

### Requisitos previos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 22 o superior | Ejecuta el frontend y el backend |
| pnpm | 11.1.3 | Gestor de paquetes del monorepo (`npm install -g pnpm`) |
| Docker Desktop | 27 o superior | Levanta PostgreSQL con la extensión pgvector |
| Git | 2.x | Clonar el repositorio |

### Pasos

Todos los comandos se ejecutan desde la raíz del repositorio, salvo donde se
indica lo contrario.

```bash
# 1. Clonar e instalar las dependencias de todo el monorepo
git clone https://github.com/valluiscarlos86-hash/chatbot-saas.git
cd chatbot-saas
pnpm install

# 2. Crear los archivos de configuración a partir de los ejemplos
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
#    Completar las claves en ambos archivos (ver "Variables de entorno")

# 3. Levantar PostgreSQL con pgvector
docker compose -f infrastructure/docker-compose.dev.yml up -d

# 4. Crear las tablas: ocho migraciones de Drizzle
cd packages/database && pnpm db:migrate && cd ../..

# 5. Backend, en una terminal
cd apps/api && pnpm start:dev        # → http://localhost:3001

# 6. Frontend, en otra terminal, desde la raíz del repositorio
cd apps/web && pnpm dev              # → http://localhost:3000
```

> El paso 4 no es opcional. Sin las migraciones la base queda vacía y la
> aplicación levanta pero falla en la primera consulta.

> Correr el backend con `pnpm start:dev`, nunca desde `dist/`: el build
> compilado puede quedar desactualizado y fallar al iniciar.

### Verificar que quedó andando

| Dirección | Qué debería verse |
|---|---|
| http://localhost:3000 | Página de inicio de AtentIA |
| http://localhost:3001 | Respuesta del backend |
| http://localhost:3000/dashboard/chatbot | Configuración del bot y chat de prueba, después de registrarse |

---

## Variables de entorno

El repositorio incluye dos archivos de ejemplo con todas las variables
necesarias y ninguna clave real: `apps/api/.env.example` y
`apps/web/.env.local.example`. Los archivos con valores reales están en
`.gitignore` y no se publican.

### Backend — `apps/api/.env`

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión a PostgreSQL |
| `OPENAI_API_KEY` | Sí | Generación de respuestas y de embeddings |
| `CLERK_WEBHOOK_SECRET` | Sí | Verificación de la firma del webhook de Clerk |
| `WHATSAPP_VERIFY_TOKEN` | Solo para WhatsApp | Validación del webhook de Meta |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` | Solo para WhatsApp | Credenciales de la cuenta de prueba |
| `FIRECRAWL_API_KEY` | Solo para cargar URLs | Extracción del contenido de páginas web |
| `TIENDANUBE_APP_ID`, `TIENDANUBE_CLIENT_SECRET` | Solo para Tiendanube | Credenciales de la aplicación |
| `PORT` | No | Puerto del backend. Por omisión, 3001 |

El token de acceso de cada cuenta de WhatsApp se guarda en la base de datos por
organización, no como variable de entorno global.

### Frontend — `apps/web/.env.local`

| Variable | Obligatoria | Para qué |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` | Sí | Autenticación |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` y las tres rutas restantes | Sí | Pantallas de ingreso y registro |
| `DATABASE_URL` | Sí | Consultas directas desde los Server Components |
| `BACKEND_URL` | Sí | Dirección del backend. En desarrollo, `http://localhost:3001` |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | No | Número de contacto que muestra el panel |

### Nota para quien evalúa el prototipo

Levantar el sistema completo requiere credenciales propias de servicios externos
—OpenAI, Clerk y, de forma opcional, Meta WhatsApp Business, Tiendanube y
Firecrawl—. Son cuentas personales con facturación asociada, por lo que no
pueden publicarse en un repositorio.

Sin esas credenciales el proyecto compila y levanta, pero el asistente no genera
respuestas. Para ver el sistema funcionando sin configurar nada está el **video
de demostración** enlazado en la entrega, donde se recorren las funcionalidades
principales sobre una instalación real.

---

## Roadmap real

### ✅ Hecho
- Fundaciones (monorepo, auth, DB, Docker)
- Pipeline RAG completo
- WhatsApp end-to-end + handoff humano
- Integración Tiendanube (OAuth + API + function calling + precedencia de fuentes)

### ◻️ Próximo (producto)
- **Venta conversacional** (el bot cierra la venta en WhatsApp: carrito, datos, orden, pago) — feature grande
- Búsqueda semántica de productos (mirar descripciones, no solo nombres)
- Panel de analítica leyendo datos reales
- Killer features de estrategia: modo borrador/aprobación, reporte semanal, detección de lead caliente

### ◻️ Antes de escalar (deuda de infra consciente)
- Cola de mensajes (Redis + BullMQ) — hoy todo es síncrono
- Enforcement de límites + conteo de mensajes real
- Billing (Mercado Pago / dLocal)
- RLS o guard centralizado de `org_id`
- Deploy a producción (Railway + Vercel)

---

## Decisiones técnicas clave

1. **pgvector sobre Pinecone (MVP):** embeddings en la misma DB, menos dependencias. Migrar si supera ~5M vectores.
2. **OpenAI directo (sin LangChain):** menos abstracción, control total del prompt y el loop de tools.
3. **WhatsApp Cloud API directa (sin BSP):** más control, menos costo por mensaje en el MVP.
4. **Tiendanube como primer "sistema externo" (function calling):** valida la arquitectura de tools que después sirve para otras integraciones.
5. **Aislamiento por `org_id` (RLS pendiente):** suficiente para el MVP; endurecer antes de escalar.

---

*Documentación técnica. Para el estado real ítem por ítem, ver [`ESTADO.md`](./ESTADO.md). Última actualización: Junio 2026.*
