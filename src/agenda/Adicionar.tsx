// Formulários curtos para cadastrar entregas, compromissos e hábitos.
// O user_id não é enviado: o banco preenche com a conta logada.
import { useState, type FormEvent, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { botaoPrimario, campo } from '../ui.ts'
import type { Dia } from './datas.ts'

interface Props {
  supabase: SupabaseClient
  hoje: Dia
  aoSalvar: () => void
}

function Formulario({ titulo, rotulo, salvar, children }: {
  titulo: string
  rotulo: string
  salvar: (dados: FormData) => Promise<{ error: { message: string } | null }>
  children: ReactNode
}) {
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setEnviando(true)
    const { error } = await salvar(new FormData(form))
    setEnviando(false)
    if (error) return setErro(`Não foi possível salvar: ${error.message}`)
    setErro(null)
    form.reset()
    setAberto(false)
  }

  return (
    <details open={aberto} onToggle={(e) => setAberto(e.currentTarget.open)} className="mt-2">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm text-accent-text">{titulo}</summary>
      <form onSubmit={enviar} className="grid gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2">
        {children}
        {erro && <p role="alert" className="text-sm text-danger sm:col-span-2">{erro}</p>}
        <button className={`${botaoPrimario} sm:col-span-2`} disabled={enviando}>{enviando ? 'Salvando…' : rotulo}</button>
      </form>
    </details>
  )
}

function Campo({ rotulo, children, largo }: { rotulo: string; children: ReactNode; largo?: boolean }) {
  return (
    <label className={`grid gap-1 ${largo ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm text-muted">{rotulo}</span>
      {children}
    </label>
  )
}

const texto = (f: FormData, k: string) => String(f.get(k) ?? '').trim() || null

export function AdicionarEntrega({ supabase, hoje, aoSalvar }: Props) {
  return (
    <Formulario
      titulo="+ Adicionar entrega"
      rotulo="Salvar entrega"
      salvar={async (f) => {
        const r = await supabase.from('assignments').insert({
          kind: f.get('kind'),
          title: texto(f, 'title'),
          course: texto(f, 'course'),
          due_date: f.get('due_date'),
        })
        if (!r.error) aoSalvar()
        return r
      }}
    >
      <Campo rotulo="Título" largo><input name="title" required maxLength={200} className={campo} /></Campo>
      <Campo rotulo="Tipo">
        <select name="kind" className={campo}><option value="trabalho">Trabalho</option><option value="prova">Prova</option></select>
      </Campo>
      <Campo rotulo="Data de entrega"><input name="due_date" type="date" required defaultValue={hoje} className={campo} /></Campo>
      <Campo rotulo="Disciplina (opcional)" largo><input name="course" maxLength={100} className={campo} /></Campo>
    </Formulario>
  )
}

export function AdicionarCompromisso({ supabase, hoje, aoSalvar, fuso }: Props & { fuso: string }) {
  return (
    <Formulario
      titulo="+ Adicionar compromisso"
      rotulo="Salvar compromisso"
      salvar={async (f) => {
        const rrule = texto(f, 'rrule')
        const r = await supabase.from('events').insert({
          title: texto(f, 'title'),
          start_date: f.get('start_date'),
          start_time: f.get('start_time'),
          end_time: f.get('end_time'),
          timezone: fuso,
          rrule,
          repeat_until: rrule ? texto(f, 'repeat_until') : null,
        })
        if (!r.error) aoSalvar()
        return r
      }}
    >
      <Campo rotulo="Título" largo><input name="title" required maxLength={200} className={campo} /></Campo>
      <Campo rotulo="Dia" largo><input name="start_date" type="date" required defaultValue={hoje} className={campo} /></Campo>
      <Campo rotulo="Início"><input name="start_time" type="time" required className={campo} /></Campo>
      <Campo rotulo="Fim"><input name="end_time" type="time" required className={campo} /></Campo>
      <Campo rotulo="Repetir">
        <select name="rrule" className={campo}>
          <option value="">Não repete</option>
          <option value="FREQ=DAILY">Todo dia</option>
          <option value="FREQ=WEEKLY">Toda semana</option>
          <option value="FREQ=MONTHLY">Todo mês</option>
        </select>
      </Campo>
      <Campo rotulo="Até (opcional)"><input name="repeat_until" type="date" className={campo} /></Campo>
    </Formulario>
  )
}

export function AdicionarHabito({ supabase, aoSalvar }: Omit<Props, 'hoje'>) {
  return (
    <Formulario
      titulo="+ Adicionar hábito"
      rotulo="Salvar hábito"
      salvar={async (f) => {
        const minutos = texto(f, 'minutes')
        const r = await supabase.from('habits').insert({
          title: texto(f, 'title'),
          per_week: Number(f.get('per_week')),
          minutes: minutos ? Number(minutos) : null,
        })
        if (!r.error) aoSalvar()
        return r
      }}
    >
      <Campo rotulo="Hábito" largo><input name="title" required maxLength={100} placeholder="Ex.: Academia" className={campo} /></Campo>
      <Campo rotulo="Vezes por semana">
        <input name="per_week" type="number" min={1} max={7} required defaultValue={7} className={campo} />
      </Campo>
      <Campo rotulo="Minutos por vez (opcional)"><input name="minutes" type="number" min={1} max={1440} className={campo} /></Campo>
    </Formulario>
  )
}
