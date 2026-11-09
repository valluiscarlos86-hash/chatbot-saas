-- ═══════════════════════════════════════════════════════════════════
--  Datos de demostración — Luna Shoes
--  Trabajo Final de Grado · Prototipo AtentIA
--
--  Carga cinco conversaciones modeladas en el mes en curso para que
--  el panel muestre el sistema en uso. Es idempotente: se puede
--  ejecutar varias veces sin duplicar (borra las anteriores primero).
--
--  Ejecutar:
--    docker exec -i chatbot_postgres psql -U chatbot -d chatbot_dev < seed-demo.sql
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_org  uuid;
  v_wa   uuid;
  v_c    uuid;
  v_t    timestamp;
BEGIN
  SELECT id INTO v_org FROM organizations ORDER BY created_at LIMIT 1;
  SELECT id INTO v_wa  FROM whatsapp_accounts WHERE org_id = v_org ORDER BY created_at LIMIT 1;

  IF v_org IS NULL THEN RAISE EXCEPTION 'No se encontró ninguna organización.'; END IF;
  IF v_wa  IS NULL THEN RAISE EXCEPTION 'No se encontró ninguna cuenta de WhatsApp vinculada.'; END IF;

  -- Limpieza de una ejecución anterior de este mismo script
  DELETE FROM messages WHERE conversation_id IN (
    SELECT id FROM conversations WHERE org_id = v_org AND metadata->>'seed' = 'demo'
  );
  DELETE FROM conversations WHERE org_id = v_org AND metadata->>'seed' = 'demo';

  -- ── 1 ── Consulta de talle y stock · resuelta por el bot
  v_c := gen_random_uuid();
  v_t := NOW() - interval '8 days';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493514782301', 'Sofía Aguirre', 'bot_active', '{"seed":"demo"}', v_t, v_t + interval '3 minutes');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Hola! Tienen las botas de cuero negras en talle 37?', 0, v_t),
    (v_c, v_org, 'assistant', 'Hola, soy el asistente virtual de Luna Shoes. Sí, tenemos las botas de cuero negras en talle 37 con stock disponible. El precio es de $89.900.', 186, v_t + interval '14 seconds'),
    (v_c, v_org, 'user',      'Y en marrón las tienen?', 0, v_t + interval '1 minute'),
    (v_c, v_org, 'assistant', 'En marrón nos queda solo el talle 39. Si preferís ese color te puedo avisar cuando repongamos el 37.', 142, v_t + interval '1 minute 11 seconds'),
    (v_c, v_org, 'user',      'Dale, avisame. Gracias!', 0, v_t + interval '3 minutes');

  -- ── 2 ── Envíos y formas de pago · respondida desde la base de conocimiento
  v_c := gen_random_uuid();
  v_t := NOW() - interval '6 days';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493516094427', 'Malena Ríos', 'bot_active', '{"seed":"demo"}', v_t, v_t + interval '2 minutes');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Buenas, hacen envíos a Río Cuarto?', 0, v_t),
    (v_c, v_org, 'assistant', 'Hola, buenas tardes. Sí, enviamos a todo el país mediante correo. A Río Cuarto el envío demora entre 2 y 4 días hábiles.', 158, v_t + interval '11 seconds'),
    (v_c, v_org, 'user',      'Qué formas de pago aceptan?', 0, v_t + interval '50 seconds'),
    (v_c, v_org, 'assistant', 'Aceptamos transferencia bancaria, efectivo en el local y tarjeta de crédito en hasta 3 cuotas sin interés.', 134, v_t + interval '1 minute 2 seconds'),
    (v_c, v_org, 'user',      'Perfecto, muchas gracias', 0, v_t + interval '2 minutes');

  -- ── 3 ── Consulta recibida fuera del horario comercial · respondida igual
  v_c := gen_random_uuid();
  v_t := DATE_TRUNC('day', NOW() - interval '4 days') + interval '23 hours 12 minutes';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493513355018', 'Camila Ferreyra', 'bot_active', '{"seed":"demo"}', v_t, v_t + interval '2 minutes');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Hola, están abiertos?', 0, v_t),
    (v_c, v_org, 'assistant', 'Hola. En este momento el local está cerrado; atendemos de lunes a viernes de 9 a 18 hs. De todos modos puedo ayudarte con tu consulta ahora mismo.', 171, v_t + interval '9 seconds'),
    (v_c, v_org, 'user',      'Quería saber el precio de las sandalias de plataforma', 0, v_t + interval '40 seconds'),
    (v_c, v_org, 'assistant', 'Las sandalias de plataforma están $62.400 y hay stock en los talles 36, 37 y 38.', 129, v_t + interval '52 seconds'),
    (v_c, v_org, 'user',      'Buenísimo, mañana paso por el local', 0, v_t + interval '2 minutes');

  -- ── 4 ── Pedido de descuento especial · derivada a un agente humano
  v_c := gen_random_uuid();
  v_t := NOW() - interval '2 days';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, assigned_agent_id, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493512208846', 'Rocío Peralta', 'human_takeover', 'encargada_atencion', '{"seed":"demo","escalado":"excede_atribuciones"}', v_t, v_t + interval '26 minutes');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Hola! Si llevo tres pares me hacen un descuento?', 0, v_t),
    (v_c, v_org, 'assistant', 'Hola. Los descuentos por cantidad los autoriza la gerencia, así que voy a derivar tu consulta a una persona del equipo para que te responda a la brevedad.', 176, v_t + interval '13 seconds'),
    (v_c, v_org, 'system',    'Conversación derivada a atención humana', 0, v_t + interval '14 seconds'),
    (v_c, v_org, 'system',    'Agente tomó el control de la conversación', 0, v_t + interval '19 minutes'),
    (v_c, v_org, 'assistant', 'Hola Rocío, soy Marina del local. Por tres pares te podemos hacer un 15% de descuento sobre el total. ¿Qué modelos te interesaban?', 0, v_t + interval '21 minutes'),
    (v_c, v_org, 'user',      'Genial! Las botas negras y dos pares de sandalias', 0, v_t + interval '26 minutes');

  -- ── 5 ── Solicitud de cambio · resuelta y cerrada
  v_c := gen_random_uuid();
  v_t := NOW() - interval '1 day';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493515517290', 'Julieta Bustos', 'closed', '{"seed":"demo"}', v_t, v_t + interval '5 minutes');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Compré unos zapatos la semana pasada y me quedaron chicos, puedo cambiarlos?', 0, v_t),
    (v_c, v_org, 'assistant', 'Hola. Sí, aceptamos cambios dentro de los 30 días de la compra, siempre que el calzado esté sin uso y con su caja original. Podés acercarte al local con el comprobante.', 192, v_t + interval '16 seconds'),
    (v_c, v_org, 'user',      'Necesito turno o voy directo?', 0, v_t + interval '1 minute'),
    (v_c, v_org, 'assistant', 'No hace falta turno, podés venir en cualquier momento dentro del horario de atención.', 118, v_t + interval '1 minute 9 seconds'),
    (v_c, v_org, 'user',      'Listo, gracias!', 0, v_t + interval '4 minutes'),
    (v_c, v_org, 'system',    'Conversación cerrada', 0, v_t + interval '5 minutes');


  -- 6 - Precio de zapatillas urbanas - resuelta por el bot
  v_c := gen_random_uuid();
  v_t := NOW() - interval '4 days' + interval '3 hours';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493516721904', 'Agustina Vera', 'bot_active', '{"seed":"demo"}', v_t, v_t + interval '2 minutes');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Hola, cuanto cuestan las zapatillas urbanas blancas?', 0, v_t),
    (v_c, v_org, 'assistant', 'Hola. Las zapatillas urbanas blancas estan $71.500 y hay stock en los talles 36 al 40.', 131, v_t + interval '12 seconds'),
    (v_c, v_org, 'user',      'Gracias!', 0, v_t + interval '2 minutes');

  -- 7 - Consulta de talle - resuelta por el bot
  v_c := gen_random_uuid();
  v_t := NOW() - interval '2 days' + interval '5 hours';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493514409173', 'Lucia Moyano', 'bot_active', '{"seed":"demo"}', v_t, v_t + interval '3 minutes');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Buenas! Los borcegos vienen en talle 41?', 0, v_t),
    (v_c, v_org, 'assistant', 'Hola. Los borcegos llegan hasta el talle 40. Si queres te aviso cuando incorporemos numeracion mas amplia.', 147, v_t + interval '15 seconds'),
    (v_c, v_org, 'user',      'Dale, gracias por la data', 0, v_t + interval '3 minutes');

  -- 8 - Envio al interior - resuelta por el bot
  v_c := gen_random_uuid();
  v_t := NOW() - interval '2 days' + interval '8 hours';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493513896520', 'Brenda Salas', 'bot_active', '{"seed":"demo"}', v_t, v_t + interval '2 minutes');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Mandan pedidos a Villa Maria? Cuanto sale el envio?', 0, v_t),
    (v_c, v_org, 'assistant', 'Si, enviamos a Villa Maria. El costo del envio es de $6.800 y la entrega demora entre 2 y 4 dias habiles.', 152, v_t + interval '13 seconds'),
    (v_c, v_org, 'user',      'Perfecto, despues te confirmo', 0, v_t + interval '2 minutes');

  -- 9 - Consulta de horarios - resuelta por el bot (hoy)
  v_c := gen_random_uuid();
  v_t := NOW() - interval '3 hours';
  INSERT INTO conversations (id, org_id, whatsapp_account_id, customer_phone, customer_name, status, metadata, created_at, updated_at)
  VALUES (v_c, v_org, v_wa, '5493512067438', 'Paula Gimenez', 'bot_active', '{"seed":"demo"}', v_t, v_t + interval '1 minute');
  INSERT INTO messages (conversation_id, org_id, role, content, tokens_used, created_at) VALUES
    (v_c, v_org, 'user',      'Que horario tienen hoy?', 0, v_t),
    (v_c, v_org, 'assistant', 'Hola. Hoy atendemos de 9 a 18 hs en Bv. San Juan 1250, Cordoba. Puedo ayudarte con algo mas?', 128, v_t + interval '10 seconds'),
    (v_c, v_org, 'user',      'Genial, paso a la tarde', 0, v_t + interval '1 minute');

  RAISE NOTICE 'Listo: 9 conversaciones de demostración cargadas para la organización %', v_org;
END $$;

-- ── Resumen de control ──────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM conversations)                                   AS conversaciones_totales,
  (SELECT COUNT(*) FROM conversations WHERE status = 'bot_active')       AS activas,
  (SELECT COUNT(*) FROM conversations WHERE status = 'human_takeover')   AS derivadas,
  (SELECT COUNT(*) FROM conversations WHERE status = 'closed')           AS cerradas,
  (SELECT COUNT(*) FROM messages WHERE created_at >= DATE_TRUNC('month', NOW())) AS mensajes_este_mes;
