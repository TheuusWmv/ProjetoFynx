# Processo Agil e Organizacao da Equipe - FYNX Rev. 06

> Documento de definicao do processo de desenvolvimento utilizado no projeto FYNX. A proposta e registrar, de forma simples e organizada, como a equipe esta conduzindo o trabalho: modelo agil adotado, forma de comunicacao, divisao de atividades, papeis, fluxo de execucao e criterios de entrega.

---

## 1. Identificacao do Modelo de Processo

O processo adotado no desenvolvimento do FYNX e uma adaptacao do **Extreme Programming (XP)**, combinada com **prototipagem evolutiva top-down** e com uma organizacao tecnica do backend orientada por dominios.

A equipe nao utiliza Scrum completo, sprints formais ou quadro Kanban estruturado. Em vez disso, adota um processo agil simplificado, mais adequado ao contexto academico, baseado em:

- comunicacao frequente entre os membros;
- lista de atividades e deveres a cumprir;
- divisao direta de responsabilidades;
- validacao visual das telas;
- implementacao incremental;
- revisao coletiva das entregas;
- atualizacao da documentacao conforme o projeto evolui.

Esse modelo foi escolhido porque o projeto possui prazos curtos, equipe reduzida e necessidade de avancar simultaneamente em codigo, documentacao e evidencias academicas.

---

## 2. Justificativa da Adocao do XP Adaptado

O XP foi usado como referencia por valorizar praticas importantes para projetos pequenos e iterativos. No FYNX, esses valores foram adaptados para a realidade da equipe.

| Valor do XP | Aplicacao no FYNX |
|---|---|
| Comunicacao | A equipe se comunica principalmente pelo grupo de WhatsApp, alinhando tarefas, duvidas, erros e prioridades. |
| Simplicidade | As funcionalidades sao implementadas conforme a necessidade atual da tela, entrega ou requisito. |
| Feedback | Telas, fluxos e documentos sao compartilhados para revisao rapida pela propria equipe. |
| Coragem | A equipe ajusta telas, codigo e documentacao quando identifica inconsistencias ou melhorias necessarias. |
| Respeito | As responsabilidades sao divididas considerando disponibilidade, conhecimento tecnico e necessidade da entrega. |

A equipe nao aplica todas as praticas formais do XP, como programacao em pares constante ou cliente presencial. O que foi adotado e uma versao simplificada dos principios, focada em comunicacao, entrega incremental e revisao rapida.

---

## 3. Prototipagem Evolutiva Top-Down

A abordagem top-down e usada principalmente nas funcionalidades com forte impacto visual, como dashboard, transacoes, metas e ranking.

No FYNX, a equipe parte da tela ou fluxo esperado pelo usuario e depois ajusta a implementacao tecnica necessaria. Isso evita que o backend seja desenvolvido sem clareza sobre quais dados a interface realmente precisa.

O processo top-down segue esta logica:

1. definir ou revisar a tela desejada;
2. validar a organizacao visual e a experiencia de uso;
3. identificar quais dados a interface precisa consumir;
4. implementar ou ajustar endpoints;
5. integrar frontend e backend;
6. registrar a funcionalidade na documentacao.

Essa pratica ajuda a reduzir retrabalho, pois a equipe valida primeiro a experiencia principal do usuario antes de aprofundar regras tecnicas.

---

## 4. Desenvolvimento Orientado a Dominios

Mesmo com um processo de equipe simples, o backend do FYNX foi organizado por dominios para manter separacao entre responsabilidades.

| Dominio | Responsabilidade |
|---|---|
| Identidade | Registro, login, autenticacao e JWT. |
| Financeiro | Transacoes, categorias, metas, budgets e limites. |
| Analytics | Dados consolidados para dashboard e indicadores. |
| Gamificacao | Ranking, score, ligas, conquistas e badges. |
| Infraestrutura | Banco de dados, servidor HTTP, middlewares, logs e rotas centrais. |

Essa organizacao ajuda a equipe a localizar onde cada alteracao deve ser feita. Uma melhoria no ranking, por exemplo, deve ser tratada no dominio de gamificacao; uma alteracao em transacoes deve ser tratada no dominio financeiro.

A orientacao por dominios tambem reduz o risco de acoplamento, pois evita que uma funcionalidade seja implementada de forma espalhada e sem criterio.

---

## 5. Organizacao Real da Equipe

### 5.1. Controle por Lista de Atividades

A equipe organiza o trabalho por meio de uma lista de atividades e deveres. Essa lista substitui um quadro Kanban formal e funciona como um controle direto do que precisa ser feito.

As atividades podem envolver:

- implementacao de funcionalidades;
- ajustes em telas;
- criacao ou correcao de componentes;
- implementacao ou revisao de endpoints;
- correcao de bugs;
- testes manuais ou automatizados;
- coleta de evidencias;
- escrita e revisao da documentacao;
- preparacao de entregas academicas.

Cada atividade recebe um responsavel ou grupo responsavel. A prioridade pode mudar conforme a proximidade da entrega, dificuldade tecnica ou dependencia entre tarefas.

### 5.2. Comunicacao pelo WhatsApp

O WhatsApp e o principal canal de comunicacao da equipe. Ele e usado para manter a equipe alinhada sem depender de reunioes formais longas.

No grupo sao compartilhados:

- andamento das tarefas;
- duvidas tecnicas;
- prints de telas e erros;
- avisos de impedimentos;
- pedidos de revisao;
- decisoes rapidas sobre layout, fluxo ou implementacao;
- combinacao de responsabilidades.

Quando uma decisao tomada no WhatsApp altera o comportamento do sistema ou a estrutura da documentacao, ela deve ser registrada posteriormente nos arquivos da Rev06.

### 5.3. Alinhamentos Sob Demanda

A equipe nao realiza cerimonias rigidas de Scrum. Os alinhamentos acontecem conforme a necessidade.

Eles ocorrem principalmente quando:

- uma entrega da disciplina esta proxima;
- uma funcionalidade precisa ser dividida;
- uma tela precisa ser revisada;
- existe bloqueio tecnico;
- algum documento precisa ser finalizado;
- uma decisao afeta mais de uma parte do projeto.

Essa forma de trabalho reduz burocracia e se adapta melhor ao ritmo da equipe.

---

## 6. Fluxo de Trabalho

O fluxo de trabalho utilizado pela equipe segue uma sequencia simples e repetitiva.

| Etapa | Descricao |
|---|---|
| 1. Entrada da demanda | A demanda surge por requisito da disciplina, necessidade tecnica, bug ou melhoria identificada. |
| 2. Discussao inicial | A equipe conversa pelo WhatsApp para entender o escopo e a prioridade. |
| 3. Quebra em atividades | A demanda e dividida em tarefas menores e mais executaveis. |
| 4. Distribuicao | As tarefas sao atribuidas aos membros conforme disponibilidade e conhecimento. |
| 5. Execucao | Cada responsavel implementa sua parte no frontend, backend, testes ou documentacao. |
| 6. Compartilhamento | O progresso, duvidas ou resultados sao enviados ao grupo. |
| 7. Revisao | A equipe valida se o resultado atende ao que foi combinado. |
| 8. Ajustes | Sao feitos ajustes de tela, regra, integracao ou texto documental. |
| 9. Registro | Evidencias e documentos sao atualizados quando necessario. |
| 10. Entrega | A funcionalidade ou artefato e considerado pronto para apresentacao ou avaliacao. |

Esse fluxo nao depende de uma sprint formal. Ele e aplicado em ciclos curtos conforme as funcionalidades e entregas evoluem.

---

## 7. Representacao da Interacao da Equipe

A interacao da equipe pode ser representada de forma textual da seguinte maneira:

```text
Professor / Disciplina / Necessidade do Projeto
                |
                v
        Discussao no WhatsApp
                |
                v
      Lista de atividades e deveres
                |
    +-----------+------------+-------------+-------------+
    |                        |             |             |
Frontend                 Backend     Documentacao     Testes
Telas e UI               API         Rev06            Evidencias
Componentes              Dominios    Requisitos       Validacoes
Fluxos                   Regras      Diagramas        Prints/Testes
    |                        |             |             |
    +-----------+------------+-------------+-------------+
                |
                v
          Revisao pela equipe
                |
                v
          Ajustes e validacao
                |
                v
          Entrega consolidada
```

Essa representacao mostra que o grupo de WhatsApp funciona como ponto central de comunicacao, enquanto a lista de atividades organiza o que cada frente precisa executar.

---

## 8. Papeis da Equipe

Os papeis foram adaptados ao tamanho da equipe e ao contexto academico. Eles nao sao totalmente fixos; um mesmo membro pode atuar em mais de uma funcao.

| Papel | Responsabilidade |
|---|---|
| Lider tecnico / organizador | Ajuda a definir prioridades, orientar integracao, revisar decisoes tecnicas e acompanhar pendencias. |
| Desenvolvedores | Implementam funcionalidades no frontend e backend, corrigem problemas e fazem integracoes. |
| Responsaveis por documentacao | Atualizam os documentos academicos e conectam implementacao com requisitos, arquitetura, API e evidencias. |
| Revisores internos | Conferem telas, fluxos, textos e funcionamento antes da entrega. |
| Proxy de cliente | A propria equipe avalia se a funcionalidade faz sentido para o usuario final. |

O ponto central e garantir que cada atividade tenha um responsavel claro, mesmo que os papeis sejam flexiveis.

---

## 9. Artefatos do Processo

| Artefato | Finalidade |
|---|---|
| Lista de atividades | Controlar tarefas pendentes, responsaveis e prioridades. |
| Conversas no WhatsApp | Registrar alinhamentos rapidos, decisoes e duvidas. |
| Codigo frontend | Materializar telas, componentes e fluxos de usuario. |
| Codigo backend | Implementar endpoints, regras e dominios de negocio. |
| Testes e evidencias | Comprovar que funcionalidades importantes foram verificadas. |
| FynxDocs Rev06 | Registrar requisitos, arquitetura, API, banco, processos, telas e rastreabilidade. |

Esses artefatos funcionam juntos. A lista organiza o trabalho, o WhatsApp mantem a comunicacao, o codigo materializa a solucao e a documentacao registra o que foi entregue.

---

## 10. Criterios de Pronto

Uma atividade e considerada pronta quando atende aos criterios aplicaveis ao seu tipo.

| Tipo de atividade | Criterio de pronto |
|---|---|
| Tela ou componente | Visual revisado e funcionando no fluxo esperado. |
| Backend | Endpoint, regra ou ajuste implementado no dominio adequado. |
| Integracao | Frontend consumindo a API sem erro critico. |
| Bug | Problema corrigido e validado pela equipe. |
| Teste ou evidencia | Resultado registrado por teste, print ou verificacao manual. |
| Documentacao | Conteudo atualizado, coerente e sem prometer recurso inexistente. |

---

## 11. Beneficios Observados

O processo trouxe beneficios praticos para o projeto:

- comunicacao rapida entre os membros;
- menor burocracia em comparacao com Scrum formal;
- melhor adaptacao aos prazos academicos;
- divisao clara de deveres;
- revisao rapida de telas e documentos;
- reducao de retrabalho por validar a interface antes da implementacao completa;
- organizacao tecnica mais segura por dominios no backend.

---

## 12. Dificuldades Encontradas

As principais dificuldades observadas foram:

- manter a lista de atividades sempre atualizada;
- registrar na documentacao decisoes tomadas rapidamente pelo WhatsApp;
- equilibrar tempo entre implementacao e escrita dos documentos;
- evitar que mudancas pequenas de tela fiquem sem registro;
- manter consistencia entre requisitos, codigo, API, banco e evidencias.

---

## 13. Melhorias Possiveis

Para evoluir o processo sem aumentar demais a burocracia, a equipe pode adotar melhorias simples:

- manter uma lista unica por entrega;
- registrar responsavel e status de cada atividade;
- revisar a documentacao ao final de cada funcionalidade relevante;
- separar tarefas por frente: frontend, backend, testes e documentacao;
- guardar evidencias logo apos a validacao de cada fluxo;
- registrar no documento tecnico as decisoes mais importantes tomadas no WhatsApp.

---

## 14. Avaliacao do Processo

O processo adotado e adequado ao contexto do FYNX porque combina agilidade, simplicidade e organizacao suficiente para o controle academico do projeto.

A equipe nao utiliza um modelo formal completo como Scrum, mas mantem uma estrutura de trabalho baseada em comunicacao frequente, lista de atividades, divisao de responsabilidades, validacao coletiva e documentacao incremental.

Essa abordagem permite que o projeto avance de forma pratica, mantendo rastreabilidade entre o que foi planejado, implementado e documentado.
