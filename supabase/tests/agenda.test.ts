// Entregas, compromissos e hábitos: isolamento entre contas (RLS) e regras
// de integridade. Cada teste roda numa transação desfeita no final.

import type pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  SEM_PERMISSAO,
  VIOLA_CHECK,
  codigoDoErro,
  conectar,
  criarUsuario,
  emTransacao,
  entrarComo,
  entrarComoVisitante,
  sairParaAdmin,
} from './banco.ts'

const VIOLA_FK = '23503'

let db: pg.Client

beforeAll(async () => {
  db = conectar()
  await db.connect()
})

afterAll(async () => {
  await db.end()
})

// Cria um registro de cada tabela para o usuário, como ele mesmo (sem
// informar user_id: o padrão auth.uid() preenche). Volta para admin no fim.
async function criarDados(usuario: string): Promise<{ entrega: string; evento: string; habito: string }> {
  await entrarComo(db, usuario)
  const entrega = await db.query<{ id: string }>(
    "insert into public.assignments (kind, title, due_date) values ('prova', 'Cálculo', '2026-12-01') returning id",
  )
  const evento = await db.query<{ id: string }>(
    "insert into public.events (title, start_date, start_time, end_time, rrule) values ('Aula', '2026-11-17', '19:00', '21:00', 'FREQ=WEEKLY') returning id",
  )
  const habito = await db.query<{ id: string }>(
    "insert into public.habits (title, per_week) values ('Academia', 3) returning id",
  )
  await db.query('insert into public.habit_logs (habit_id, day) values ($1, $2)', [habito.rows[0]!.id, '2026-11-18'])
  await sairParaAdmin(db)
  return { entrega: entrega.rows[0]!.id, evento: evento.rows[0]!.id, habito: habito.rows[0]!.id }
}

const TABELAS = ['assignments', 'events', 'habits', 'habit_logs'] as const

describe('isolamento entre usuários (RLS)', () => {
  it('cada usuário vê só as próprias linhas, com user_id preenchido sozinho', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      const b = await criarUsuario(db, 'b@teste.local')
      await criarDados(a)
      await criarDados(b)
      await entrarComo(db, a)
      for (const t of TABELAS) {
        const { rows } = await db.query(`select user_id from public.${t}`)
        expect(rows, t).toEqual([{ user_id: a }])
      }
    })
  })

  it('A não altera nem apaga dados de B', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      const b = await criarUsuario(db, 'b@teste.local')
      const dadosB = await criarDados(b)
      await entrarComo(db, a)
      expect((await db.query("update public.assignments set title = 'x' where id = $1", [dadosB.entrega])).rowCount).toBe(0)
      expect((await db.query("update public.events set title = 'x' where id = $1", [dadosB.evento])).rowCount).toBe(0)
      expect((await db.query("update public.habits set title = 'x' where id = $1", [dadosB.habito])).rowCount).toBe(0)
      for (const t of TABELAS) {
        expect((await db.query(`delete from public.${t}`)).rowCount, t).toBe(0)
      }
      await sairParaAdmin(db)
      for (const t of TABELAS) {
        const { rows } = await db.query(`select count(*)::int as n from public.${t}`)
        expect(rows, t).toEqual([{ n: 1 }])
      }
    })
  })

  it('A não cria linhas em nome de B nem transfere as suas para B', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      const b = await criarUsuario(db, 'b@teste.local')
      const dadosA = await criarDados(a)
      await entrarComo(db, a)
      await db.query('savepoint s')
      expect(
        await codigoDoErro(db.query("insert into public.habits (user_id, title) values ($1, 'x')", [b])),
      ).toBe(SEM_PERMISSAO)
      await db.query('rollback to savepoint s')
      expect(
        await codigoDoErro(db.query('update public.assignments set user_id = $1 where id = $2', [b, dadosA.entrega])),
      ).toBe(SEM_PERMISSAO)
    })
  })

  it('A não marca como feito um hábito de B', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      const b = await criarUsuario(db, 'b@teste.local')
      const dadosB = await criarDados(b)
      await entrarComo(db, a)
      expect(
        await codigoDoErro(db.query("insert into public.habit_logs (habit_id, day) values ($1, '2026-11-19')", [dadosB.habito])),
      ).toBe(VIOLA_FK)
    })
  })

  it('visitante sem login não acessa nenhuma tabela', async () => {
    await emTransacao(db, async () => {
      await criarDados(await criarUsuario(db, 'a@teste.local'))
      await entrarComoVisitante(db)
      for (const t of TABELAS) {
        await db.query('savepoint s')
        expect(await codigoDoErro(db.query(`select * from public.${t}`)), t).toBe(SEM_PERMISSAO)
        await db.query('rollback to savepoint s')
      }
    })
  })
})

describe('regras de integridade', () => {
  async function recusa(sql: string): Promise<string | undefined> {
    await db.query('savepoint s')
    const codigo = await codigoDoErro(db.query(sql))
    await db.query('rollback to savepoint s')
    return codigo
  }

  it('recusa valores inválidos', async () => {
    await emTransacao(db, async () => {
      await entrarComo(db, await criarUsuario(db, 'a@teste.local'))
      expect(await recusa("insert into public.assignments (kind, title, due_date) values ('seminario', 'x', '2026-12-01')")).toBe(VIOLA_CHECK)
      expect(await recusa("insert into public.assignments (kind, title, due_date) values ('prova', '  ', '2026-12-01')")).toBe(VIOLA_CHECK)
      // termina antes de começar
      expect(await recusa("insert into public.events (title, start_date, start_time, end_time) values ('x', '2026-11-18', '10:00', '09:00')")).toBe(VIOLA_CHECK)
      expect(await recusa("insert into public.events (title, start_date, start_time, end_time, rrule) values ('x', '2026-11-18', '09:00', '10:00', 'FREQ=YEARLY')")).toBe(VIOLA_CHECK)
      // "repetir até" sem repetição, ou antes do início
      expect(await recusa("insert into public.events (title, start_date, start_time, end_time, repeat_until) values ('x', '2026-11-18', '09:00', '10:00', '2026-12-01')")).toBe(VIOLA_CHECK)
      expect(await recusa("insert into public.events (title, start_date, start_time, end_time, rrule, repeat_until) values ('x', '2026-11-18', '09:00', '10:00', 'FREQ=DAILY', '2026-11-01')")).toBe(VIOLA_CHECK)
      expect(await recusa("insert into public.events (title, start_date, start_time, end_time, timezone) values ('x', '2026-11-18', '09:00', '10:00', 'Lua/Base')")).toBe(VIOLA_CHECK)
      expect(await recusa("insert into public.habits (title, per_week) values ('x', 8)")).toBe(VIOLA_CHECK)
    })
  })

  it('um hábito só pode ser marcado uma vez por dia', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      const { habito } = await criarDados(a)
      await entrarComo(db, a)
      expect(
        await codigoDoErro(db.query("insert into public.habit_logs (habit_id, day) values ($1, '2026-11-18')", [habito])),
      ).toBe('23505')
    })
  })

  it('a data de entrega não muda com o fuso da sessão', async () => {
    await emTransacao(db, async () => {
      await entrarComo(db, await criarUsuario(db, 'a@teste.local'))
      await db.query("set local timezone = 'Pacific/Kiritimati'")
      await db.query("insert into public.assignments (kind, title, due_date) values ('trabalho', 'x', '2026-12-01')")
      await db.query("set local timezone = 'Pacific/Pago_Pago'")
      const { rows } = await db.query<{ d: string }>("select due_date::text as d from public.assignments")
      expect(rows).toEqual([{ d: '2026-12-01' }])
    })
  })
})
