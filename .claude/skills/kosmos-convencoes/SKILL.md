---
name: kosmos-convencoes
description: Convenções de desenvolvimento do KOSMOS (app de organização pessoal do Victor que integra calendário, tarefas, estudos, finanças e metas). Use sempre que for planejar, implementar, revisar, refatorar, testar ou depurar qualquer parte do KOSMOS, mesmo que o pedido não cite "convenções", por exemplo criar uma tela, um endpoint, uma migração, configurar o projeto, escolher uma biblioteca ou corrigir um bug. Para cores, tipografia e componentes visuais use também kosmos-design-system; para banco, datas, dinheiro, autorização e sincronização use também kosmos-dados. Não use em projetos que não sejam o KOSMOS.
---

# KOSMOS — Convenções de desenvolvimento

O KOSMOS é desenvolvido por um estudante de Sistemas de Informação que quer aprender enquanto constrói. O objetivo destas convenções é que toda sessão, em qualquer dia, produza código coerente com as anteriores e que o Victor entenda o que foi feito.

## 1. Antes de mexer em qualquer coisa

1. Identifique o tipo de pedido (seção 3). Se for análise ou planejamento, não altere arquivos.
2. Leia o que já existe: `README`, `CLAUDE.md`, pasta `docs/` (decisões, arquitetura) e a estrutura do repositório. Se esses arquivos ainda não existirem, diga isso em vez de supor o conteúdo.
3. Se estiver num repositório git, rode `git status` e veja se há alterações não commitadas do Victor. Não sobrescreva nem descarte essas alterações.
4. Confira a seção "Estado das decisões" (seção 5). Uma decisão pendente não pode ser tratada como tomada.

## 2. As 15 regras do documento mestre (seção 10)

Estas regras vêm do documento mestre do KOSMOS e valem em todas as sessões:

1. Não implemente tudo de uma vez.
2. Primeiro compreenda o produto e proponha um plano.
3. Divida o trabalho em tarefas pequenas, verificáveis e priorizadas.
4. Explique decisões técnicas e alternativas relevantes.
5. Gere código organizado, tipado quando aplicável e fácil de manter.
6. Evite dependências desnecessárias e abstrações prematuras.
7. Não invente credenciais, integrações, dados ou funcionalidades concluídas.
8. Diferencie claramente protótipos, dados fictícios e integrações reais.
9. Inclua testes e instruções de execução nas etapas pertinentes.
10. Antes de modificar arquivos existentes, examine sua estrutura e preserve o que já funciona.
11. Se estiver trabalhando em um repositório, verifique seu estado e evite sobrescrever alterações do Victor.
12. Não exponha segredos em arquivos públicos, logs ou exemplos.
13. Quando faltar uma informação importante, faça perguntas objetivas.
14. Ao finalizar cada etapa, informe o que foi implementado, como testar, quais limitações existem e qual é o próximo passo.
15. Não considere uma funcionalidade pronta apenas porque a interface foi criada. Valide também sua lógica e persistência.

## 3. Tipo de pedido define o que você pode fazer

| Pedido | Exemplos de frase | O que fazer | O que não fazer |
|---|---|---|---|
| Planejamento / análise | "como faria", "proponha", "analise", "qual a melhor forma" | Ler, comparar alternativas, recomendar, listar riscos | Criar ou editar arquivos de código |
| Implementação | "implemente", "crie", "adicione" | Mudar só o escopo pedido, testar, reportar | Funcionalidades extras "aproveitando" |
| Revisão | "revise", "o que está errado", "está bom?" | Apontar problemas com arquivo e linha, sugerir correção | Aplicar as correções sem pedido |
| Refatoração | "refatore", "organize", "limpe" | Mudar estrutura mantendo comportamento; rodar testes antes e depois | Mudar comportamento ou contratos |

Na dúvida entre planejar e implementar, apresente o plano e pergunte.

## 4. Padrões de código

- **Stack:** use só o que foi aprovado (seção 5). Uma tecnologia, biblioteca ou serviço novo exige justificativa (o que resolve, alternativa mais simples, custo) e aprovação do Victor antes da instalação.
- **Tipagem:** quando a linguagem permitir, tipar entradas, saídas e dados de domínio. Evite `any` ou equivalentes; se for inevitável, comente o motivo.
- **Organização:** agrupe código por módulo do produto (calendário, acadêmico, finanças etc.), cada arquivo com uma responsabilidade clara. Siga a estrutura de pastas e a nomenclatura que já existirem no repositório; se ainda não houver, proponha antes de criar.
- **Simplicidade:** nada de microserviços, camadas genéricas ou abstrações para casos que ainda não existem. Três repetições parecidas justificam extrair algo; uma não.
- **Estados de interface:** toda tela que carrega dados trata carregamento, vazio, erro e sucesso. Mensagens de erro dizem o que aconteceu e como resolver.
- **Validação:** valide entradas na fronteira (formulários e API). A validação do servidor é a que vale; a do cliente é só conforto.
- **Erros:** não engula exceções em silêncio. Trate onde é possível agir; registre o resto sem dados sensíveis.
- **Configuração:** não altere configurações, dependências ou contratos de API/banco existentes sem avaliar o impacto e citar isso na resposta.

## 5. Estado das decisões

A fonte de verdade é `docs/decisoes.md`. Leia esse arquivo antes de escolher tecnologia, escopo ou estrutura, e atualize-o (com data) sempre que o Victor aprovar algo. Uma decisão marcada como pendente lá não pode ser tratada como tomada.

Resumo em 16/10/2026: stack aprovada (React + TypeScript + Vite, Supabase, Cloudflare); MVP aprovado; Design System, fontes e paleta final ainda pendentes; integrações dependem de pesquisa.

## 6. Testes e verificação

- Teste em proporção ao risco: lógica financeira, de datas, de recorrência, de planejamento de estudos e de autorização exige testes automatizados; ajustes visuais simples, não necessariamente.
- Depois de alterar código, rode o que existir: testes, lint, verificação de tipos, build. Se algum comando não existir, diga isso.
- Só diga que um teste passou se você o executou e viu o resultado. Se não pôde rodar, diga "não executado" e explique como o Victor roda.
- Ao mudar comportamento, atualize testes e documentação afetados.

## 7. Como explicar

O Victor está aprendendo. Ao tomar uma decisão técnica relevante, explique em poucas frases e em linguagem simples: o que foi escolhido, por quê, e qual alternativa foi descartada. Defina termos técnicos na primeira vez que aparecerem. Não encha o código de comentários óbvios; explique na resposta.

## 8. Relatório ao final de cada etapa

Termine cada etapa de implementação com:

- **Feito:** o que foi implementado (arquivos principais).
- **Como testar:** comandos e passos manuais.
- **Verificações:** o que foi executado e o resultado real.
- **Limitações:** o que é protótipo, fictício ou incompleto.
- **Próximo passo:** uma sugestão.
