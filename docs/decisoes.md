# Decisões do KOSMOS

Registro das decisões do projeto. O planejamento completo da Fase 0 (MVP, arquitetura, modelo de dados, riscos e backlog) está no documento "KOSMOS — Fase 0: Planejamento", no Project "Kosmos - Meu App" do Claude.

Regra: uma decisão só entra em "Aprovadas" quando o Victor aprovar. Ao mudar algo, registre a data e o motivo, sem apagar o histórico.

## Aprovadas

| Data | Decisão |
| --- | --- |
| 16/10/2026 | Desenvolvimento em fases (0 a 6), validando cada uma antes de aumentar a complexidade (documento mestre). |
| 16/10/2026 | Só o Victor usa no início, mas com contas separadas desde o primeiro dia. Sem dados compartilhados entre pessoas no MVP. |
| 16/10/2026 | Primeiro módulo depois da base: calendário e tarefas. |
| 16/10/2026 | Escopo do MVP aprovado, incluindo o plano de estudo para provas. |
| 16/10/2026 | Login por e-mail e senha e também com Google. |
| 16/10/2026 | Stack: React + TypeScript + Vite no front; Supabase (Postgres, Auth, RLS, funções, Edge Functions, `pg_cron`) no back-end; publicação na Cloudflare; CI no GitHub Actions. |
| 16/10/2026 | Ferramentas da base: oxlint (lint, padrão do template atual do Vite), Vitest (testes), TypeScript em modo `strict`. |
| 16/10/2026 | Se uma integração for inviável, o cadastro manual cobre a mesma necessidade. |
| 16/10/2026 | Fontes e cores da marca: Archivo (variável) e JetBrains Mono, self-hosted; azul `#233DFF`, creme `#F4EFE6`, preto `#000000`. Substituem os valores de referência do documento mestre. |

## Pendentes (não presumir)

- Logo do KOSMOS: proposta em PNG (estrela de quatro pontas com órbita e ponto azul, no Project do Claude). Falta uma versão vetorial (SVG) sem brilho e sem degradê para ícone pequeno, e decidir o azul: a logo usa cerca de `#0852FD` a `#1D74FD`, diferente do `#233DFF` da marca. O `#1D74FD` tem contraste de 4,66:1 sobre o fundo quase preto e pode servir como o azul de texto no tema escuro.
- Proposta visual completa (paleta final, variante clara do azul para o tema escuro, cores de estado, tipografia, navegação e dashboard), a ser validada antes de construir telas.
- Biblioteca de datas com fuso: `Temporal` com polyfill ou `date-fns-tz`, a decidir com um teste na Fase 1.
- Adoção de Tailwind v4, React Router, TanStack Query e Zod: recomendados na Fase 0, instalados só quando o item do backlog precisar deles.
- Estrutura de pastas por módulo do produto, a definir quando surgir o primeiro módulo.

## Dependem de pesquisa

- Moodle da Unicamp: verificar se é possível exportar o calendário (.ics).
- Google Classroom e Google Calendar: verificação do app no Google e permissões da conta institucional.
- Open Finance: custo e contrato do agregador.
