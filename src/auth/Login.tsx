import { useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MARCA } from '../marca.ts'
import { botaoPrimario, campo } from '../ui.ts'

export default function Login({ supabase }: { supabase: SupabaseClient }) {
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    setAviso(null)
    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setErro(traduzir(error.message))
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        // o gatilho do banco cria o perfil com este fuso
        options: { data: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } },
      })
      if (error) setErro(traduzir(error.message))
      else if (!data.session) setAviso('Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.')
    }
    setEnviando(false)
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <form onSubmit={enviar} className="grid w-full max-w-sm gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{MARCA.nome}</h1>
          <p className="text-muted">{MARCA.slogan}</p>
        </div>
        <label className="grid gap-1">
          <span className="text-sm">E-mail</span>
          <input className={campo} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Senha</span>
          <input
            className={campo}
            type="password"
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            minLength={modo === 'criar' ? 8 : undefined}
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        {aviso && <p role="status" className="text-sm text-success">{aviso}</p>}
        <button className={botaoPrimario} disabled={enviando}>
          {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
        <button
          type="button"
          className="min-h-11 text-sm text-accent-text underline-offset-4 hover:underline"
          onClick={() => setModo(modo === 'entrar' ? 'criar' : 'entrar')}
        >
          {modo === 'entrar' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </form>
    </main>
  )
}

function traduzir(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.'
  if (/already registered/i.test(msg)) return 'Este e-mail já tem conta. Use "Já tenho conta".'
  if (/password/i.test(msg)) return 'Senha fraca: use pelo menos 8 caracteres.'
  return `Não foi possível concluir: ${msg}`
}
