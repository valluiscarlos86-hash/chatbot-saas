/**
 * Las columnas de fecha de la base son `timestamp` SIN huso horario, y Postgres
 * guarda en ellas la hora UTC del servidor con el formato
 * "2026-11-09 19:52:07.198264", sin ninguna marca de zona.
 *
 * El navegador interpreta ese texto como hora LOCAL, de modo que un mensaje
 * enviado a las 16:52 en Argentina se mostraba como las 19:52: tres horas de
 * diferencia contra el reloj del cliente.
 *
 * El arreglo de fondo es migrar las columnas a `timestamptz`, que guarda el
 * instante y no una hora de pared. Mientras tanto, esta función marca el valor
 * como UTC antes de convertirlo, que es lo que efectivamente es.
 */
export function fechaUTC(valor: string | Date | null | undefined): Date {
  if (valor instanceof Date) return valor
  if (!valor) return new Date(NaN)

  const texto = String(valor).trim()

  // Si ya trae huso ("Z" o "+03:00"), se respeta tal cual.
  if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(texto)) return new Date(texto)

  // "2026-11-09 19:52:07.198264" -> "2026-11-09T19:52:07.198Z"
  const iso = texto.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1')
  return new Date(`${iso}Z`)
}
