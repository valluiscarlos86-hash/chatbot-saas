# 📸 AtentIA — Estado Real del Proyecto

> Foto honesta de qué está implementado, qué está a medias y qué es aspiracional.
> Basado en auditoría directa del código (no de la documentación previa).
> Última actualización: Junio 2026.

---

## Cómo leer este documento

Cada ítem tiene una de estas etiquetas:

- ✅ **FUNCIONAL** — implementado y andando end-to-end, validado.
- 🟡 **PARCIAL** — existe en el código pero incompleto, no conectado, o no acciona nada.
- ❌ **ASPIRACIONAL** — está en la documentación o en el schema, pero no hay código que lo ejecute.

Este documento es la **fuente de verdad** sobre el estado. Si otro documento (README, PRODUCT, ESTRATEGIA) contradice esto, este gana.

---

## Resumen ejecutivo

**AtentIA es un MVP funcional avanzado con escalabilidad de prototipo.**

El producto funciona de verdad de punta a punta: un cliente puede conectar WhatsApp, cargar conocimiento (documentos, webs, o su tienda Tiendanube), y tener un bot con IA respondiendo con información real, con derivación a humano cuando hace falta. Esa parte está sólida.

Lo que NO está es la infraestructura para escalar y monetizar: todo el procesamiento es síncrono (sin colas), no hay enforcement de límites de uso, no hay cobro, y el aislamiento entre clientes es por convención (no por base de datos). Esto es correcto para la etapa de "primeros 10 clientes", pero es deuda conocida antes de crecer.

---

## 1. Núcleo del producto (lo que funciona)

| Componente | Estado | Detalle |
|---|---|---|
| Pipeline RAG completo | ✅ | Firecrawl (scraping) + chunking (500 palabras, solapamiento 50) + embeddings reales (OpenAI `text-embedding-3-small`) + búsqueda en pgvector. |
| WhatsApp end-to-end | ✅ | Recibe vía webhook, resuelve org por `phone_number_id`, responde vía Graph API. Funciona. |
| Generación de respuestas IA | ✅ | OpenAI `gpt-4o-mini`, con system prompt configurable, historial (últimos 10), RAG inyectado. |
| Handoff a humano | ✅ | Estado real (`bot_active` / `human_takeover` / `closed`). En modo humano el bot NO responde, solo persiste el mensaje. El agente responde desde el panel. |
| Procesamiento de documentos | ✅ | Upload de PDF/TXT y scraping de URLs. Estado real (`pending`/`processing`/`ready`/`error`). Síncrono (sin cola). |
| Configuración del bot | ✅ | Nombre, tono, mensaje de bienvenida, reglas de escalada, horario. Todo persistido y usado. |
| Chat de prueba | ✅ | Prueba el bot desde el dashboard contra `/ai/test-chat`, muestra las fuentes RAG usadas. |
| Auth multi-tenant (Clerk) | ✅ | Login, registro, organización por usuario. Webhook de Clerk crea la org automáticamente. |

---

## 2. Integración Tiendanube (construida en esta etapa)

| Pieza | Estado | Detalle |
|---|---|---|
| OAuth 2.0 | ✅ | Conexión real, token guardado por org en `tiendanube_accounts`. |
| Cliente de API | ✅ | Productos simplificados, búsqueda combinada (API + filtro local tolerante a acentos), detalle por id, cache 60s. |
| Function calling | ✅ | El bot decide solo cuándo consultar Tiendanube en vivo. Tools `buscar_productos` / `ver_producto`. Solo se activan si la org tiene Tiendanube conectado. |
| Regla de precedencia | ✅ | Con Tiendanube conectado, precio/stock salen SIEMPRE de Tiendanube (no del RAG). Si un producto no está en Tiendanube, el bot dice "no disponible". |
| UI dos caminos | ✅ | En Documentos: "Tienda online" (Tiendanube en vivo) vs "Documentos y webs" (RAG). |
| Conectar / desconectar | ✅ | Desconectar borra el vínculo + limpia caches → el bot deja de usar la tienda al instante. Reconexión fluida. |

> **Nota estratégica:** esta integración es técnicamente "Nivel 3 — INTEGRA" según la escala de `ESTRATEGIA.md`. Se construyó antes del Nivel 2 (agenda de turnos). Decisión consciente, registrada acá.

---

## 3. Lo que está a medias (parcial)

| Componente | Estado | Qué falta |
|---|---|---|
| Contador de mensajes | 🟡 | `monthlyMessageCount` existe en el schema y se muestra en el dashboard, pero **nunca se incrementa**. Está muerto. |
| Período de prueba (trial) | 🟡 | `isTrial` / `trialEndsAt` se setean al registrarse (7 días) y se muestran, pero **no accionan nada** al vencer. Es informativo. |
| Plan del cliente | 🟡 | El enum `plan` existe, pero en Settings el "Plan actual" es texto hardcodeado. El botón "Mejorar plan" no hace nada. |
| Widget para web | 🟡 | NO es un chat embebible. Es un generador de snippet HTML de un botón flotante que abre WhatsApp (`wa.me/...`). Útil, pero no es un widget de chat con IA. |
| Página de Integraciones/Canales | 🟡 | WhatsApp funcional; Widget es snippet estático; Instagram es placeholder "Próximamente". |
| Settings | 🟡 | Datos de usuario (Clerk) reales; sección de plan/billing hardcodeada. |

---

## 4. Lo que NO existe (aspiracional)

| Componente | Estado | Realidad |
|---|---|---|
| Billing / Stripe / pagos | ❌ | Cero líneas de código. Solo está en la documentación. |
| Enforcement de límites | ❌ | Nada frena a un cliente que supera su cuota. El costo de OpenAI no tiene techo. |
| Cola de mensajes (BullMQ/Redis) | ❌ | No hay Redis conectado. Todo el procesamiento es síncrono dentro del request. |
| Worker / job processor | ❌ | No existe. Ni para mensajes ni para ingest de documentos. |
| Row Level Security (RLS) | ❌ | El aislamiento multi-tenant es 100% por `WHERE org_id = ...` manual. Sin red de seguridad a nivel DB. |
| Model routing (mini vs 4o) | ❌ | Siempre `gpt-4o-mini` fijo. No hay lógica de elegir modelo por complejidad. |
| Semantic cache | ❌ | No existe cache de respuestas del LLM. (El único cache es el de productos de Tiendanube.) |
| Control de tokens/costo por org | ❌ | `messages.tokensUsed` existe en el schema pero nunca se lee ni se guarda. |
| LangChain | ❌ | No se usa. Llamadas directas a la API de OpenAI. |
| Página de Analítica | ❌ | 100% mockeada. Valores hardcodeados (`'0%'`, `'0s'`, `'0'`). No lee ningún dato real. |
| Deploy a producción | ❌ | Corre solo en local. Sin Vercel/Railway configurados. |

---

## 5. Schema de base de datos (real)

Tablas modeladas en Drizzle (`packages/database/src/schema/index.ts`):

- `organizations` — incluye `plan`, `monthlyMessageLimit`, `monthlyMessageCount`, `credits`, `isActive`, `isTrial`, `trialEndsAt` (varios de estos campos existen pero no se accionan).
- `whatsappAccounts` — credenciales de WhatsApp por org.
- `conversations` — con estado (`bot_active`/`human_takeover`/`closed`).
- `messages` — con `tokensUsed` (no se usa).
- `knowledgeDocuments` — documentos y URLs del RAG, con estado de procesamiento.
- `chatbotConfigs` — configuración del bot por org.
- `tiendanubeAccounts` — vínculo OAuth con Tiendanube.

> ⚠️ La tabla `embeddings` (usada por el RAG) **no está modelada en Drizzle** — existe solo vía migraciones SQL crudas. Deuda técnica menor a documentar.

---

## 6. Variables de entorno realmente usadas (backend)

```
CLERK_WEBHOOK_SECRET
DATABASE_URL
FIRECRAWL_API_KEY
OPENAI_API_KEY
PORT
TIENDANUBE_APP_ID
TIENDANUBE_CLIENT_SECRET
WHATSAPP_VERIFY_TOKEN
```

No hay `REDIS_URL`, ni `STRIPE_*`, ni nada de billing — consistente con que esas features no existen. El access token de WhatsApp se guarda por cuenta en la DB, no como env var global.

---

## 7. Deuda de escalabilidad consciente

Esto es lo que hay que resolver **antes de crecer**, no ahora. Listado por orden de urgencia cuando llegue el momento:

1. **Cola de mensajes (Redis + BullMQ).** Hoy el webhook procesa síncrono. Con volumen, esto se cae. Es lo primero a resolver antes de escalar.
2. **Enforcement de límites + conteo de mensajes.** Sin esto, no hay negocio sostenible: los costos de OpenAI no tienen techo y los planes no significan nada.
3. **Billing real (Mercado Pago / dLocal para LatAm).** Stripe no opera fácil en la región.
4. **RLS o al menos un guard centralizado de `org_id`.** El aislamiento por convención es frágil; un olvido es una fuga de datos entre clientes.
5. **Deploy a producción** (Railway para arrancar).

---

## 8. Lo que sigue (próximos focos sugeridos)

**Camino A — Vender lo que hay (recomendado):**
Deploy a producción + conseguir los primeros clientes con lo que ya funciona. La arquitectura síncrona aguanta el volumen de 10 PyMEs sin problema.

**Camino B — Venta conversacional (Pieza 5):**
El bot no solo informa precio/stock sino que cierra la venta dentro de WhatsApp (carrito, datos del cliente, orden, pago). Es la visión de "vender desde AtentIA". Feature grande, sesión de diseño propia.

**Camino C — Endurecer para escalar:**
Resolver la deuda de escalabilidad (sección 7). Solo tiene sentido cuando haya tracción real que lo justifique.

---

*Documento de estado — refleja el código real, no la aspiración. Se actualiza tras cada hito de desarrollo.*
