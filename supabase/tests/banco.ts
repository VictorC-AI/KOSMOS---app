// Ferramentas para os testes de banco.
//
// Cada teste roda dentro de uma transação que é desfeita no final
// (ROLLBACK), então nenhum teste deixa dados para o próximo.

import pg from 'pg'

// Banco local do Supabase (`npx supabase db start`). Dá para apontar para
// outro banco com a variável DATABASE_URL. Nunca aponte para produção.
const URL_PADRAO = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

export function conectar(): pg.Client {
  return new pg.Client({ connectionString: process.env.DATABASE_URL ?? URL_PADRAO })
}

// Roda `fn` numa transação e desfaz tudo no final, mesmo se o teste falhar.
export async function emTransacao(
  cliente: pg.Client,
  fn: () => Promise<void>,
): Promise<void> {
  await cliente.query('begin')
  try {
    await fn()
  } finally {
    await cliente.query('rollback')
  }
}

// Cria uma conta como o Supabase Auth faria (precisa estar como postgres).
export async function criarUsuario(
  cliente: pg.Client,
  email: string,
  metadados: Record<string, unknown> = {},
): Promise<string> {
  const { rows } = await cliente.query<{ id: string }>(
    'insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id',
    [email, JSON.stringify(metadados)],
  )
  const id = rows[0]?.id
  if (!id) throw new Error('Não foi possível criar o usuário de teste')
  return id
}

// A partir daqui, as consultas rodam como esse usuário logado, com o RLS
// valendo. `set local` dura só até o fim da transação.
export async function entrarComo(cliente: pg.Client, usuarioId: string): Promise<void> {
  await cliente.query('set local role authenticated')
  await cliente.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: usuarioId, role: 'authenticated' }),
  ])
}

// Visitante sem login.
export async function entrarComoVisitante(cliente: pg.Client): Promise<void> {
  await cliente.query('set local role anon')
  await cliente.query("select set_config('request.jwt.claims', '', true)")
}

// Volta a ser o administrador do banco, para conferir o estado real.
export async function sairParaAdmin(cliente: pg.Client): Promise<void> {
  await cliente.query('reset role')
}

// Código de erro do Postgres, ou undefined se a consulta não falhar.
export async function codigoDoErro(promessa: Promise<unknown>): Promise<string | undefined> {
  try {
    await promessa
    return undefined
  } catch (erro) {
    return (erro as { code?: string }).code
  }
}

// Códigos usados nos testes (https://www.postgresql.org/docs/current/errcodes-appendix.html)
export const SEM_PERMISSAO = '42501'
export const VIOLA_CHECK = '23514'
