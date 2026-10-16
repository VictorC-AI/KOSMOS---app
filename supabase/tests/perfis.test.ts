// Testes da tabela profiles: criação no cadastro e isolamento entre contas.
// Item 7 do backlog: o usuário A não lê nem altera dados do usuário B.

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

let db: pg.Client

beforeAll(async () => {
  db = conectar()
  await db.connect()
})

afterAll(async () => {
  await db.end()
})

describe('cadastro', () => {
  it('cria o perfil com o fuso enviado pelo navegador', async () => {
    await emTransacao(db, async () => {
      const id = await criarUsuario(db, 'a@teste.local', { timezone: 'Europe/Lisbon' })
      const { rows } = await db.query('select timezone, theme, currency from public.profiles where id = $1', [id])
      expect(rows).toEqual([{ timezone: 'Europe/Lisbon', theme: 'system', currency: 'BRL' }])
    })
  })

  it('usa o fuso padrão quando o navegador manda um fuso inválido', async () => {
    await emTransacao(db, async () => {
      const id = await criarUsuario(db, 'a@teste.local', { timezone: 'Lua/Base' })
      const { rows } = await db.query('select timezone from public.profiles where id = $1', [id])
      expect(rows).toEqual([{ timezone: 'America/Sao_Paulo' }])
    })
  })
})

describe('isolamento entre usuários (RLS)', () => {
  it('cada usuário vê só o próprio perfil', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      await criarUsuario(db, 'b@teste.local')
      await entrarComo(db, a)
      const { rows } = await db.query('select id from public.profiles')
      expect(rows).toEqual([{ id: a }])
    })
  })

  it('A não consegue alterar o perfil de B', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      const b = await criarUsuario(db, 'b@teste.local')
      await entrarComo(db, a)
      const resultado = await db.query("update public.profiles set theme = 'light' where id = $1", [b])
      expect(resultado.rowCount).toBe(0)

      await sairParaAdmin(db)
      const { rows } = await db.query('select theme from public.profiles where id = $1', [b])
      expect(rows).toEqual([{ theme: 'system' }])
    })
  })

  it('ninguém cria nem apaga perfil direto pela API', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      await entrarComo(db, a)
      await db.query('savepoint s1')
      expect(await codigoDoErro(db.query('insert into public.profiles (id) values (gen_random_uuid())'))).toBe(SEM_PERMISSAO)
      await db.query('rollback to savepoint s1')
      expect(await codigoDoErro(db.query('delete from public.profiles where id = $1', [a]))).toBe(SEM_PERMISSAO)
    })
  })

  it('ninguém troca o id do próprio perfil', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      const b = await criarUsuario(db, 'b@teste.local')
      await entrarComo(db, a)
      expect(await codigoDoErro(db.query('update public.profiles set id = $1 where id = $2', [b, a]))).toBe(SEM_PERMISSAO)
    })
  })

  it('visitante sem login não lê perfis', async () => {
    await emTransacao(db, async () => {
      await criarUsuario(db, 'a@teste.local')
      await entrarComoVisitante(db)
      expect(await codigoDoErro(db.query('select * from public.profiles'))).toBe(SEM_PERMISSAO)
    })
  })
})

describe('preferências', () => {
  it('o usuário altera o próprio tema', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      await entrarComo(db, a)
      const { rows } = await db.query("update public.profiles set theme = 'dark' returning theme")
      expect(rows).toEqual([{ theme: 'dark' }])
    })
  })

  it('recusa fuso horário inválido', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      await entrarComo(db, a)
      expect(await codigoDoErro(db.query("update public.profiles set timezone = 'Lua/Base'"))).toBe(VIOLA_CHECK)
    })
  })

  it('recusa tema e moeda fora do padrão', async () => {
    await emTransacao(db, async () => {
      const a = await criarUsuario(db, 'a@teste.local')
      await entrarComo(db, a)
      await db.query('savepoint s1')
      expect(await codigoDoErro(db.query("update public.profiles set theme = 'roxo'"))).toBe(VIOLA_CHECK)
      await db.query('rollback to savepoint s1')
      expect(await codigoDoErro(db.query("update public.profiles set currency = 'real'"))).toBe(VIOLA_CHECK)
    })
  })
})
