---
name: kosmos-design-system
description: Identidade visual e Design System do KOSMOS (app de organização pessoal do Victor, inspirado na marca pessoal "vict.OR" do Victor). Use sempre que for criar, alterar ou revisar qualquer coisa visual do KOSMOS, como telas, componentes, dashboard, calendário, gráficos de finanças, temas claro/escuro, cores, tipografia, ícones, tokens, estilos ou CSS, mesmo que o pedido não fale em "design system". Também use ao propor protótipos ou mockups do KOSMOS. Não use para o portfólio pessoal do Victor nem para outros projetos.
---

# KOSMOS — Design System

O KOSMOS é um produto de produtividade usado todos os dias para olhar calendário, tarefas, estudos e dinheiro. A interface deve ser calma, legível e rápida de escanear. A personalidade vem de poucas escolhas firmes (o azul elétrico, o contraste preto/off-white, a tipografia), não de decoração.

## 1. Relação com a marca vict.<OR>

- O KOSMOS é inspirado na marca pessoal, mas tem identidade própria. Não use o logo vict.<OR>, o "V" ou o wordmark dentro do KOSMOS.
- Não redesenhe nem altere a marca pessoal sem autorização do Victor.
- Referências a universo, ordem, conexões e sistemas são bem-vindas se forem sutis e funcionais (por exemplo, no logo do KOSMOS ou em estados vazios), nunca como enfeite de fundo.

## 2. Cores

### Paleta de referência (aprovada como ponto de partida)

| Token base | Valor | Uso |
|---|---|---|
| `blue-500` | `#263CFF` | Ações primárias, seleção, progresso |
| `black` | `#090909` | Texto no tema claro, superfícies mais escuras |
| `graphite` | `#171923` | Fundo do tema escuro |
| `off-white` | `#F4F0E7` | Fundo do tema claro, texto no tema escuro |
| `white` | `#FFFFFF` | Superfícies elevadas no tema claro, texto sobre azul |

### Cores medidas nos arquivos do logo (proposta pendente)

Os arquivos originais da marca (no Project "Kosmos - Meu App") contêm: azul `#233DFF`, off-white `#F4EFE6` e preto puro `#000000`. São muito próximos da referência. **Não troque os tokens aprovados por estes valores sem o Victor aprovar.** Ao apresentar a proposta visual, mostre as duas versões lado a lado.

### Contraste (medido, WCAG 2.1)

| Par | Contraste | Conclusão |
|---|---|---|
| `#263CFF` sobre `#171923` | 2,64:1 | **Reprova** para texto (mín. 4,5) e para bordas/foco (mín. 3) |
| `#263CFF` sobre `#090909` | 3,01:1 | Só passa para elementos gráficos grandes |
| `#263CFF` sobre `#F4F0E7` | 5,82:1 | Passa para texto |
| `#FFFFFF` sobre `#263CFF` | 6,62:1 | Passa: texto branco em botão azul |
| `#F4F0E7` sobre `#171923` | 15,39:1 | Passa |

Consequência prática: no tema escuro, o azul funciona como **preenchimento** (botão azul com texto branco), mas links, texto azul, ícones de seleção e anéis de foco precisam de uma variante mais clara do azul. Proponha essa variante (por exemplo, um `blue-300`) com contraste medido de pelo menos 4,5:1 sobre o grafite e aguarde aprovação. Recalcule o contraste sempre que criar ou alterar uma cor.

### Tokens semânticos

Componentes usam tokens semânticos, nunca valores hex diretos. Estrutura mínima, definida para os dois temas:

- Fundo e superfícies: `bg`, `surface`, `surface-raised`, `border`
- Texto: `text`, `text-muted`, `text-on-accent`
- Destaque: `accent`, `accent-hover`, `accent-text` (variante legível sobre o fundo), `focus-ring`
- Estados: `success`, `warning`, `danger`, `info`, cada um com versão de texto e de fundo suave

As cores de estado são distintas do azul da marca. `info` não pode ser o mesmo azul de `accent`, para que um aviso não pareça um botão. As cores de estado ainda precisam ser propostas e aprovadas.

### Onde o azul aparece

Use em: botão primário (um por área de tela), item selecionado, link, foco, barras de progresso, indicador de "hoje" no calendário. Não use em: títulos, ícones decorativos, cabeçalhos de card, bordas de todos os componentes, fundos grandes. Se uma tela tiver muitos elementos azuis, o azul deixou de indicar o que importa.

As categorias do calendário (universidade, igreja, saúde, finanças etc.) precisam se diferenciar sem virar arco-íris: prefira uma paleta categórica discreta e dessaturada, com o azul reservado à seleção. Proposta pendente.

## 3. Tipografia

- **Pendente:** a fonte da interface ainda não foi escolhida e a fonte do logo não foi identificada. Não afirme qual é a fonte do logo sem verificar a fonte original com o Victor.
- Observado no logo: sans-serif neo-grotesca, com contraste de peso entre "vict." (regular) e "<OR>" (negrito). Esse contraste de peso é uma boa ponte para a interface.
- Requisitos para a escolha: sans-serif moderna, excelente legibilidade em tamanhos pequenos, números tabulares (alinhamento em tabelas, calendário e valores em reais), boa cobertura de acentos do português, licença livre para web.
- Defina uma escala com poucos tamanhos (títulos, subtítulos, corpo, auxiliar, números de destaque) e use-a em tokens. Linhas de texto corrido com até cerca de 80 caracteres.

## 4. Espaçamento, forma e elevação

- Espaçamento em escala de base 4 ou 8 (decisão pendente), sempre via tokens.
- Raios: poucos níveis, com hierarquia (controles pequenos com raio menor que painéis). O quadrado arredondado do logo sugere raios generosos para containers, mas não aplique o mesmo raio em tudo.
- Elevação: o tema escuro diferencia camadas por tom de superfície, não por sombra. No claro, sombras discretas e raras. Nada de sombras pesadas ou gradientes decorativos.

## 5. Componentes

Antes de criar um componente, procure se já existe um equivalente no projeto e reutilize-o. Componentes base: botão (primário, secundário, fantasma, perigo), campo de texto, seleção, checkbox, data/hora, menu, card, tabela, modal, toast/notificação, abas, badge de categoria.

Todo componente interativo define os estados: padrão, hover, foco visível (via `focus-ring`), ativo, carregando, desabilitado e, quando fizer sentido, erro e sucesso. O foco precisa ser visível nos dois temas.

Introduzir uma biblioteca de componentes ou de ícones é uma decisão de stack: siga kosmos-convencoes (justificar e pedir aprovação) e verifique se ela aceita os tokens do KOSMOS sem reescrever o visual. Ícones: um único conjunto, traço consistente, sempre com rótulo acessível quando não houver texto.

## 6. Temas

- Escuro é o padrão; claro é a alternativa. Os dois usam os mesmos tokens semânticos com valores diferentes.
- Respeite a preferência do sistema na primeira visita e permita trocar nas configurações (se estiver no escopo da tarefa).
- Teste toda tela nova nos dois temas.

## 7. Qualidade mínima

- Responsivo do celular ao desktop; o uso no celular é frequente.
- Alvos de toque de pelo menos 44px no celular.
- Respeite `prefers-reduced-motion`. Movimento só para mostrar o que mudou após uma ação do usuário.
- Não comunique informação só por cor (categoria, status, saldo negativo): acompanhe com texto ou ícone.
- Textos da interface: verbos claros, sem jargão técnico, botões dizem o que acontece ("Salvar evento", não "Enviar"). Estados vazios convidam a agir.

## 8. Quando pedir validação

- Antes do Design System ser aprovado: apresente a proposta (paleta final, tipografia, navegação, dashboard, componentes principais) e espere aprovação antes de espalhar para outras telas.
- Depois de aprovado: reutilize o sistema sem pedir aprovação a cada componente. Peça validação só ao criar um padrão novo ou mudar um token.
- Registre as decisões aprovadas nesta skill ou no arquivo de decisões do repositório.
