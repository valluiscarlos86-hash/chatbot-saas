# AtentIA — Documento de Producto

> Plataforma SaaS de atención al cliente con IA para WhatsApp y web.
> Versión del documento: 2.0 — Junio 2026

---

## Visión del producto

Cualquier empresa puede registrarse, conectar su WhatsApp, cargar el conocimiento de su negocio, y en minutos tener un chatbot con IA respondiendo automáticamente a sus clientes 24/7 — usando información real del negocio, no respuestas genéricas.

Cuando la consulta es compleja o el cliente pide hablar con una persona, el bot deriva automáticamente a un agente humano que toma el control desde el panel web.

---

## Modelo de negocio

Suscripción mensual por empresa según volumen de mensajes:

| Plan | Mensajes/mes | Precio | Agentes |
|------|-------------|--------|---------|
| Free (prueba 7 días) | 150 | $0 | 1 |
| Basic | 1.000 | $29 USD | 2 |
| Pro | 5.000 | $79 USD | 5 |
| Enterprise | Ilimitado | A convenir | Ilimitado |

Período de prueba: 7 días gratuitos, extensible manualmente por el equipo de AtentIA.

> Tools / integraciones externas (Nivel 3 del producto) son una feature de plan alto — 5-10× el precio base. Ver `ESTRATEGIA.md`.

---

## Fase 1 — Fundaciones ✅ Completada

- Monorepo con pnpm workspaces y Turborepo
- Frontend Next.js 16 + TypeScript + Tailwind CSS
- Backend NestJS + TypeScript
- Docker local con PostgreSQL (pgvector 0.8.2) + Redis
- Autenticación con Clerk (login, registro, sesiones)
- Schema de base de datos con Drizzle ORM (7 tablas)
- Migraciones versionadas
- Webhook de Clerk → crea organización automáticamente en PostgreSQL
- Período de prueba automático de 7 días al registrarse
- Dashboard con 7 páginas
- Todo versionado en GitHub

---

## Fase 2 — Core del producto ✅ Completada

### 2.1 Página de inicio

- Saludo personalizado con nombre del usuario (via Clerk)
- Badge de período de prueba con días restantes
- Métricas reales desde la DB: mensajes este mes, conversaciones activas, documentos listos
- Conversaciones recientes con avatar de iniciales, preview del último mensaje y dot de estado
- "Ver todas" enlaza al panel de conversaciones

### 2.2 Panel de conversaciones

Vista dividida en dos paneles, estilo WhatsApp Web:

**Panel izquierdo — lista de conversaciones**
- Listado ordenado por más reciente, con datos reales de la DB
- Buscador por nombre de cliente o número de teléfono
- Filtros por estado: Todos / Abierto (bot_active + human_takeover) / Cerrado
- Preview del último mensaje (filtrando mensajes de sistema)
- Captura automática del nombre de perfil de WhatsApp del contacto

**Panel derecho — hilo de mensajes**
- Burbujas diferenciadas: verde (cliente), blanco (bot/agente), pill gris centrada (sistema)
- Separadores de fecha entre días
- Log de eventos del sistema: "Conversación tomada por un agente", "Bot reactivado", "Conversación cerrada"
- Horario en cada mensaje

**Barra de acciones**
- Botón contextual por estado: "Tomar control" / "Reactivar bot" / "Cerrar"
- Búsqueda de mensajes en el hilo actual (filtro client-side)
- Toggle de panel de info del contacto
- Botón de resumen con IA (ícono varita/sparkles)

**Resumen con IA (on-demand)**
- Generado al instante cuando el agente lo pide, sin persistir en DB
- Muestra: qué quiere el cliente, qué se le respondió, en qué quedó, qué necesita el agente hacer ahora
- Cuadro destacado con fondo violeta, arriba del hilo de mensajes
- Excluye mensajes de sistema del resumen

**Panel de info del contacto (toggle)**
- Teléfono, nombre, fecha de inicio de conversación, estado actual
- Nota interna (textarea, guarda on-blur, solo visible en el dashboard, nunca al cliente)
- Persistida en `conversations.metadata.internal_note` (jsonb merge, no pisa otras claves)

**Barra de respuesta del agente**
- Solo visible cuando el status es `human_takeover`
- Fondo ámbar para diferenciarla visualmente
- Enter para enviar, envía por WhatsApp y guarda en la DB

### 2.3 Handoff a humano

- Cuando el agente toca "Tomar control": status → `human_takeover`, el bot deja de responder
- Mientras está en `human_takeover`: el webhook guarda el mensaje del cliente pero NO llama a OpenAI
- El agente responde desde el dashboard; el mensaje se envía por WhatsApp y se guarda como `role: assistant`
- "Reactivar bot": status → `bot_active`, el bot vuelve a responder normalmente
- "Cerrar": status → `closed`
- Cada cambio de estado inserta un mensaje `role: system` con texto descriptivo visible en el hilo

### 2.4 Configuración del chatbot

**Mi empresa**
- Nombre del negocio
- Descripción (contexto para el bot)
- Datos de contacto

**Mi bot**
- Nombre del bot
- Tono de respuesta (amigable, formal, neutro)
- Mensaje de bienvenida

**Instrucciones al bot**
- Reglas de escalada (cuándo derivar a humano)
- Horario de atención

**Chat de prueba integrado**
- Segunda columna a la derecha del formulario de config
- Chat en vivo que usa el mismo pipeline RAG que WhatsApp
- Burbujas diferenciadas, indicador de "escribiendo" (tres puntos animados)
- Enter para enviar

### 2.5 Documentos (knowledge base)

- Upload drag & drop de PDF y TXT (máximo 10MB)
- Procesamiento automático: extracción de texto → chunking (500 palabras, 50 overlap) → embeddings OpenAI
- Estado en tiempo real con polling (Pendiente → Procesando → Listo / Error)
- Lista de documentos con tamaño, cantidad de chunks, estado
- Eliminar documento (borra el documento y todos sus embeddings)

### 2.6 Pipeline de IA (RAG)

- Modelo de embeddings: `text-embedding-3-small` (vector 1536)
- Almacenamiento: pgvector con extensión activada en PostgreSQL
- Búsqueda: cosine similarity, threshold > 0.3, LIMIT 4 chunks
- LLM: GPT-4o-mini
- El bot usa el historial de la conversación + chunks relevantes para responder
- No inventa información: si no tiene datos, lo dice y deriva

### 2.7 Configuración de cuenta

- Edición de nombre (actualiza Clerk via server action + revalida el path del dashboard)
- Email de solo lectura
- Plan actual visible con límites
- Cerrar sesión

---

## Fase 3 — Salida al mercado 🔄 En progreso

### 3.1 Integraciones WhatsApp ← próximo

Formulario para que cada empresa conecte su propio número desde el dashboard:
- Phone Number ID
- Access Token
- Business Account ID de Meta

Primera etapa: manual asistido (AtentIA ayuda a los primeros clientes). Etapa futura: Embedded Signup automático.

### 3.2 Deploy a producción

- Frontend en Vercel
- Backend en Railway
- PostgreSQL en Railway (migración a Neon cuando el volumen lo justifique)
- Redis en Railway
- Variables de entorno en los dashboards de cada servicio

### 3.3 Billing

- Planes y suscripciones
- Medio de pago a definir para LatAm (Mercado Pago / dLocal / Stripe con adaptación)
- Límites automáticos según plan
- Alertas al acercarse al límite mensual

### 3.4 Killer features de ventas (baja complejidad, alto impacto)

Ver detalle completo en `ESTRATEGIA.md`.

**Modo borrador / aprobación**
El bot redacta la respuesta pero no la envía hasta que el dueño aprueba desde el celular. Ataca el miedo a la alucinación. Gancho de onboarding.

**Reporte semanal por WhatsApp**
Mensaje automático al dueño cada semana: consultas respondidas, derivaciones, preguntas más frecuentes. Reduce churn.

**Detección de lead caliente**
Notificación al dueño cuando el cliente dice "quiero comprarlo", "cómo pago", etc. Convierte consultas en ventas.

---

## Fase 4 — Expansión vertical

### Nivel 2 — Sistema de turnos propio

Calendario de disponibilidad nativo en el dashboard. La empresa define sus horarios, el bot agenda turnos directamente sin integraciones externas.

Mercado objetivo: peluquerías, consultorios médicos, estudios de tatuajes, talleres mecánicos.

### Nivel 3 — Tools / integraciones externas

Function calling + integración con sistemas externos vía API. El bot ejecuta acciones reales en sistemas de terceros.

Mercado objetivo: hospitales, municipios, concesionarias, empresas con sistemas legacy.

Aspiracional: Municipalidad de Cosquín (turnos de carnet, automatización de reclamos).

> Regla: no construir Nivel 3 antes de tener Nivel 2 con clientes reales pagando. La arquitectura de tools es la misma para todos los casos.

### Widget web embebible

Script que las empresas pegan en su sitio:

```html
<script src="https://cdn.atentia.app/widget.js" data-org="tu-org-id"></script>
```

Aparece un botón de chat en la esquina inferior derecha. Las conversaciones se unifican en el panel de AtentIA.

### Analítica

- Porcentaje de consultas resueltas por el bot sin intervención humana
- Tiempo promedio de respuesta
- Preguntas más frecuentes
- Conversaciones por día/semana/mes

### Rediseño visual completo

Sesión dedicada de diseño del dashboard y landing: paleta de marca AtentIA, tipografía, componentes reutilizables, estados vacíos con onboarding.

Referencias de diseño: Emil Kowalski, Impeccable Style, Tasteskill.dev.

---

## Decisiones de producto tomadas

**Sesión permanente en Clerk** — comportamiento correcto para un SaaS B2B de uso diario.

**Período de prueba extensible manualmente** — flexibilidad para cerrar primeros clientes sin fricción técnica.

**pgvector sobre Pinecone en MVP** — menos dependencias, ahorro de ~$70/mes. Migración posible cuando supere 5M vectores.

**Procesamiento síncrono en MVP** — el pipeline RAG corre dentro del webhook. Simple y suficiente. BullMQ se activa cuando el volumen lo justifique.

**Resumen con IA on-demand** — se genera al pedido, no se persiste. No gasta tokens en conversaciones que nadie va a leer.

**Meta WhatsApp Cloud API directa** — sin intermediarios (Twilio/BSP) que agregan costo y latencia.

**Proxy Next.js con Clerk auth** — el frontend nunca llama directo al backend. Centraliza auth y evita CORS.

**Notas internas en `metadata` jsonb** — merge con `||` en vez de sobrescribir, para no pisar otras claves futuras del objeto.

---

## Métricas de éxito del MVP

- 10 empresas en período de prueba activo
- 3 empresas convertidas a plan pago (Plan Fundador)
- Tasa de resolución del bot > 60%
- Tiempo de respuesta del bot < 3 segundos

---

## Features descartadas o pospuestas

**Flow Builder visual** — constructor de flujos con drag & drop. Pospuesto indefinidamente. AtentIA apuesta a IA generativa que infiere de documentos, no a flujos fijos. Agregar un builder visual contradice el diferencial de simplicidad.

**Semantic cache** — reducción de costos por caching de respuestas similares. Pospuesto para después de tener volumen suficiente que lo justifique.

**BullMQ / cola asincrónica** — preparada en la infra (Redis ya corre), se activa cuando el volumen de mensajes concurrentes lo requiera.

---

*Documento vivo — se actualiza con cada decisión de producto.*
*Última actualización: Junio 2026*