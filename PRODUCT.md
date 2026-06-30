# AtentIA — Documento de Producto

> Plataforma SaaS de atención al cliente con IA para WhatsApp.
> Versión del documento: 2.0 — Junio 2026.
> Estado real ítem por ítem: ver [`ESTADO.md`](./ESTADO.md).

---

## Visión del producto

Cualquier PyME puede registrarse, conectar su WhatsApp, cargar el conocimiento de su negocio, y tener un chatbot con IA respondiendo a sus clientes con información real — no respuestas genéricas.

A diferencia de un bot que solo lee documentos, AtentIA puede **conectarse a la tienda online del comercio (Tiendanube)** y responder precios y stock en vivo, en tiempo real. Cuando la consulta es compleja o el cliente pide un humano, el bot deriva a un agente que toma el control desde el panel web.

**Lo que cambió desde la v1 de este documento:** ya no somos solo "un bot que informa desde documentos". Construimos la integración con Tiendanube (function calling con datos en vivo), lo que nos posiciona como "el bot que se conecta con tu tienda". Es otra venta y otro diferencial.

---

## Modelo de negocio

> ⚠️ El billing **todavía no está implementado** (ver `ESTADO.md`). Esta es la estructura de planes prevista; hoy no hay cobro ni enforcement de límites.

| Plan | Mensajes/mes | Precio estimado | Agentes |
|------|-------------|-----------------|---------|
| Free (prueba) | 150 | $0 | 1 |
| Basic | 1.000 | $29 USD | 2 |
| Pro | 5.000 | $79 USD | 5 |
| Enterprise | Ilimitado | A convenir | Ilimitado |

Período de prueba: 7 días. (Hoy se setea y se muestra, pero no bloquea nada al vencer — ver `ESTADO.md`.)

---

## Fase 1 — Fundaciones ✅ COMPLETADA

- Monorepo con pnpm workspaces y Turborepo
- Frontend Next.js + TypeScript + Tailwind
- Backend NestJS + TypeScript
- Docker local con PostgreSQL (pgvector)
- Autenticación con Clerk (login, registro, sesiones, multi-tenant)
- Schema de base de datos con Drizzle ORM
- Migraciones versionadas
- Webhook de Clerk → crea organización automáticamente
- Período de prueba de 7 días al registrarse (informativo)

> Redis estaba previsto en esta fase pero **no se conectó** — no hay cola ni cache de infraestructura todavía.

---

## Fase 2 — Core del producto ✅ MAYORMENTE COMPLETADA

### 2.1 Dashboard principal ✅
Inicio post-login con métricas reales (mensajes, conversaciones, documentos), badge de trial con días restantes, conversaciones recientes con estado, accesos rápidos.

### 2.2 Panel de conversaciones ✅
Lista de conversaciones, hilo de mensajes, diferenciación bot/humano, botón "ver contexto" (chunks RAG usados), pausar bot / tomar control / reactivar / cerrar, caja para que el agente escriba por WhatsApp.

### 2.3 Panel de configuración + knowledge base ✅
- **Mi empresa:** nombre, descripción, datos de contacto.
- **Instrucciones al bot:** nombre, tono, reglas de escalada, horario, mensaje de bienvenida.
- **Base de conocimiento:** upload de PDF/TXT, scraping de URLs, estado de procesamiento real, eliminar.
- **Testear el bot:** chat de prueba en vivo con fuentes RAG visibles.

### 2.4 Integración WhatsApp ✅
Conexión con Meta WhatsApp Business API, recepción vía webhook, envío de respuestas del bot y del agente.

### 2.5 Pipeline de IA (RAG) ✅
Extracción, chunking, embeddings, búsqueda semántica con pgvector, llamada a OpenAI, memoria conversacional (SELECT de Postgres).

> Lo previsto pero **no implementado** en esta fase: caché semántico, model routing (mini vs 4o), control de presupuesto de tokens. Ver `ESTADO.md`.

### 2.6 Widget para web 🟡
Implementado como **generador de snippet** de un botón flotante que abre WhatsApp (`wa.me/...`). NO es un chat embebible con IA. Útil como CTA, pero el nombre "widget" puede confundir.

---

## Fase 2.5 — Integración Tiendanube ✅ COMPLETADA (nueva)

> Esta fase no existía en la v1 del documento. Se construyó en Junio 2026.

El bot puede conectarse a la tienda Tiendanube del comercio y responder con datos en vivo:

- **Conexión OAuth 2.0** — el comerciante conecta su tienda con un click; el token se guarda por org.
- **Consulta en vivo** — precio, precio promocional, stock y disponibilidad reales vía la API de Tiendanube.
- **Function calling** — el bot decide solo cuándo consultar la tienda (preguntas de producto) y cuándo usar el RAG (info general). Las tools solo se activan si la org tiene Tiendanube conectado.
- **Precedencia de fuentes** — con Tiendanube conectado, precio/stock salen SIEMPRE de la tienda, no del RAG. Si un producto no está en Tiendanube, el bot dice "no disponible" (no inventa desde documentos viejos).
- **Dos caminos en la UI** — "Tienda online" (Tiendanube en vivo) vs "Documentos y webs" (RAG), que conviven.
- **Conectar / desconectar** — desconectar apaga la fuente al instante; reconectar es un click.

**Significado estratégico:** esto es "Nivel 3 — INTEGRA" según `ESTRATEGIA.md`, construido antes del Nivel 2 (agenda). Validó que la arquitectura de function calling funciona, base para futuras integraciones.

---

## Fase 3 — Escala y negocio ◻️ PENDIENTE

> Nada de esta fase está implementado todavía. Es el trabajo "antes de crecer".

### 3.1 Billing con Stripe / Mercado Pago ❌
Planes, upgrade/downgrade, facturación, límites automáticos, alertas de cuota. (Stripe no opera fácil en LatAm — evaluar Mercado Pago / dLocal.)

### 3.2 Analítica ❌
Hoy la página está **mockeada** (valores hardcodeados). Pendiente: % resuelto por el bot sin humano, tiempo de respuesta, preguntas frecuentes, conversaciones por período, performance por agente.

### 3.3 Respuestas rápidas ❌
Atajos `/` para respuestas frecuentes del agente.

### 3.4 Panel de super admin ❌
Para el equipo de AtentIA: ver orgs, extender trials, cambiar planes, ver uso, bloquear.

### 3.5 Deploy a producción ❌
Vercel (frontend) + Railway (backend + DB + Redis) + CI/CD.

### 3.6 Infraestructura para escalar ❌
- Cola de mensajes (Redis + BullMQ) — hoy todo es síncrono
- Enforcement de límites + conteo real de mensajes
- RLS o guard centralizado de `org_id`
- Model routing, semantic cache, control de tokens

---

## Fase 4 — Venta conversacional ◻️ VISIÓN (próxima feature grande)

El salto de "el bot informa" a "el bot vende". El bot no deriva ni pasa links: cierra la venta dentro de WhatsApp.

- Carrito en la conversación (el bot arma el pedido)
- Toma de datos del cliente (nombre, dirección, talle)
- Generación de la orden (API de órdenes de Tiendanube)
- Integración de pago (Mercado Pago / link de pago)
- Confirmación y seguimiento

Es un proyecto en sí mismo, con su propia sesión de diseño.

---

## Decisiones de producto tomadas

- **Sesión permanente en Clerk** — SaaS B2B de uso diario, no se reingresa contraseña.
- **Trial extensible manual** — flexibilidad para cerrar los primeros clientes sin fricción. Se automatiza con billing más adelante.
- **pgvector sobre Pinecone (MVP)** — misma DB, menos dependencias.
- **Tiendanube como primera integración externa** — valida la arquitectura de tools, diferencial de venta para comercios.
- **Precedencia Tiendanube > RAG** — la fuente en vivo manda para precio/stock; el RAG no compite en eso. Evita que el bot mienta con datos viejos.
- **Widget = botón a WhatsApp (por ahora)** — un chat embebible real es trabajo futuro.

---

## Métricas de éxito del MVP

- 10 empresas en período de prueba activo
- 3 empresas convertidas a plan pago (requiere billing — pendiente)
- Tasa de resolución del bot > 60%
- Tiempo de respuesta del bot < 3 segundos

---

*Documento vivo. Para el estado real de implementación, ver [`ESTADO.md`](./ESTADO.md). Última actualización: Junio 2026.*
