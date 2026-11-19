import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { botaoFantasma } from '../ui.ts'
import { AdicionarCompromisso, AdicionarEntrega, AdicionarHabito } from './Adicionar.tsx'
import { hojeNoFuso, inicioDaSemana, ocorreEm, prazo } from './datas.ts'
import type { Compromisso, Entrega, Habito, RegistroHabito } from './tipos.ts'

export interface Dados {
  habitos: Habito[]
  registros: RegistroHabito[]
  compromissos: Compromisso[]
  entregas: Entrega[]
}

export default function Hoje({ supabase, fuso }: { supabase: SupabaseClient; fuso: string }) {
  const hoje = hojeNoFuso(fuso)
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const [h, r, c, e] = await Promise.all([
      supabase.from('habits').select('id, title, per_week, minutes').eq('archived', false).order('created_at'),
      supabase.from('habit_logs').select('habit_id, day').gte('day', inicioDaSemana(hoje)),
      // shortcut: traz todos os compromissos e filtra aqui; filtrar no banco quando forem centenas.
      supabase.from('events').select('id, title, start_date, start_time, end_time, timezone, rrule, repeat_until').lte('start_date', hoje),
      supabase.from('assignments').select('id, kind, title, course, due_date, done_at').is('done_at', null).order('due_date').limit(20),
    ])
    const falha = h.error ?? r.error ?? c.error ?? e.error
    if (falha) return setErro(`Não foi possível carregar: ${falha.message}. Confira a conexão e recarregue a página.`)
    setErro(null)
    setDados({ habitos: h.data ?? [], registros: r.data ?? [], compromissos: c.data ?? [], entregas: e.data ?? [] })
  }, [supabase, hoje])

  useEffect(() => {
    // buscar do banco é sincronizar com um sistema externo: uso legítimo de efeito
    // oxlint-disable-next-line react/set-state-in-effect
    carregar()
  }, [carregar])

  // Erros de ação aparecem no topo; depois recarrega para refletir o banco.
  async function agir(acao: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await acao
    if (error) setErro(`Não foi possível salvar: ${error.message}`)
    await carregar()
  }

  if (erro && !dados) return <p role="alert" className="text-danger">{erro}</p>
  if (!dados) return <p className="text-muted">Carregando…</p>
  return <PainelHoje supabase={supabase} fuso={fuso} hoje={hoje} dados={dados} erro={erro} agir={agir} aoSalvar={carregar} />
}

interface PropsPainel {
  supabase: SupabaseClient
  fuso: string
  hoje: string
  dados: Dados
  erro: string | null
  agir: (acao: PromiseLike<{ error: { message: string } | null }>) => void
  aoSalvar: () => void
}

/** Só desenha: recebe os dados prontos (assim dá para testar sem banco). */
export function PainelHoje({ supabase, fuso, hoje, dados, erro, agir, aoSalvar }: PropsPainel) {
  const doDia = dados.compromissos
    .filter((c) => ocorreEm(c, hoje))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
  const props = { supabase, hoje, aoSalvar }

  return (
    <div className="grid gap-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Hoje <span className="font-mono text-base font-normal text-muted">{formatarDia(hoje)}</span>
      </h1>
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}

      <Secao titulo="Hábitos">
        {dados.habitos.length === 0 && <Vazio>Nenhum hábito ainda. Que tal "Academia, 3 vezes por semana"?</Vazio>}
        <ul className="grid gap-1">
          {dados.habitos.map((h) => {
            const feitoHoje = dados.registros.some((r) => r.habit_id === h.id && r.day === hoje)
            const naSemana = dados.registros.filter((r) => r.habit_id === h.id).length
            return (
              <li key={h.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface-raised">
                  <input
                    type="checkbox"
                    className="size-5 accent-accent"
                    checked={feitoHoje}
                    onChange={() =>
                      agir(
                        feitoHoje
                          ? supabase.from('habit_logs').delete().eq('habit_id', h.id).eq('day', hoje)
                          : supabase.from('habit_logs').insert({ habit_id: h.id, day: hoje }),
                      )
                    }
                  />
                  <span className={feitoHoje ? 'text-muted line-through' : ''}>
                    {h.title}
                    {h.minutes && <span className="text-muted"> · {h.minutes} min</span>}
                  </span>
                  {h.per_week < 7 && (
                    <span className={`ml-auto font-mono text-sm ${naSemana >= h.per_week ? 'text-success' : 'text-muted'}`}>
                      {naSemana}/{h.per_week} na semana{naSemana >= h.per_week && ' ✓'}
                    </span>
                  )}
                </label>
              </li>
            )
          })}
        </ul>
        <AdicionarHabito {...props} />
      </Secao>

      <Secao titulo="Compromissos de hoje">
        {doDia.length === 0 && <Vazio>Nada marcado para hoje.</Vazio>}
        <ul className="grid gap-2">
          {doDia.map((c) => (
            <li key={c.id} className="flex items-baseline gap-3 rounded-lg border-l-4 border-tipo-compromisso bg-surface px-3 py-2">
              <span className="font-mono text-sm text-muted">{c.start_time.slice(0, 5)}–{c.end_time.slice(0, 5)}</span>
              <span>{c.title}</span>
              {c.rrule && <span className="ml-auto text-xs text-muted">repete</span>}
            </li>
          ))}
        </ul>
        <AdicionarCompromisso {...props} fuso={fuso} />
      </Secao>

      <Secao titulo="Próximas entregas">
        {dados.entregas.length === 0 && <Vazio>Nenhuma entrega pendente.</Vazio>}
        <ul className="grid gap-2">
          {dados.entregas.map((e) => {
            const p = prazo(hoje, e.due_date)
            return (
              <li
                key={e.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border-l-4 bg-surface px-3 py-2 ${p.urgente ? 'border-warning' : 'border-tipo-entrega'}`}
              >
                <span className="font-mono text-sm text-muted">{formatarDia(e.due_date)}</span>
                <span>
                  <span className="text-xs uppercase text-muted">{e.kind} · </span>
                  {e.title}
                  {e.course && <span className="text-muted"> · {e.course}</span>}
                </span>
                <span className={`text-sm ${p.urgente ? 'font-semibold text-warning' : 'text-muted'}`}>
                  {p.urgente && '⚠ '}{p.texto}
                </span>
                <button
                  className={`${botaoFantasma} ml-auto`}
                  onClick={() => agir(supabase.from('assignments').update({ done_at: new Date().toISOString() }).eq('id', e.id))}
                >
                  Marcar como entregue
                </button>
              </li>
            )
          })}
        </ul>
        <AdicionarEntrega {...props} />
      </Secao>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{titulo}</h2>
      {children}
    </section>
  )
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-muted">{children}</p>
}

// '2026-11-18' -> 'qua, 18/11' (meio-dia UTC para o fuso do aparelho não mudar o dia)
function formatarDia(d: string): string {
  return new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}
