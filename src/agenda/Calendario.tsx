import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EventApi, EventDropArg, EventInput } from '@fullcalendar/core'
import ptBr from '@fullcalendar/core/locales/pt-br'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { itensDoCalendario, remarcar, type ItemCalendario } from './calendario.ts'
import { agoraNoFuso, hojeNoFuso, somarDias } from './datas.ts'
import type { Compromisso } from './tipos.ts'

export default function Calendario({ supabase, fuso }: { supabase: SupabaseClient; fuso: string }) {
  const [erro, setErro] = useState<string | null>(null)
  // séries carregadas, para saber a data de início ao arrastar uma ocorrência
  const series = useRef(new Map<string, Compromisso>())
  const calendario = useRef<FullCalendar>(null)

  async function buscar(de: string, ate: string): Promise<EventInput[]> {
    const [c, e, h, r] = await Promise.all([
      // shortcut: traz todos os compromissos e expande aqui; filtrar no banco quando forem centenas.
      supabase.from('events').select('id, title, start_date, start_time, end_time, timezone, rrule, repeat_until').lte('start_date', ate),
      supabase.from('assignments').select('id, kind, title, course, due_date, done_at').gte('due_date', de).lte('due_date', ate),
      supabase.from('habits').select('id, title, per_week, minutes'),
      supabase.from('habit_logs').select('habit_id, day').gte('day', de).lte('day', ate),
    ])
    const falha = c.error ?? e.error ?? h.error ?? r.error
    if (falha) throw new Error(falha.message)
    const compromissos = c.data ?? []
    series.current = new Map(compromissos.map((x) => [x.id, x]))
    return itensDoCalendario(
      { compromissos, entregas: e.data ?? [], habitos: h.data ?? [], registros: r.data ?? [] },
      de,
      ate,
      hojeNoFuso(fuso),
    )
  }

  async function aoMover(info: EventDropArg | EventResizeDoneArg) {
    const ev: EventApi = info.event
    const props = ev.extendedProps as ItemCalendario['extendedProps']
    if (!ev.start) return info.revert()
    if (props.recorrente && !window.confirm('Este compromisso se repete. Mover todas as repetições?')) return info.revert()
    const r = remarcar({ ...props, allDay: ev.allDay }, ev.start, ev.end, series.current.get(props.id))
    if ('erro' in r) {
      setErro(r.erro)
      return info.revert()
    }
    const { error } = await supabase.from(r.tabela).update(r.mudancas).eq('id', r.id)
    if (error) {
      setErro(`Não foi possível remarcar: ${error.message}`)
      return info.revert()
    }
    setErro(null)
    // redesenha a partir do banco (repetições mudam junto)
    calendario.current?.getApi().refetchEvents()
  }

  async function aoClicar(ev: EventApi) {
    const props = ev.extendedProps as ItemCalendario['extendedProps']
    if (props.tipo !== 'compromisso') return
    const pergunta = props.recorrente ? `Excluir "${ev.title}" e todas as repetições?` : `Excluir "${ev.title}"?`
    if (!window.confirm(pergunta)) return
    const { error } = await supabase.from('events').delete().eq('id', props.id)
    if (error) return setErro(`Não foi possível excluir: ${error.message}`)
    calendario.current?.getApi().refetchEvents()
  }

  const celular = window.matchMedia('(max-width: 639px)').matches

  return (
    <div className="grid gap-2">
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
      <p className="text-xs text-muted">
        Arraste para remarcar (no celular, segure antes de arrastar). Toque num compromisso para excluir.
      </p>
      <FullCalendar
        ref={calendario}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        locale={ptBr}
        timeZone="UTC"
        now={() => agoraNoFuso(fuso)}
        initialView={celular ? 'timeGridDay' : 'timeGridWeek'}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        height="auto"
        nowIndicator
        scrollTime="07:00:00"
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        events={(info, ok, falhou) => {
          buscar(info.startStr.slice(0, 10), somarDias(info.endStr.slice(0, 10), -1)).then(
            (itens) => {
              setErro(null)
              ok(itens)
            },
            (e: Error) => {
              setErro(`Não foi possível carregar: ${e.message}. Confira a conexão e recarregue a página.`)
              falhou(e)
            },
          )
        }}
        eventDrop={aoMover}
        eventResize={aoMover}
        eventClick={(info) => aoClicar(info.event)}
      />
    </div>
  )
}
