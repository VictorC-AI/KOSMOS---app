import { describe, expect, it } from 'vitest'
import { diasEntre, hojeNoFuso, inicioDaSemana, ocorreEm, ocorrenciasEntre, prazo, somarDias } from './datas.ts'

describe('hojeNoFuso', () => {
  it('perto da meia-noite, o dia depende do fuso', () => {
    // 02:30 UTC de 19/11 ainda é 18/11 em São Paulo (UTC-3)
    const agora = new Date('2026-11-19T02:30:00Z')
    expect(hojeNoFuso('America/Sao_Paulo', agora)).toBe('2026-11-18')
    expect(hojeNoFuso('Europe/Lisbon', agora)).toBe('2026-11-19')
  })
})

describe('contas com dias', () => {
  it('atravessa mês, ano e fevereiro bissexto', () => {
    expect(somarDias('2026-11-30', 1)).toBe('2026-12-01')
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29')
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('diasEntre é negativo quando já passou', () => {
    expect(diasEntre('2026-11-18', '2026-11-21')).toBe(3)
    expect(diasEntre('2026-11-18', '2026-11-17')).toBe(-1)
  })

  it('não erra em dia de mudança de horário de verão (antigo, out/2018)', () => {
    expect(diasEntre('2018-11-03', '2018-11-05')).toBe(2)
  })

  it('a semana começa na segunda', () => {
    expect(inicioDaSemana('2026-11-18')).toBe('2026-11-16') // quarta
    expect(inicioDaSemana('2026-11-16')).toBe('2026-11-16') // segunda
    expect(inicioDaSemana('2026-11-22')).toBe('2026-11-16') // domingo
  })
})

describe('recorrência', () => {
  const base = { start_date: '2026-11-17', repeat_until: null } // terça

  it('sem repetição: só no dia', () => {
    const e = { ...base, rrule: null }
    expect(ocorreEm(e, '2026-11-17')).toBe(true)
    expect(ocorreEm(e, '2026-11-24')).toBe(false)
  })

  it('semanal: toda terça, nunca antes do início', () => {
    const e = { ...base, rrule: 'FREQ=WEEKLY' as const }
    expect(ocorrenciasEntre(e, '2026-11-01', '2026-12-08')).toEqual(['2026-11-17', '2026-11-24', '2026-12-01', '2026-12-08'])
  })

  it('diária respeita o "repetir até"', () => {
    const e = { ...base, rrule: 'FREQ=DAILY' as const, repeat_until: '2026-11-19' }
    expect(ocorrenciasEntre(e, '2026-11-15', '2026-11-25')).toEqual(['2026-11-17', '2026-11-18', '2026-11-19'])
  })

  it('mensal no dia 31 pula meses sem dia 31', () => {
    const e = { start_date: '2026-10-31', repeat_until: null, rrule: 'FREQ=MONTHLY' as const }
    expect(ocorrenciasEntre(e, '2026-10-01', '2027-01-31')).toEqual(['2026-10-31', '2026-12-31', '2027-01-31'])
  })
})

describe('prazo', () => {
  it('destaca o que vence em até 3 dias ou já venceu', () => {
    expect(prazo('2026-11-18', '2026-11-18')).toEqual({ texto: 'vence hoje', urgente: true })
    expect(prazo('2026-11-18', '2026-11-19')).toEqual({ texto: 'vence amanhã', urgente: true })
    expect(prazo('2026-11-18', '2026-11-21')).toEqual({ texto: 'em 3 dias', urgente: true })
    expect(prazo('2026-11-18', '2026-11-22')).toEqual({ texto: 'em 4 dias', urgente: false })
    expect(prazo('2026-11-18', '2026-11-16')).toEqual({ texto: 'atrasada 2 dias', urgente: true })
  })
})
