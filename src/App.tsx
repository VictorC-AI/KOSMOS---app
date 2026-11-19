import { lazy, Suspense, useEffect, useState } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import Hoje from './agenda/Hoje.tsx'
import Login from './auth/Login.tsx'
import { MARCA } from './marca.ts'
import { supabase } from './supabase.ts'
import { aplicarTema, lerTema, type PreferenciaTema } from './tema.ts'
import { botaoFantasma } from './ui.ts'

// O calendário é pesado: só baixa quando a aba é aberta.
const Calendario = lazy(() => import('./agenda/Calendario.tsx'))

export default function App() {
  if (!supabase) return <SemConfiguracao />
  return <ComSessao supabase={supabase} />
}

function ComSessao({ supabase }: { supabase: SupabaseClient }) {
  // undefined = ainda verificando; null = sem login
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [supabase])

  if (sessao === undefined) return <p className="p-4 text-muted">{MARCA.nome} · carregando…</p>
  if (!sessao) return <Login supabase={supabase} />

  return (
    <div className="mx-auto min-h-dvh max-w-5xl">
      <header className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="mr-auto font-bold tracking-tight">{MARCA.nome}</span>
        <BotaoTema />
        <button className={botaoFantasma} onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </header>
      <main className="p-4">
        <Inicio supabase={supabase} />
      </main>
    </div>
  )
}

// Lê o fuso do perfil antes de montar as telas: "hoje" depende dele.
function Inicio({ supabase }: { supabase: SupabaseClient }) {
  const [fuso, setFuso] = useState<string | null>(null)
  useEffect(() => {
    supabase
      .from('profiles')
      .select('timezone')
      .single()
      .then(({ data }) => setFuso(data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone))
  }, [supabase])
  const [tela, setTela] = useState<'hoje' | 'calendario'>('hoje')
  if (!fuso) return <p className="text-muted">Carregando…</p>
  const aba = (t: typeof tela, rotulo: string) => (
    <button
      aria-current={tela === t ? 'page' : undefined}
      className={`min-h-11 rounded-lg px-4 text-sm ${tela === t ? 'bg-accent font-semibold text-on-accent' : 'text-muted hover:bg-surface-raised hover:text-text'}`}
      onClick={() => setTela(t)}
    >
      {rotulo}
    </button>
  )
  return (
    <>
      <nav className="mb-4 flex gap-1">
        {aba('hoje', 'Hoje')}
        {aba('calendario', 'Calendário')}
      </nav>
      {tela === 'hoje' ? <Hoje supabase={supabase} fuso={fuso} /> : (
        <Suspense fallback={<p className="text-muted">Carregando calendário…</p>}>
          <Calendario supabase={supabase} fuso={fuso} />
        </Suspense>
      )}
    </>
  )
}

const PROXIMO: Record<PreferenciaTema, PreferenciaTema> = { system: 'dark', dark: 'light', light: 'system' }
const ROTULO: Record<PreferenciaTema, string> = { system: 'Tema: sistema', dark: 'Tema: escuro', light: 'Tema: claro' }

function BotaoTema() {
  const [tema, setTema] = useState(lerTema)
  return (
    <button
      className={botaoFantasma}
      onClick={() => {
        const novo = PROXIMO[tema]
        aplicarTema(novo)
        setTema(novo)
      }}
    >
      {ROTULO[tema]}
    </button>
  )
}

function SemConfiguracao() {
  return (
    <main className="grid min-h-dvh place-content-center gap-2 p-4">
      <h1 className="text-3xl font-bold tracking-tight">{MARCA.nome}</h1>
      <p className="max-w-prose text-muted">
        Falta configurar o Supabase: copie <code className="font-mono">.env.example</code> para{' '}
        <code className="font-mono">.env.local</code>, preencha a URL e a chave publishable e reinicie o{' '}
        <code className="font-mono">npm run dev</code>.
      </p>
    </main>
  )
}
