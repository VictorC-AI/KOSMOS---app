# KOSMOS

Seu universo, em ordem. Plataforma de organização pessoal que conecta agenda, tarefas, vida acadêmica e finanças.

Estado atual: **Fase 1, fundação**. Ainda não há funcionalidades; esta base tem o app React, os testes e a verificação automática.

## Rodar

Precisa de Node 22.12 ou mais novo (a versão usada no CI está em `.nvmrc`).

```bash
npm install
npm run dev      # abre em http://localhost:5173
```

## Verificar

```bash
npm run lint       # procura erros comuns no código (oxlint)
npm run typecheck  # confere os tipos do TypeScript
npm test           # roda os testes uma vez (Vitest)
npm run build      # gera a versão de produção em dist/
npm run check      # roda os quatro acima em sequência
```

O GitHub Actions roda os mesmos passos a cada push na `main` e em cada pull request (`.github/workflows/ci.yml`).

## Banco de dados (Supabase local)

Precisa do [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto.

```bash
npm run db:start   # sobe o Postgres do Supabase e aplica supabase/migrations
npm run test:db    # testes de banco: cadastro, RLS e validações
npm run db:reset   # apaga o banco local e recria só a partir das migrações
npm run db:stop    # desliga
```

Mudança no banco é sempre uma migração nova: `npx supabase migration new nome_curto`. Nunca altere tabelas à mão.

Sem Docker, dá para rodar os testes num Postgres comum: aplique `supabase/tests/supabase-shim.sql`, depois as migrações, e rode `npm run test:db` com `DATABASE_URL` apontando para esse banco. Nunca aponte `DATABASE_URL` para o banco de produção.

## Onde está cada coisa

| O quê | Onde |
| --- | --- |
| Decisões aprovadas e pendentes | `docs/decisoes.md` |
| Regras para o Claude trabalhar no projeto | `.claude/skills/` (convenções, design system, dados) |
| Código do app | `src/` |
| Migrações e testes do banco | `supabase/migrations/`, `supabase/tests/` |
| Verificação automática | `.github/workflows/ci.yml` |
