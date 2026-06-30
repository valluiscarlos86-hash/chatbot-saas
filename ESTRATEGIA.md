# 📈 AtentIA — Estrategia, Producto y Go-to-Market

> Documento estratégico vivo. Complementa al `README.md` (técnico), `PRODUCT.md` (producto) y `ESTADO.md` (estado real del código).
> Última actualización: Junio 2026.

---

## 1. Visión en una frase

Que cualquier PyME de LatAm pueda tener su WhatsApp respondiendo solo, con la información real de su negocio — incluyendo precio y stock en vivo de su tienda online — en 15 minutos, y pueda intervenir un humano cuando quiera.

> Actualización v2: la visión sumó "precio y stock en vivo". Ya no es solo un bot que lee documentos; se conecta a la tienda del comercio.

---

## 2. El mercado y dónde estamos parados

| Competidor | Qué hacen bien | Su debilidad (nuestra oportunidad) |
|---|---|---|
| **Globales** (Botpress, Intercom) | Potentes, completos | Complejos o caros para una PyME |
| **CRMs LatAm** (Callbell, Sirena) | Gestión humana multi-agente | Su IA suele ser básica o por reglas |
| **Legacy bots** (Cliengo) | Fáciles de empezar | Se sienten robóticos |

**El hueco que ocupa AtentIA:** IA generativa real (RAG) + **integración en vivo con la tienda (Tiendanube)** + bandeja multi-agente + simplicidad de PyME. La integración con e-commerce es un diferencial nuevo y concreto: para un comercio con Tiendanube, AtentIA responde mejor que cualquier bot que solo lea un PDF.

---

## 3. Diferenciales (y la crítica honesta)

### Diferenciales
1. **Time-to-value de 15 minutos** — la IA infiere de PDFs, texto o web.
2. **Precio y stock en vivo desde Tiendanube** — diferencial nuevo, real y demostrable.
3. **Transición IA→humano fluida** en bandeja multi-agente.
4. **Pricing predecible** (cuando exista el billing).

### El abogado del diablo (riesgos que NO subestimar)

- **El miedo a la alucinación es la objeción #1.** Una PyME teme que el bot invente un precio. → La **regla de precedencia Tiendanube>RAG** que construimos ataca esto directamente para productos: el bot no inventa precios, los lee en vivo. Para el resto, sigue pendiente el **modo borrador/aprobación**.
- **El setup de WhatsApp es el verdadero cuello de botella.** La promesa de "15 minutos" es real solo después de conectar WhatsApp (Meta, número, tokens). Una PyME no técnica no lo hace sola. → Onboarding asistido para los primeros clientes; Embedded Signup a futuro.
- **La transición IA→humano NO es diferencial percibido.** Callbell ya lo hace. Es table-stakes.
- **(NUEVO) El billing no existe todavía.** No se puede cobrar ni limitar uso. Es la barrera #1 para tener negocio real, no solo producto. Ver sección 9.

---

## 4. Killer features (bajo esfuerzo, alto impacto en ventas)

> El criterio: no mejoran el bot, mejoran *la vida del dueño*.

### 4.1 Modo borrador / aprobación ◻️ pendiente
El bot redacta pero no envía hasta que el dueño da OK desde el celular. Ataca el miedo a la alucinación. Poco código (variante del handoff que ya existe).

### 4.2 Reporte semanal automático por WhatsApp ◻️ pendiente
Mensaje semanal al dueño con resumen. Bajo esfuerzo (cron + IA). Ataca el churn.

### 4.3 Detección de "lead caliente" ◻️ pendiente
Cuando el cliente dice "lo quiero comprar", notificar al dueño. Convierte consultas en plata.

> Las tres siguen pendientes. La 4.3 conecta directo con la visión de venta conversacional (Nivel siguiente).

---

## 5. Pricing — Plan "Fundador" para los primeros 10

> Sigue vigente. Recordatorio: **el billing no está implementado**, así que el cobro de los primeros clientes será manual al inicio.

**Plan Fundador:** precio fijo bajo y congelado de por vida (~USD 15-20/mes en pesos, "menos que un cafecito por día"), a cambio de: caso de éxito, feedback semanal, y pago anticipado o débito.

**Onboarding asistido:** hacer el setup de WhatsApp a mano, gratis, para esos 10.

### Tabla pública (post-fundadores)

| Plan | Mensajes/mes | Precio | Agentes |
|---|---|---|---|
| Free (prueba 7 días) | 150 | $0 | 1 |
| Basic | 1.000 | $29 USD | 2 |
| Pro | 5.000 | $79 USD | 5 |
| Enterprise | Ilimitado | A convenir | Ilimitado |

> Integraciones en vivo (Tiendanube y futuras) = candidatas a feature de plan alto.

---

## 6. Niveles de madurez del producto — ACTUALIZADO

> ⚠️ Cambio importante respecto a la v1: ya tocamos el Nivel 3.

```
Nivel 1 — INFORMA ✅ (hecho)
  El bot responde con RAG desde documentos y webs.
  Mercado: cualquier PyME con catálogo / FAQ.

Nivel 2 — AGENDA ◻️ (NO construido — saltado por ahora)
  Calendario de turnos propio dentro del dashboard.
  Mercado: peluquerías, consultorios, talleres.
  → Sigue siendo un mercado amplio y atractivo. Pendiente.

Nivel 3 — INTEGRA ✅ (hecho parcialmente, vía Tiendanube)
  Function calling + integración con sistema externo en vivo.
  Construimos la primera integración: Tiendanube (precio/stock real).
  La arquitectura de tools quedó validada y es reutilizable
  para otras integraciones (otros e-commerce, sistemas, etc.).
```

### La decisión que tomamos (blanqueada)

La regla original decía *"no construir Nivel 3 antes de tener Nivel 2 con clientes pagando"*. **No la seguimos:** construimos Nivel 3 (Tiendanube) antes que Nivel 2 (agenda) y antes de tener clientes.

**¿Fue un error?** No necesariamente. Lo que ganamos:
- Validamos que la arquitectura de function calling/tools funciona end-to-end.
- Tenemos un diferencial concreto y demostrable para comercios con Tiendanube.
- El "cómo se integra un sistema externo" ya está resuelto; sumar otro es cambiar el conector.

**Lo que quedó pendiente como consecuencia:**
- El Nivel 2 (agenda de turnos) — mercado amplio (peluquerías/consultorios) — sigue sin tocarse.
- No hay clientes pagando todavía, así que el Nivel 3 aún no está validado *comercialmente* (sí técnicamente).

**Recalibración estratégica:** ahora hay dos caminos de expansión válidos abiertos:
- **(a)** Profundizar Nivel 3 → venta conversacional (cerrar la venta en WhatsApp, no solo informar precio). Aprovecha lo ya construido.
- **(b)** Volver al Nivel 2 → agenda de turnos, para atacar el mercado de servicios (peluquerías, etc.).

No hay que decidir hoy, pero sí tener la disyuntiva consciente.

---

## 7. Decisiones: tomadas vs. pendientes

### ✅ Ya tomadas
- Stack: Next.js + NestJS + PostgreSQL/pgvector
- Multi-tenancy por `org_id` (RLS como refuerzo futuro — sigue pendiente)
- RAG con pgvector sobre Pinecone (MVP)
- Clerk para auth
- WhatsApp Cloud API directa (sin BSP)
- OpenAI directo (sin LangChain)
- **(NUEVO) Tiendanube como primera integración externa**
- **(NUEVO) Precedencia Tiendanube > RAG para precio/stock**

### ⏳ Pendientes y urgentes
- **Billing / medio de pago LatAm** (Mercado Pago / dLocal). *La más urgente para tener negocio.*
- **Enforcement de límites + conteo de mensajes** (hoy el contador está muerto).
- **Modelo de onboarding de WhatsApp** (manual → Embedded Signup → BSP).
- **Hosting de producción** (Railway).

---

## 8. Estrategias de fricción cero

- Onboarding en pasos, un "siguiente" por pantalla, estado de setup visible.
- Importar conocimiento desde cualquier cosa: PDF, texto, URL — o **conectar Tiendanube en un click** (nuevo, el de menor fricción).
- **Plantillas por rubro** ("soy tienda de ropa", "soy peluquería").
- Modo borrador como red de seguridad inicial.

---

## 9. Deuda de escalabilidad consciente — NUEVA SECCIÓN

> Antes de crecer (no antes de vender los primeros 10). Hoy la arquitectura es síncrona y sin red de contención. Aguanta el volumen de ~10 PyMEs sin problema, pero no más.

Por orden de urgencia cuando haya tracción:

1. **Cola de mensajes (Redis + BullMQ).** Hoy el webhook de WhatsApp procesa TODO síncrono (RAG + OpenAI + tools) en el mismo request. Con concurrencia, se cae. Es lo primero a resolver para escalar.
2. **Enforcement de límites + conteo real.** El `monthlyMessageCount` existe pero no se incrementa; nadie frena a un cliente que se pasa de su cuota. Sin esto, el costo de OpenAI no tiene techo y los planes no significan nada.
3. **Billing real.** Sin cobro automatizado no hay SaaS sostenible.
4. **RLS o guard centralizado de `org_id`.** El aislamiento entre clientes es por convención (cada query filtra a mano). Un olvido = fuga de datos entre tenants.
5. **Deploy a producción** (Railway + Vercel + CI/CD).

> Detalle técnico completo en `ESTADO.md`, secciones 4 y 7.

---

## 10. Lo que falta debatir (preguntas estratégicas abiertas)

1. **Responsabilidad legal de lo que dice el bot.** Si promete mal un precio, ¿de quién es la culpa? La precedencia Tiendanube>RAG reduce el riesgo en productos, pero no lo elimina. → Términos de servicio claros: la PyME es responsable del contenido.
2. **Datos de los clientes finales.** Ley 25.326 (Argentina). Definir retención, borrado, privacidad. Más urgente ahora que guardamos también `tiendanube_accounts` con tokens.
3. **El moat a 12 meses.** Hipótesis: (a) datos por rubro, (b) integración profunda con un vertical, (c) marca y casos locales. La integración Tiendanube empuja hacia (b): ser *el* bot de los comercios Tiendanube de la región.

---

## 11. Próximo foco recomendado

```
1. Deploy a producción (Vercel + Railway) — sin esto no hay clientes reales
2. Conseguir los primeros 10 con el Plan Fundador (cobro manual al inicio)
3. Decidir el camino de expansión: venta conversacional (Nivel 3+) vs agenda (Nivel 2)
4. Billing + enforcement de límites (antes de que el volumen lo exija)
5. Sesión de diseño dedicada (landing + Analítica funcional)
```

> La estrategia es combustible. El producto en la calle es lo que la valida.

---

## 12. Landing page — estructura para conversión

> Merece su propia sesión de diseño. Esqueleto:

1. **Hero** — una promesa de resultado: *"Tu WhatsApp respondiendo solo, con la info y el stock real de tu negocio, en 15 minutos."* CTA único + video del panel real.
2. **El problema** — mensajes sin responder, perder ventas por demora, contestar lo mismo 50 veces.
3. **Cómo funciona** — 3 pasos (conectá WhatsApp → cargá tu info o conectá Tiendanube → activá).
4. **Integraciones** — WhatsApp + **Tiendanube** (nuevo, destacado) + widget web.
5. **Diferenciales** — stock en vivo, modo borrador, detección de leads.
6. **Planes** — Fundador destacado, urgencia honesta.
7. **FAQ** — objeciones reales (¿y si se equivoca? ¿necesito programar? ¿puedo intervenir?).
8. **Testimonios** — cuando estén los 10.
9. **CTA final** — al login.

### Nivel de diseño a emular
Referencias: Emil Kowalski, Impeccable Style, Tasteskill.dev. Lo común NO es "animaciones", es **restraint y precisión**: una familia tipográfica, mucho espacio en blanco, paleta reducida (verde AtentIA + neutros), micro-interacciones con sentido (~150ms), transiciones `ease-out`, sin carruseles ni degradés ruidosos. La sofisticación es lo que sacás, no lo que agregás.

---

*Documento estratégico vivo. Para el estado real del código, ver [`ESTADO.md`](./ESTADO.md). Última actualización: Junio 2026.*
