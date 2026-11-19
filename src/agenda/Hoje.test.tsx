import { createClient } from '@supabase/supabase-js'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PainelHoje, type Dados } from './Hoje.tsx'

// Cliente que nunca é chamado: só desenhamos a tela com dados fictícios.
const supabase = createClient('http://localhost', 'chave-de-teste')
const HOJE = '2026-11-18' // quarta

function desenhar(dados: Partial<Dados>): string {
  const completos: Dados = { habitos: [], registros: [], compromissos: [], entregas: [], ...dados }
  return renderToStaticMarkup(
    <PainelHoje supabase={supabase} fuso="America/Sao_Paulo" hoje={HOJE} dados={completos} erro={null} agir={() => {}} aoSalvar={() => {}} />,
  )
}

const evento = { timezone: 'America/Sao_Paulo', repeat_until: null }

describe('tela Hoje', () => {
  it('sem dados, convida a cadastrar em cada seção', () => {
    const html = desenhar({})
    expect(html).toContain('Nenhum hábito ainda')
    expect(html).toContain('Nada marcado para hoje')
    expect(html).toContain('Nenhuma entrega pendente')
  })

  it('marca o hábito feito hoje e mostra o progresso da semana', () => {
    const html = desenhar({
      habitos: [
        { id: 'h1', title: 'Academia', per_week: 3, minutes: null },
        { id: 'h2', title: 'Inglês', per_week: 7, minutes: 30 },
      ],
      registros: [
        { habit_id: 'h1', day: '2026-11-16' },
        { habit_id: 'h1', day: HOJE },
      ],
    })
    expect(html).toContain('2/3 na semana')
    expect(html).toContain('30 min')
    // o diário não mostra contagem semanal
    expect(html).not.toContain('/7')
    expect(html.match(/checked=""/g)).toHaveLength(1)
  })

  it('mostra só os compromissos que acontecem hoje, em ordem de horário', () => {
    const html = desenhar({
      compromissos: [
        { ...evento, id: 'e1', title: 'Aula de terça', start_date: '2026-11-17', start_time: '19:00:00', end_time: '21:00:00', rrule: 'FREQ=WEEKLY' },
        { ...evento, id: 'e2', title: 'Inglês', start_date: '2026-11-11', start_time: '20:00:00', end_time: '21:00:00', rrule: 'FREQ=WEEKLY' },
        { ...evento, id: 'e3', title: 'Dentista', start_date: HOJE, start_time: '09:00:00', end_time: '10:00:00', rrule: null },
      ],
    })
    expect(html).not.toContain('Aula de terça')
    expect(html.indexOf('Dentista')).toBeLessThan(html.indexOf('Inglês'))
    expect(html).toContain('09:00–10:00')
  })

  it('destaca a entrega que vence em até 3 dias, não a de 4', () => {
    const entrega = { kind: 'prova' as const, course: null, done_at: null }
    const html = desenhar({
      entregas: [
        { ...entrega, id: 'a1', title: 'Cálculo', due_date: '2026-11-21' },
        { ...entrega, id: 'a2', title: 'Física', due_date: '2026-11-22' },
      ],
    })
    expect(html).toContain('⚠ em 3 dias')
    expect(html).toContain('em 4 dias')
    expect(html).not.toContain('⚠ em 4 dias')
  })
})
