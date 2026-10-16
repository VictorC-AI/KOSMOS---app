---
name: kosmos-dados
description: Regras de dados do KOSMOS (app de organização pessoal do Victor com calendário, estudos, finanças e metas). Use sempre que for modelar tabelas, escrever migrações, consultas, endpoints ou lógica que leia ou grave dados do KOSMOS, e em qualquer tarefa que envolva autorização por usuário, datas, horários, fusos, recorrência, dinheiro, saldos, orçamentos, cofrinhos, metas, integrações (Moodle, Google Classroom, Google Calendar, Open Finance), sincronização, logs ou exclusão de dados, mesmo que o pedido não fale em "dados". Não use em projetos que não sejam o KOSMOS.
---

# KOSMOS — Regras de dados

O KOSMOS guarda a agenda, a vida acadêmica e o dinheiro de uma pessoa. Um vazamento entre usuários, um compromisso que muda de dia por causa de fuso ou um saldo errado por arredondamento destroem a confiança no produto. Estas regras existem para evitar exatamente essas três falhas.

O banco, o ORM e o provedor de autenticação ainda não foram escolhidos (ver kosmos-convencoes). As regras abaixo valem para qualquer stack relacional; adapte a sintaxe à que for aprovada.

## 1. Isolamento entre usuários

- Toda tabela com dados de um usuário tem `user_id` não nulo, com chave estrangeira para o usuário e índice. Tabelas filhas podem herdar a posse do pai, mas a consulta precisa garantir o vínculo (por exemplo, sessão de estudo → plano → usuário).
- O `user_id` vem da sessão autenticada no servidor, nunca do corpo da requisição, da URL ou do cliente.
- Toda leitura, edição e exclusão filtra pelo usuário autenticado. Buscar por `id` sem filtrar por usuário é falha de segurança, mesmo que o `id` seja difícil de adivinhar.
- Se a stack usar Supabase: ative RLS em todas as tabelas de usuário, crie políticas por operação e teste que um usuário não lê dados de outro. A chave `service_role` nunca vai para o cliente. Em outras stacks, aplique o equivalente (camada de acesso que sempre recebe o usuário da sessão, ou RLS do Postgres).
- Menor privilégio: cada integração, chave e conta de serviço com só as permissões necessárias.

## 2. Segredos, logs e dados sensíveis

- Tokens de integração ficam só no servidor, criptografados no banco, com data de expiração e possibilidade de revogação.
- Nunca peça nem armazene senha bancária. Integração bancária só via provedor autorizado com consentimento do usuário.
- Logs não contêm: tokens, valores e descrições de transações, saldos, conteúdo de eventos pessoais, e-mail completo. Registre IDs e o tipo do evento.
- Dados de desenvolvimento e teste são fictícios.
- Planeje exportação e exclusão de todos os dados do usuário (LGPD). Exclusão de conta remove ou anonimiza também os dados derivados e revoga integrações.

## 3. Datas e horários

Escolha o tipo pelo significado do campo:

| Significado | Exemplo | Como guardar |
|---|---|---|
| Instante absoluto | criado em, sincronizado em, lembrete disparado | `timestamp with time zone`, em UTC |
| Data sem horário | vencimento de conta, prova "dia 20", aniversário | `date` (sem conversão de fuso) |
| Horário local de um compromisso | aula toda terça às 19h em São Paulo | data/hora local + fuso IANA do evento |
| Dia inteiro | feriado, viagem | `date` de início e fim |

- Guarde o fuso IANA do usuário (`America/Sao_Paulo`) nas preferências e, em eventos com horário, o fuso do próprio evento.
- Uma data de vencimento nunca passa por conversão de fuso: 20/10 tem que ser 20/10 em qualquer lugar.
- Recorrência: guarde a regra (formato RRULE do iCalendar) com o horário local e o fuso, não uma lista de instantes em UTC. Assim "toda terça às 19h" continua às 19h se houver mudança de horário de verão. Exceções (uma ocorrência cancelada ou movida) ficam registradas à parte.
- Não presuma que todos os usuários estão no mesmo fuso.
- Teste: virada de dia perto da meia-noite, eventos recorrentes atravessando mudança de horário, usuário em outro fuso.

## 4. Dinheiro

- Valores em centavos, como inteiro (`bigint`). Nunca `float`/`double` para dinheiro. Em código, use inteiros ou um tipo decimal exato.
- Cada valor tem moeda explícita (`currency`, código ISO 4217, padrão `BRL`) se o domínio aceitar mais de uma moeda.
- Defina e documente a regra de arredondamento (por exemplo, ao dividir parcelas: distribuir o centavo restante na primeira ou na última parcela) e teste que a soma das partes é igual ao total.
- Saldo é calculado a partir das transações ou conciliado com elas; se houver saldo armazenado, teste que bate com a soma.
- Cofrinhos e metas: se o cofrinho é uma divisão contábil dentro de uma conta, ele é uma **alocação** de parte do saldo, não uma conta nova. O mesmo dinheiro não pode aparecer em dois lugares nem ser somado duas vezes no patrimônio. Separe "disponível" de "planejado/alocado".
- Projeções mostram as hipóteses usadas (taxa, aportes, prazo) e nunca prometem rendimento.

## 5. Integrações e sincronização

- Cada registro importado guarda: origem (`source`, por exemplo `moodle`), ID externo (`external_id`) e quando foi sincronizado. Restrição única em (`user_id`, `source`, `external_id`) impede duplicação.
- Importação idempotente (upsert): rodar a mesma sincronização duas vezes produz o mesmo resultado.
- Trate paginação, limite de requisições (com espera e nova tentativa), falha temporária, token expirado (renovar ou pedir reconexão) e cancelamento na origem (marcar como cancelado, não apagar em silêncio).
- Conflito: se o usuário editou localmente um registro importado, não sobrescreva sem uma política definida (por exemplo, campos editados pelo usuário prevalecem). A política deve ser aprovada antes de implementar.
- Registre cada sincronização (início, fim, status, quantidades criadas/atualizadas/erros) sem dados sensíveis. Só diga que sincronizou se a execução terminou com sucesso confirmado.
- Peça só os escopos de permissão necessários. Se a instituição não oferece API, use alternativas legítimas (calendário assinado .ics, importação de arquivo, cadastro manual), nunca raspagem com a senha do usuário.
- Integrações ainda dependem de pesquisa: não implemente uma integração real nem simule uma como se fosse real.

## 6. Integridade e evolução do banco

- Use chaves estrangeiras, `NOT NULL`, `CHECK` (por exemplo, valor de meta maior que zero; fim depois do início) e índices para as consultas reais (`user_id` + data é o padrão mais comum).
- Crie tabelas conforme a fase exige; não crie o modelo inteiro de uma vez.
- Toda mudança de esquema é uma migração versionada, com reversão quando viável. Nunca altere o banco à mão em produção.
- Antes de uma migração destrutiva (apagar coluna, mudar tipo, apagar dados), explique o impacto, proponha backup ou migração em duas etapas e peça aprovação.
- Prefira exclusão lógica (`deleted_at`) onde o usuário possa querer desfazer, e exclusão real quando ele pedir a remoção dos dados.

## 7. Testes obrigatórios para dados

Para funcionalidades que tocam estas áreas, inclua testes automatizados de:

- Isolamento: usuário A não consegue ler, editar nem excluir dados do usuário B.
- Sincronização: rodar duas vezes não duplica; cancelamento na origem é refletido.
- Datas: vencimentos não mudam de dia; recorrência mantém o horário local.
- Dinheiro: somas, parcelas e projeções batem centavo a centavo; cofrinhos não duplicam saldo.
