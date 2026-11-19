// Formato das linhas como chegam do Supabase (ver a migração da 0.1).
import type { Dia, Recorrencia } from './datas.ts'

export interface Entrega {
  id: string
  kind: 'trabalho' | 'prova'
  title: string
  course: string | null
  due_date: Dia
  done_at: string | null
}

export interface Compromisso {
  id: string
  title: string
  start_date: Dia
  start_time: string // 'HH:MM:SS'
  end_time: string
  timezone: string
  rrule: Recorrencia
  repeat_until: Dia | null
}

export interface Habito {
  id: string
  title: string
  per_week: number
  minutes: number | null
}

export interface RegistroHabito {
  habit_id: string
  day: Dia
}
