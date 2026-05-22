# AtentIA — Documento de Producto

> Plataforma SaaS de atención al cliente con IA para WhatsApp y web.
> Versión del documento: 1.0 — Mayo 2026

---

## Visión del producto

Cualquier empresa puede registrarse, conectar su WhatsApp, cargar el conocimiento de su negocio, y en minutos tener un chatbot con IA respondiendo automáticamente a sus clientes 24/7 — usando información real del negocio, no respuestas genéricas.

Cuando la consulta es compleja o el cliente pide hablar con una persona, el bot deriva automáticamente a un agente humano que toma el control desde el panel web.

---

## Modelo de negocio

Suscripción mensual por empresa según volumen de mensajes:

| Plan | Mensajes/mes | Precio estimado | Agentes |
|------|-------------|-----------------|---------|
| Free (prueba) | 150 | $0 | 1 |
| Basic | 1.000 | $29 USD | 2 |
| Pro | 5.000 | $79 USD | 5 |
| Enterprise | Ilimitado | A convenir | Ilimitado |

Período de prueba: 7 días gratuitos, extensible manualmente por el equipo de AtentIA.

---

## Fase 1 — Fundaciones (completada)

- Monorepo con pnpm workspaces y Turborepo
- Frontend Next.js 15 + TypeScript + Tailwind CSS
- Backend NestJS + TypeScript
- Docker local con PostgreSQL (pgvector) + Redis
- Autenticación con Clerk (login, registro, sesiones)
- Schema de base de datos con Drizzle ORM (5 tablas)
- Migraciones versionadas
- Webhook de Clerk → crea organización automáticamente en PostgreSQL
- Período de prueba automático de 7 días al registrarse
- Todo versionado en GitHub

---

## Fase 2 — Core del producto (en construcción)

### 2.1 Dashboard principal

Página de inicio post-login con:

- Bienvenida personalizada con nombre del usuario
- Badge de período de prueba con días restantes
- Métricas clave: mensajes usados, conversaciones activas, documentos subidos
- Conversaciones recientes con estado (bot activo / esperando humano / cerrada)
- Accesos rápidos: conectar WhatsApp, subir documento, configurar bot

### 2.2 Panel de conversaciones

Vista dividida en dos paneles:

**Panel izquierdo — lista de conversaciones**
- Listado ordenado por más reciente
- Buscador por nombre de cliente o número de teléfono
- Filtros por estado: todas, activas, esperando humano, cerradas
- Etiquetas configurables por la empresa (venta, soporte, reclamo, etc.)
- Indicador visual de estado por conversación

**Panel derecho — hilo de mensajes**
- Mensajes del cliente y respuestas del bot diferenciados visualmente
- Indicador de qué mensajes respondió el bot vs un humano
- Botón "Ver contexto" (ícono de libro) — muestra los chunks del documento que usó el bot para responder esa pregunta
- Botones de acción:
  - Pausar bot / Tomar control
  - Reactivar bot
  - Cerrar conversación
- Caja de texto para que el agente escriba y envíe mensajes directamente por WhatsApp
- Notas internas visibles solo para el equipo, no para el cliente

### 2.3 Panel de agente / knowledge base

El corazón del producto. Donde la empresa configura su chatbot:

**Mi empresa**
- Nombre del negocio
- Descripción del negocio (contexto para el bot)
- Datos de contacto e información adicional

**Instrucciones al bot**
- Nombre del bot (ej: "Asistente de TiendaRopa")
- Tono de respuesta: formal, amigable, neutro
- Idioma principal
- Reglas de escalada: cuándo derivar a humano
- Horario de atención (fuera de horario avisa automáticamente)
- Mensaje de bienvenida personalizado

**Base de conocimiento**
- Upload de documentos: PDF, Word, TXT
- Estado de procesamiento: pendiente, procesando, listo, error
- Visualización de chunks generados por documento
- Eliminar documentos

**Testear el bot**
- Chat de prueba en tiempo real dentro del panel
- Cada respuesta muestra el ícono de libro para ver el contexto utilizado
- Permite iterar el conocimiento sin esperar mensajes reales

### 2.4 Integración WhatsApp

- Conexión con Meta WhatsApp Business API
- Recepción de mensajes entrantes vía webhook
- Envío de respuestas del bot y del agente
- Soporte para múltiples números por organización (planes Pro y Enterprise)

### 2.5 Pipeline de IA (RAG)

- Procesamiento de documentos: extracción, chunking, embeddings
- Búsqueda semántica con pgvector
- Llamada a LLM (GPT-4o-mini para consultas simples, GPT-4o para complejas)
- Memoria conversacional en Redis
- Caché semántico para reducir costos (25-35% estimado)
- Control de presupuesto de tokens por organización

### 2.6 Widget embebible para web

Un pequeño script que las empresas pegan en su sitio web:

```html
<script src="https://cdn.atentia.app/widget.js" data-org="tu-org-id"></script>
```

Aparece un botón de chat en la esquina inferior derecha. El cliente puede chatear directamente desde la web sin abrir WhatsApp. Las conversaciones se unifican en el panel de AtentIA.

---

## Fase 3 — Escala y negocio

### 3.1 Billing con Stripe

- Planes de suscripción mensual
- Upgrade y downgrade de plan
- Historial de facturación
- Límites automáticos según plan
- Alertas cuando el cliente se acerca al límite mensual

### 3.2 Analítica

- Porcentaje de consultas resueltas por el bot sin intervención humana
- Tiempo promedio de respuesta
- Preguntas más frecuentes (wordcloud o ranking)
- Conversaciones por día/semana/mes
- Performance por agente

### 3.3 Respuestas rápidas

El agente puede guardar respuestas frecuentes y usarlas con un atajo `/` mientras escribe. Ahorra tiempo en consultas repetitivas.

### 3.4 Panel de administración (super admin)

Para el equipo de AtentIA, no para los clientes:

- Ver todas las organizaciones registradas
- Extender período de prueba manualmente
- Cambiar plan de una organización
- Ver uso de tokens por organización
- Bloquear organizaciones si es necesario

### 3.5 Deploy a producción

- Frontend en Vercel
- Backend en Railway con autoscaling
- PostgreSQL en Railway o Neon
- Redis en Railway
- CI/CD con GitHub Actions

---

## Decisiones de producto tomadas

**Sesión permanente en Clerk** — los usuarios de herramientas de trabajo diarias (como esta) no quieren reingresar su contraseña. Comportamiento correcto para un SaaS B2B.

**Período de prueba extensible manualmente** — da flexibilidad para cerrar los primeros clientes sin fricción técnica. Cuando el volumen lo justifique, se automatiza con Stripe.

**pgvector sobre Pinecone en MVP** — misma base de datos, menos dependencias externas, ahorro de ~$70/mes. Migración posible cuando supere los 5M vectores.

**BullMQ para el pipeline de mensajes** — el procesamiento de IA es asincrónico. Los mensajes de WhatsApp se encolan y procesan sin bloquear el servidor HTTP.

**Widget web propio** — diferenciador frente a competidores que solo hacen WhatsApp. Las empresas con sitio web lo van a valorar mucho.

---

## Métricas de éxito del MVP

- 10 empresas en período de prueba activo
- 3 empresas convertidas a plan pago
- Tasa de resolución del bot > 60% (el bot resuelve más de 6 de cada 10 consultas sin humano)
- Tiempo de respuesta del bot < 3 segundos

---

*Documento vivo — se actualiza con cada decisión de producto.*
*Última actualización: Mayo 2026*