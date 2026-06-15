# 📈 AtentIA — Estrategia, Producto y Go-to-Market

> Documento estratégico vivo. Complementa al `README.md` (técnico) y al `PRODUCT.md` (especificación de producto).
> Última actualización: Junio 2026.

---

## 1. Visión en una frase

Que cualquier PyME de LatAm pueda tener su WhatsApp respondiendo solo, con la información real de su negocio, en 15 minutos — y pueda intervenir un humano cuando quiera, desde un panel propio.

---

## 2. El mercado y dónde estamos parados

| Competidor | Qué hacen bien | Su debilidad (nuestra oportunidad) |
|---|---|---|
| **Globales** (Botpress, Intercom) | Potentes, completos | Complejos de configurar o caros para una PyME |
| **CRMs LatAm** (Callbell, Sirena) | Excelentes para gestión humana multi-agente | Su IA suele ser un añadido básico o basado en reglas |
| **Legacy bots** (Cliengo) | Fáciles de empezar | Se sienten robóticos ("presione 1, 2") |

**El hueco que ocupa AtentIA:** IA generativa real (RAG, infiere de documentos) + bandeja multi-agente nativa + simplicidad de PyME + pricing transparente. No es "un CRM con IA pegada encima" ni "un bot de reglas": la IA es el corazón, y el humano es la red de seguridad.

---

## 3. Diferenciales (y la crítica honesta a cada uno)

### Diferenciales propuestos
1. **Time-to-value de 15 minutos** — sin flujos visuales complejos; la IA infiere de PDFs o texto libre.
2. **Transición IA→humano fluida** en una bandeja multi-agente nativa en tiempo real.
3. **Pricing predecible y transparente.**

### El abogado del diablo (riesgos que NO hay que subestimar)

- **El miedo a la alucinación es la objeción #1.** Una PyME le teme a que el bot le diga una pelotudez a un cliente real (un precio inventado, un descuento que no existe). El RAG ayuda, pero el cliente no sabe qué es RAG. Hay que *mostrarle control*, no explicarle tecnología. → Solución de producto: **modo borrador / aprobación** (ver killer features).

- **El setup de WhatsApp es el verdadero cuello de botella.** La promesa de "15 minutos" es verdad *solo después* de conectar WhatsApp (Meta Business, número, verificación, tokens). Una PyME no técnica no pasa de la pantalla 2 de Meta sola. → Solución: para los primeros clientes, **onboarding de WhatsApp asistido / hecho por nosotros**; a futuro, Embedded Signup.

- **La transición IA→humano NO es un diferencial percibido.** Callbell ya lo hace; el cliente asume que todos lo hacen. Es *table-stakes*, no ventaja. Hay que darlo por sentado y competir en otro lado.

---

## 4. Killer features (bajo esfuerzo, alto impacto en ventas)

> El criterio: no mejoran el bot, mejoran *la vida del dueño*. Esa es la diferencia entre una feature técnica y una que se vende sola.

### 4.1 Modo borrador / aprobación
Los primeros días, el bot **redacta** la respuesta pero no la envía hasta que el dueño le da OK desde el celular. Ataca directo el miedo a la alucinación. Gancho de onboarding: *"los primeros 3 días el bot te pide permiso, ves que no manda ninguna macana, y recién ahí lo soltás."* Poco código (es una variante del handoff que ya existe).

### 4.2 Reporte semanal automático por WhatsApp
Cada semana, un mensaje al dueño: *"AtentIA respondió 143 consultas, derivó 12, las preguntas más frecuentes fueron X, Y, Z."* Bajo esfuerzo (cron + resumen con la IA que ya tenemos). Le recuerda al dueño *todas las semanas* por qué paga. Ataca el churn, el verdadero enemigo del SaaS PyME.

### 4.3 Detección de "lead caliente"
Cuando el cliente final dice "lo quiero comprar", "cómo pago", "pasame los datos", el sistema notifica al dueño: *"🔥 Tenés un cliente listo para comprar."* Convertir consultas en plata es lo único que una PyME mide. Es la feature que hace que renueven.

---

## 5. Pricing — Plan "Fundador" para los primeros 10 clientes

No arrancar con la tabla Free/Basic/Pro/Enterprise. Para los primeros 10:

**Plan Fundador:** precio fijo bajo y **congelado de por vida** (objetivo: equivalente a ~USD 15-20/mes en pesos — posicionable como *"menos que un cafecito por día"*), a cambio de tres cosas que valen más que la plata:
1. Permiso para usarlos como **caso de éxito**.
2. **Feedback semanal**.
3. Pago de los **12 meses por adelantado** o débito automático (capital + compromiso).

**La clave psicológica:** no se vende "software barato", se vende *acceso temprano con precio de fundador que va a subir cuando lancemos oficialmente*. Urgencia honesta.

**Onboarding asistido:** hacer el setup de WhatsApp a mano, gratis, para esos 10. *"Yo te lo dejo andando, vos solo usalo."* El CAC en tiempo es alto, pero 10 casos de éxito con onboarding asistido valen oro y enseñan dónde automatizar.

### Tabla pública (post-fundadores)

| Plan | Mensajes/mes | Precio | Agentes |
|---|---|---|---|
| Free (prueba 7 días) | 150 | $0 | 1 |
| Basic | 1.000 | $29 USD | 2 |
| Pro | 5.000 | $79 USD | 5 |
| Enterprise | Ilimitado | A convenir | Ilimitado |

> Tools / integraciones externas (Nivel 3) = feature de plan alto, 5-10× el precio base.

---

## 6. Niveles de madurez del producto (visión de expansión)

```
Nivel 1 — INFORMA (actual)
  El bot responde con RAG. No ejecuta acciones.
  Mercado: cualquier PyME con catálogo / FAQ.

Nivel 2 — AGENDA (próximo gran salto)
  Calendario de turnos PROPIO dentro del dashboard.
  La empresa define disponibilidad, el bot agenda directo.
  Sin integraciones externas.
  Mercado: peluquerías, consultorios, talleres, estudios.

Nivel 3 — INTEGRA (visión enterprise)
  Function calling / tools + integración con sistemas externos.
  Mercado: hospitales, concesionarias, municipios.
  Ej. aspiracional: Municipalidad de Cosquín (turnos de carnet,
  automatización de reclamos).
```

**Regla estratégica:** no construir Nivel 3 antes de tener Nivel 2 con clientes reales pagando. La arquitectura de tools es la misma para todos los casos — solo cambia el sistema externo conectado. Conseguir casos de éxito reales (ej. *"15 peluquerías de Córdoba usando AtentIA para turnos"*) antes de tocar puertas institucionales.

---

## 7. Decisiones: tomadas vs. pendientes

### ✅ Ya tomadas (no re-discutir)
- Stack: Next.js + NestJS + PostgreSQL/pgvector + Redis
- Multi-tenancy por `org_id` (RLS como refuerzo futuro)
- RAG con pgvector sobre Pinecone para el MVP
- Clerk para auth
- WhatsApp Cloud API directa (sin BSP)
- OpenAI con capa de abstracción
- Monorepo con Turborepo
- Resumen de conversación con IA on-demand

### ⏳ Pendientes y urgentes
- **Modelo de onboarding de WhatsApp** (manual asistido → Embedded Signup → BSP como fallback). *La más urgente: impacta directo la promesa de valor.*
- **Medio de pago para LatAm** (Stripe no opera local fácil — evaluar Mercado Pago / dLocal).
- **Política de límites** cuando un tenant supera su cuota (¿corta? ¿degrada a modelo barato? ¿cobra extra?).
- **Hosting de producción** (Railway para arrancar).

---

## 8. Estrategias de fricción cero

- Onboarding en pasos, un solo "siguiente" por pantalla, con estado de "completá tu setup" siempre visible.
- Importar conocimiento desde *cualquier cosa*: PDF, foto del catálogo, pegar texto, o URL de la web.
- **Plantillas por rubro** ("soy peluquería", "soy tienda de ropa") que setean tono y reglas de escalada por defecto.
- Modo borrador como red de seguridad para que el primer día no dé miedo.

---

## 9. Mejoras arquitectónicas / de concepto pendientes

- **Guardrails visibles sobre la IA** (el modo borrador es también mejora de concepto, no solo comercial).
- **Control de presupuesto de tokens por tenant** — antes de escalar, para que un cliente abusivo no haga volar los costos.
- **Envío de mensajes del agente duplicado en el controller** — deuda técnica menor, anotada, no urgente (refactor a servicio compartido a futuro).

---

## 10. Lo que falta debatir (preguntas estratégicas abiertas)

1. **Responsabilidad legal de lo que dice el bot.** Si el bot promete mal un precio y el cliente reclama, ¿de quién es la culpa? → Términos de servicio que dejen claro que la PyME es responsable del contenido/conocimiento que carga; AtentIA es la herramienta.

2. **Datos de los clientes finales.** Se guardan conversaciones de personas que aceptaron los términos de la PyME, no los nuestros. En Argentina aplica la Ley 25.326 de protección de datos. → Definir postura de retención, borrado y privacidad *desde ahora*.

3. **El moat a 12 meses.** Hoy cualquiera con el mismo stack puede construir algo parecido. ¿Qué nos hace defendibles? Hipótesis posibles: (a) los datos — mientras más conversaciones de un rubro procesamos, mejores se vuelven los resúmenes y clasificaciones para *ese* rubro; (b) integración profunda con un vertical — ser *el* sistema de turnos de las peluquerías de Córdoba; (c) marca y casos de éxito locales. No hay que resolverlo hoy, pero sí tener una hipótesis y construir hacia ella.

---

## 11. Próximo foco recomendado

```
1. Integraciones WhatsApp (el cuello de botella identificado)
2. Deploy a producción (Vercel + Railway)
3. Conseguir los primeros 10 con el Plan Fundador
4. Sesión de diseño dedicada (landing + rediseño del dashboard)
```

> La estrategia es combustible. El producto en la calle es lo que la valida.

---

## 12. Landing page — estructura para conversión (pre-login)

> Merece su propia sesión de diseño dedicada. Esto es el esqueleto.

1. **Hero** — una sola promesa de resultado (no "chatbot con IA" sino *"Tu WhatsApp respondiendo solo, con la info de tu negocio, en 15 minutos"*). CTA único + loop de video/gif del panel real (bot respondiendo + handoff).
2. **El problema** — hablarle al dolor: mensajes sin responder de noche, perder ventas por demora, contestar lo mismo 50 veces.
3. **Cómo funciona** — 3 pasos visuales (conectá WhatsApp → subí tu info → activá).
4. **Integraciones** — WhatsApp prominente + widget web.
5. **Diferenciales** — modo borrador y detección de leads calientes.
6. **Planes** — con el Fundador destacado y urgencia honesta.
7. **FAQ** — atacar objeciones reales (¿y si se equivoca? ¿necesito saber programar? ¿puedo intervenir yo?).
8. **Testimonios** — cuando estén los 10; antes, "están construyendo con nosotros".
9. **CTA final** — fuerte, al login.

### Nivel de diseño a emular
Referencias: Emil Kowalski, Impeccable Style, Tasteskill.dev. Lo que tienen en común NO es "animaciones", es **restraint y precisión**:
- Una sola familia tipográfica con jerarquía clara.
- Muchísimo espacio en blanco.
- Paleta reducida (verde AtentIA + neutros, nada más).
- Micro-interacciones que *significan algo*: hover con transición de ~150ms, gif del producto que carga suave, números que cuentan hacia arriba al entrar en viewport.
- Transiciones `ease-out`, sombras sutiles y planas, fade discreto por sección al scrollear.
- **Sin** carruseles, degradés ruidosos, ni elementos flotando.
- La sofisticación es lo que sacás, no lo que agregás. Ante la duda entre agregar un efecto o no: no lo agregues.

---

*Documento estratégico vivo — se actualiza con cada decisión de negocio.*