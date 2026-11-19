// Conversão entre as linhas do banco e os eventos do calendário.
// O calendário roda com timeZone 'UTC' como "relógio de parede": '19:00'
// entra e sai como 19:00, sem o fuso do aparelho no meio.
import { diasEntre, ocorrenciasEntre, prazo, somarDias, type Dia } from './datas.ts'
import type { Compromisso, Entrega, Habito, RegistroHabito } from './tipos.ts'

export type Tipo = 'compromisso' | 'entrega' | 'habito'

export interface ItemCalendario {
  id: string // único por ocorrência
  title: string
  start: string
  end?: string
  allDay: boolean
  editable: boolean
  durationEditable: boolean
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: { tipo: Tipo; id: string; dia: Dia; recorrente: boolean }
}

function cores(tipo: Tipo) {
  const cor = `var(--color-tipo-${tipo})`
  // texto na cor do fundo da página: contraste ≥ 4,7:1 nos dois temas (medido)
  return { backgroundColor: cor, borderColor: cor, textColor: 'var(--color-bg)' }
}

export function itensDoCalendario(
  dados: { compromissos: Compromisso[]; entregas: Entrega[]; habitos: Habito[]; registros: RegistroHabito[] },
  de: Dia,
  ate: Dia,
  hoje: Dia,
): ItemCalendario[] {
  const itens: ItemCalendario[] = []
  for (const c of dados.compromissos) {
    for (const dia of ocorrenciasEntre(c, de, ate)) {
      itens.push({
        id: `compromisso:${c.id}:${dia}`,
        title: c.rrule ? `↻ ${c.title}` : c.title,
        start: `${dia}T${c.start_time}`,
        end: `${dia}T${c.end_time}`,
        allDay: false,
        editable: true,
        durationEditable: true,
        ...cores('compromisso'),
        extendedProps: { tipo: 'compromisso', id: c.id, dia, recorrente: c.rrule !== null },
      })
    }
  }
  for (const e of dados.entregas) {
    if (e.due_date < de || e.due_date > ate) continue
    const sinal = e.done_at ? '✓ ' : prazo(hoje, e.due_date).urgente ? '⚠ ' : ''
    itens.push({
      id: `entrega:${e.id}`,
      title: `${sinal}${e.kind === 'prova' ? 'Prova' : 'Trabalho'}: ${e.title}`,
      start: e.due_date,
      allDay: true,
      editable: true,
      durationEditable: false,
      ...cores('entrega'),
      extendedProps: { tipo: 'entrega', id: e.id, dia: e.due_date, recorrente: false },
    })
  }
  const nomes = new Map(dados.habitos.map((h) => [h.id, h.title]))
  for (const r of dados.registros) {
    const nome = nomes.get(r.habit_id)
    if (!nome || r.day < de || r.day > ate) continue
    itens.push({
      id: `habito:${r.habit_id}:${r.day}`,
      title: `✓ ${nome}`,
      start: r.day,
      allDay: true,
      editable: false,
      durationEditable: false,
      ...cores('habito'),
      extendedProps: { tipo: 'habito', id: r.habit_id, dia: r.day, recorrente: false },
    })
  }
  return itens
}

/** 'AAAA-MM-DDTHH:MM:SS...' de um Date do calendário (modo UTC). */
function partes(d: Date): { dia: Dia; hora: string } {
  const iso = d.toISOString()
  return { dia: iso.slice(0, 10), hora: iso.slice(11, 19) }
}

export type Remarcacao =
  | { tabela: 'assignments'; id: string; mudancas: { due_date: Dia } }
  | { tabela: 'events'; id: string; mudancas: { start_date: Dia; start_time: string; end_time: string } }
  | { erro: string }

/**
 * O que gravar depois de arrastar ou redimensionar.
 * Num compromisso que repete, a série inteira anda os mesmos dias que a ocorrência arrastada.
 */
export function remarcar(
  item: { tipo: Tipo; id: string; dia: Dia; allDay: boolean },
  inicio: Date,
  fim: Date | null,
  serie: Compromisso | undefined,
): Remarcacao {
  const novo = partes(inicio)
  if (item.tipo === 'entrega') return { tabela: 'assignments', id: item.id, mudancas: { due_date: novo.dia } }
  if (item.tipo !== 'compromisso' || !serie) return { erro: 'Este item não pode ser remarcado.' }
  if (item.allDay || !fim) return { erro: 'Compromisso precisa de horário: solte numa faixa de horas.' }
  const final = partes(fim)
  if (final.dia !== novo.dia || final.hora <= novo.hora) return { erro: 'O compromisso precisa começar e terminar no mesmo dia.' }
  return {
    tabela: 'events',
    id: item.id,
    mudancas: {
      start_date: somarDias(serie.start_date, diasEntre(item.dia, novo.dia)),
      start_time: novo.hora,
      end_time: final.hora,
    },
  }
}
