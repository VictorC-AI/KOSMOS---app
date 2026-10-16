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

## Onde está cada coisa

| O quê | Onde |
| --- | --- |
| Decisões aprovadas e pendentes | `docs/decisoes.md` |
| Regras para o Claude trabalhar no projeto | `.claude/skills/` (convenções, design system, dados) |
| Código do app | `src/` |
| Verificação automática | `.github/workflows/ci.yml` |
