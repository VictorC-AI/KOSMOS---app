// Datas como texto 'AAAA-MM-DD' (o mesmo formato do tipo date do Postgres).
// As contas usam UTC só como calendário: sem horário de verão, um dia
// nunca vira outro. shortcut: sem biblioteca de datas (decisão pendente); rever ao escolher Temporal ou date-fns-tz.

export type Dia = string

const DIA_MS = 86_400_000

function utc(d: Dia): number {
  const [a, m, dd] = d.split('-').map(Number) as [number, number, number]
  return Date.UTC(a, m - 1, dd)
}

function paraDia(ms: number): Dia {
  return new Date(ms).toISOString().slice(0, 10)
}

/** O dia de hoje no fuso IANA informado (ex.: America/Sao_Paulo). */
export function hojeNoFuso(fuso: string, agora: Date = new Date()): Dia {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: fuso }).format(agora)
}

export function somarDias(d: Dia, n: number): Dia {
  return paraDia(utc(d) + n * DIA_MS)
}

/** Quantos dias de `de` até `ate` (negativo se `ate` já passou). */
export function diasEntre(de: Dia, ate: Dia): number {
  return Math.round((utc(ate) - utc(de)) / DIA_MS)
}

/** Segunda-feira da semana do dia. */
export function inicioDaSemana(d: Dia): Dia {
  const diaSemana = new Date(utc(d)).getUTCDay() // 0 = domingo
  return somarDias(d, -((diaSemana + 6) % 7))
}

export type Recorrencia = 'FREQ=DAILY' | 'FREQ=WEEKLY' | 'FREQ=MONTHLY' | null

export interface RegraEvento {
  start_date: Dia
  rrule: Recorrencia
  repeat_until: Dia | null
}

/** O compromisso acontece neste dia? Mensal no dia 31 pula meses sem dia 31, como no iCalendar. */
export function ocorreEm(e: RegraEvento, dia: Dia): boolean {
  if (dia < e.start_date) return false
  if (e.repeat_until && dia > e.repeat_until) return false
  switch (e.rrule) {
    case null:
      return dia === e.start_date
    case 'FREQ=DAILY':
      return true
    case 'FREQ=WEEKLY':
      return diasEntre(e.start_date, dia) % 7 === 0
    case 'FREQ=MONTHLY':
      return dia.slice(8) === e.start_date.slice(8)
  }
}

/** Dias (de `de` até `ate`, inclusive) em que o compromisso acontece. */
export function ocorrenciasEntre(e: RegraEvento, de: Dia, ate: Dia): Dia[] {
  const dias: Dia[] = []
  for (let d = de; d <= ate; d = somarDias(d, 1)) if (ocorreEm(e, d)) dias.push(d)
  return dias
}

/** Texto e urgência do prazo de uma entrega: urgente = vence em até 3 dias ou já venceu. */
export function prazo(hoje: Dia, vencimento: Dia): { texto: string; urgente: boolean } {
  const n = diasEntre(hoje, vencimento)
  const texto =
    n < -1 ? `atrasada ${-n} dias` : n === -1 ? 'atrasada 1 dia' : n === 0 ? 'vence hoje' : n === 1 ? 'vence amanhã' : `em ${n} dias`
  return { texto, urgente: n <= 3 }
}

/** Data e hora de agora no fuso, como 'AAAA-MM-DDTHH:MM:SS' (sem fuso no texto). */
export function agoraNoFuso(fuso: string, agora: Date = new Date()): string {
  // sv-SE formata como 'AAAA-MM-DD HH:MM:SS'
  return new Intl.DateTimeFormat('sv-SE', { timeZone: fuso, dateStyle: 'short', timeStyle: 'medium' }).format(agora).replace(' ', 'T')
}
