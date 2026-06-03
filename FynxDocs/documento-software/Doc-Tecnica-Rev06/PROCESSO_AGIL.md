# Processo Ágil e Organização da Equipe - FYNX Rev. 06

> Documento de definição do processo de desenvolvimento utilizado no projeto FYNX. A proposta e registrar, de forma simples e organizada, como a equipe esta conduzindo o trabalho: modelo Ágil adotado, forma de comunicação, divisão de atividades, papéis, fluxo de execução e critérios de entrega.

---

## 1. Identificacao do Modelo de Processo

O processo adotado no desenvolvimento do FYNX é uma adaptação do **Extreme Programming (XP)**, combinada com **prototipagem evolutiva top-down** e com uma organização técnica do backend orientada por domínios.

A equipe não utiliza Scrum completo, sprints formais ou quadro Kanban estruturado. Em vez disso, adota um processo Ágil simplificado, mais adequado ao contexto acadêmico, baseado em:

- comunicação frequente entre os membros;
- lista de atividades e deveres a cumprir;
- divisão direta de responsabilidades;
- validação visual das telas;
- implementação incremental;
- revisão coletiva das entregas;
- atualização da documentação conforme o projeto evolui.

Esse modelo foi escolhido porque o projeto possui prazos curtos, equipe reduzida e necessidade de avançar simultaneamente em código, documentação e evidências acadêmicas.

---

## 2. Justificativa da Adocao do XP Adaptado

O XP foi usado como Referência por valorizar práticas importantes para projetos pequenos e iterativos. No FYNX, esses valores foram adaptados para a realidade da equipe.

| Valor do XP | Aplicação no FYNX |
|---|---|
| Comunicação | A equipe se comunica principalmente pelo grupo de WhatsApp, alinhando tarefas, dúvidas, erros e prioridades. |
| Simplicidade | As funcionalidades são implementadas conforme a necessidade atual da tela, entrega ou requisito. |
| Feedback | Telas, fluxos e documentos são compartilhados para revisão rápida pela própria equipe. |
| Coragem | A equipe ajusta telas, código e documentação quando identifica inconsistencias ou melhorias necessárias. |
| Respeito | As responsabilidades são divididas considerando disponibilidade, conhecimento técnico e necessidade da entrega. |

A equipe não aplica todas as práticas formais do XP, como programação em pares constante ou cliente presencial. O que foi adotado é uma versão simplificada dos princípios, focada em comunicação, entrega incremental e revisão rápida.

---

## 3. Prototipagem Evolutiva Top-Down

A abordagem top-down é usada principalmente nas funcionalidades com forte impacto visual, como dashboard, transações, metas e ranking.

No FYNX, a equipe parte da tela ou fluxo esperado pelo usuário e depois ajusta a implementação técnica necessária. Isso evita que o backend seja desenvolvido sem clareza sobre quais dados a interface realmente precisa.

O processo top-down segue esta lógica:

1. definir ou revisar a tela desejada;
2. validar a organização visual e a experiência de uso;
3. identificar quais dados a interface precisa consumir;
4. implementar ou ajustar endpoints;
5. integrar frontend e backend;
6. registrar a funcionalidade na documentação.

Essa prática ajuda a reduzir retrabalho, pois a equipe valida primeiro a experiência principal do usuário antes de aprofundar regras técnicas.

---

## 4. Desenvolvimento Orientado a Domínios

Mesmo com um processo de equipe simples, o backend do FYNX foi organizado por domínios para manter separação entre responsabilidades.

| Domínio | Responsabilidade |
|---|---|
| Identidade | Registro, login, autenticação e JWT. |
| Financeiro | Transações, categorias, metas, budgets e limites. |
| Analytics | Dados consolidados para dashboard e indicadores. |
| Gamificação | Ranking, score, ligas, conquistas e badges. |
| Infraestrutura | Banco de dados, servidor HTTP, middlewares, logs e rotas centrais. |

Essa organização ajuda a equipe a localizar onde cada alteração deve ser feita. Uma melhoria no ranking, por exemplo, deve ser tratada no domínio de gamificação; uma alteração em transações deve ser tratada no domínio financeiro.

A orientação por domínios também reduz o risco de acoplamento, pois evita que uma funcionalidade seja implementada de forma espalhada e sem critério.

---

## 5. Organização Real da Equipe

### 5.1. Controle por Lista de Atividades

A equipe organiza o trabalho por meio de uma lista de atividades e deveres. Essa lista substitui um quadro Kanban formal e funciona como um controle direto do que precisa ser feito.

As atividades podem envolver:

- implementação de funcionalidades;
- ajustes em telas;
- criação ou correcao de componentes;
- implementação ou revisão de endpoints;
- correcao de bugs;
- testes manuais ou automatizados;
- coleta de evidências;
- escrita e revisão da documentação;
- preparacao de entregas acadêmicas.

Cada atividade recebe um responsável ou grupo responsável. A prioridade pode mudar conforme a proximidade da entrega, dificuldade técnica ou dependencia entre tarefas.

### 5.2. Comunicação pelo WhatsApp

O WhatsApp é o principal canal de comunicação da equipe. Ele é usado para manter a equipe alinhada sem depender de reunioes formais longas.

No grupo são compartilhados:

- andamento das tarefas;
- dúvidas técnicas;
- prints de telas e erros;
- avisos de impedimentos;
- pedidos de revisão;
- decisões rápidas sobre layout, fluxo ou implementação;
- combinacao de responsabilidades.

Quando uma decisão tomada no WhatsApp altera o comportamento do sistema ou a estrutura da documentação, ela deve ser registrada posteriormente nos arquivos da Rev06.

### 5.3. Alinhamentos Sob Demanda

A equipe não realiza cerimonias rigidas de Scrum. Os alinhamentos acontecem conforme a necessidade.

Eles ocorrem principalmente quando:

- uma entrega da disciplina esta próxima;
- uma funcionalidade precisa ser dividida;
- uma tela precisa ser revisada;
- existe bloqueio técnico;
- algum documento precisa ser finalizado;
- uma decisão afeta mais de uma parte do projeto.

Essa forma de trabalho reduz burocracia e se adapta melhor ao ritmo da equipe.

---

## 6. Fluxo de Trabalho

O fluxo de trabalho utilizado pela equipe segue uma sequência simples e repetitiva.

| Etapa | Descrição |
|---|---|
| 1. Entrada da demanda | A demanda surge por requisito da disciplina, necessidade técnica, bug ou melhoria identificada. |
| 2. Discussão inicial | A equipe conversa pelo WhatsApp para entender o escopo e a prioridade. |
| 3. Quebra em atividades | A demanda e dividida em tarefas menores e mais executaveis. |
| 4. Distribuição | As tarefas são atribuídas aos membros conforme disponibilidade e conhecimento. |
| 5. Execução | Cada responsável implementa sua parte no frontend, backend, testes ou documentação. |
| 6. Compartilhamento | O progresso, dúvidas ou resultados são enviados ao grupo. |
| 7. Revisão | A equipe valida se o resultado atende ao que foi combinado. |
| 8. Ajustes | São feitos ajustes de tela, regra, integração ou texto documental. |
| 9. Registro | Evidências e documentos são atualizados quando necessário. |
| 10. Entrega | A funcionalidade ou artefato É considerado pronto para apresentação ou avaliação. |

Esse fluxo não depende de uma sprint formal. Ele É aplicado em ciclos curtos conforme as funcionalidades e entregas evoluem.

---

## 7. Representacao da Interacao da Equipe

A interacao da equipe pode ser representada de forma textual da seguinte maneira:

```text
Professor / Disciplina / Necessidade do Projeto
                |
                v
        Discussão no WhatsApp
                |
                v
      Lista de atividades e deveres
                |
    +-----------+------------+-------------+-------------+
    |                        |             |             |
Frontend                 Backend     Documentação     Testes
Telas e UI               API         Rev06            Evidências
Componentes              Domínios    Requisitos       Validações
Fluxos                   Regras      Diagramas        Prints/Testes
    |                        |             |             |
    +-----------+------------+-------------+-------------+
                |
                v
          Revisão pela equipe
                |
                v
          Ajustes e validação
                |
                v
          Entrega consolidada
```

Essa representacao mostra que o grupo de WhatsApp funciona como ponto central de comunicação, enquanto a lista de atividades organiza o que cada frente precisa executar.

---

## 8. Papéis da Equipe

Os papéis foram adaptados ao tamanho da equipe e ao contexto acadêmico. Eles não são totalmente fixos; um mesmo membro pode atuar em mais de uma função.

| Papel | Responsabilidade |
|---|---|
| Líder técnico / organizador | Ajuda a definir prioridades, orientar integração, revisar decisões técnicas e acompanhar pendencias. |
| Desenvolvedores | Implementam funcionalidades no frontend e backend, corrigem problemas e fazem integrações. |
| Responsáveis por documentação | Atualizam os documentos acadêmicos e conectam implementação com requisitos, arquitetura, API e evidências. |
| Revisores internos | Conferem telas, fluxos, textos e funcionamento antes da entrega. |
| Proxy de cliente | A própria equipe avalia se a funcionalidade faz sentido para o usuário final. |

O ponto central e garantir que cada atividade tenha um responsável claro, mesmo que os papéis sejam flexiveis.

---

## 9. Artefatos do Processo

| Artefato | Finalidade |
|---|---|
| Lista de atividades | Controlar tarefas pendentes, responsáveis e prioridades. |
| Conversas no WhatsApp | Registrar alinhamentos rapidos, decisões e dúvidas. |
| Código frontend | Materializar telas, componentes e fluxos de usuário. |
| Código backend | Implementar endpoints, regras e domínios de negócio. |
| Testes e evidências | Comprovar que funcionalidades importantes foram verificadas. |
| FynxDocs Rev06 | Registrar requisitos, arquitetura, API, banco, processos, telas e rastreabilidade. |

Esses artefatos funcionam juntos. A lista organiza o trabalho, o WhatsApp mantém a comunicação, o código materializa a solução e a documentação registra o que foi entregue.

---

## 10. Critérios de Pronto

Uma atividade É considerada pronta quando atende aos critérios aplicáveis ao seu tipo.

| Tipo de atividade | Critério de pronto |
|---|---|
| Tela ou componente | Visual revisado e funcionando no fluxo esperado. |
| Backend | Endpoint, regra ou ajuste implementado no domínio adequado. |
| Integração | Frontend consumindo a API sem erro critico. |
| Bug | Problema corrigido e validado pela equipe. |
| Teste ou evidência | Resultado registrado por teste, print ou verificação manual. |
| Documentação | Conteúdo atualizado, coerente e sem prometer recurso inexistente. |

---

## 11. Benefícios Observados

O processo trouxe benefícios práticos para o projeto:

- comunicação rápida entre os membros;
- menor burocracia em comparação com Scrum formal;
- melhor adaptação aos prazos acadêmicos;
- divisão clara de deveres;
- revisão rápida de telas e documentos;
- redução de retrabalho por validar a interface antes da implementação completa;
- organização técnica mais segura por domínios no backend.

---

## 12. Dificuldades Encontradas

As principais dificuldades observadas foram:

- manter a lista de atividades sempre atualizada;
- registrar na documentação decisões tomadas rapidamente pelo WhatsApp;
- equilibrar tempo entre implementação e escrita dos documentos;
- evitar que mudancas pequenas de tela fiquem sem registro;
- manter consistência entre requisitos, código, API, banco e evidências.

---

## 13. Melhorias Possíveis

Para evoluir o processo sem aumentar demais a burocracia, a equipe pode adotar melhorias simples:

- manter uma lista Única por entrega;
- registrar responsável e status de cada atividade;
- revisar a documentação ao final de cada funcionalidade relevante;
- separar tarefas por frente: frontend, backend, testes e documentação;
- guardar evidências logo após a validação de cada fluxo;
- registrar no documento técnico as decisões mais importantes tomadas no WhatsApp.

---

## 14. Avaliação do Processo

O processo adotado e adequado ao contexto do FYNX porque combina agilidade, simplicidade e organização suficiente para o controle acadêmico do projeto.

A equipe não utiliza um modelo formal completo como Scrum, mas mantém uma estrutura de trabalho baseada em comunicação frequente, lista de atividades, divisão de responsabilidades, validação coletiva e documentação incremental.

Essa abordagem permite que o projeto avance de forma prática, mantendo rastreabilidade entre o que foi planejado, implementado e documentado.
