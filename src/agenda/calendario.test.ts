import { describe, expect, it } from 'vitest'
import { itensDoCalendario, remarcar } from './calendario.ts'
import type { Compromisso } from './tipos.ts'

const aula: Compromisso = {
  id: 'e1',
  title: 'Aula',
  start_date: '2026-11-17', // terça
  start_time: '19:00:00',
  end_time: '21:00:00',
  timezone: 'America/Sao_Paulo',
  rrule: 'FREQ=WEEKLY',
  repeat_until: null,
}

describe('itensDoCalendario', () => {
  it('expande repetições no intervalo, com horário de parede e cor por tipo', () => {
    const itens = itensDoCalendario(
      {
        compromissos: [aula],
        entregas: [{ id: 'a1', kind: 'prova', title: 'Cálculo', course: null, due_date: '2026-11-20', done_at: null }],
        habitos: [{ id: 'h1', title: 'Academia', per_week: 3, minutes: null }],
        registros: [{ habit_id: 'h1', day: '2026-11-18' }],
      },
      '2026-11-16',
      '2026-11-29',
      '2026-11-18',
    )
    const aulas = itens.filter((i) => i.extendedProps.tipo === 'compromisso')
    expect(aulas.map((i) => i.start)).toEqual(['2026-11-17T19:00:00', '2026-11-24T19:00:00'])
    expect(new Set(itens.map((i) => i.id)).size).toBe(itens.length)
    expect(itens.find((i) => i.extendedProps.tipo === 'entrega')).toMatchObject({
      title: '⚠ Prova: Cálculo',
      start: '2026-11-20',
      allDay: true,
      backgroundColor: 'var(--color-tipo-entrega)',
    })
    expect(itens.find((i) => i.extendedProps.tipo === 'habito')).toMatchObject({ title: '✓ Academia', editable: false })
  })
})

describe('remarcar', () => {
  const utc = (s: string) => new Date(`${s}Z`)

  it('entrega: muda só a data', () => {
    expect(remarcar({ tipo: 'entrega', id: 'a1', dia: '2026-11-20', allDay: true }, utc('2026-11-23T00:00:00'), null, undefined)).toEqual({
      tabela: 'assignments',
      id: 'a1',
      mudancas: { due_date: '2026-11-23' },
    })
  })

  it('série semanal: arrastar a ocorrência de 24/11 para quarta 25/11 às 18h move a série um dia', () => {
    const r = remarcar(
      { tipo: 'compromisso', id: 'e1', dia: '2026-11-24', allDay: false },
      utc('2026-11-25T18:00:00'),
      utc('2026-11-25T20:30:00'),
      aula,
    )
    expect(r).toEqual({ tabela: 'events', id: 'e1', mudancas: { start_date: '2026-11-18', start_time: '18:00:00', end_time: '20:30:00' } })
  })

  it('recusa compromisso que atravessa a meia-noite ou fica sem horário', () => {
    const item = { tipo: 'compromisso' as const, id: 'e1', dia: '2026-11-17', allDay: false }
    expect(remarcar(item, utc('2026-11-17T23:00:00'), utc('2026-11-18T00:30:00'), aula)).toHaveProperty('erro')
    expect(remarcar({ ...item, allDay: true }, utc('2026-11-17T00:00:00'), null, aula)).toHaveProperty('erro')
  })
})
