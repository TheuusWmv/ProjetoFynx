# Engenharia de Requisitos e Regras de Negócio - FYNX Rev. 06

> Documento de requisitos da Rev06. Mantém a estrutura de Domain-Driven Design, mas recupera a rastreabilidade clássica da Rev05: requisito, regra de negócio, caso de uso, endpoint, tabela e arquivo de código.

---

## 1. Convencoes

| Código | Significado |
|---|---|
| `RF` | Requisito funcional. |
| `RNF` | Requisito não funcional. |
| `RN` | Regra de negócio. |
| `PI` | Política de integridade de dados. |
| `CSU` | Caso de uso em `FLUXOS_E_CASOS_DE_USO.md`. |
| `BC` | Bounded Context. |

**Status permitidos:** Implementado, Parcial, Planejado, Legado, Não registrado.

---

## 2. Visão por Bounded Context

| Bounded Context | Responsabilidade | Módulos principais | Status |
|---|---|---|---|
| Identity & Access | Login, registro e protecao de rotas. | `identity/auth` | Implementado |
| Financial Core | Transações, metas, budgets, categorias customizadas e limites. | `financial/*` | Implementado com lacunas em spending limits |
| Analytics | Dashboard, indicadores e histórico agregado. | `analytics/dashboard` | Implementado |
| Gamification | Ranking, score, ligas, badges e achievements. | `gamification/ranking` | Implementado com controles administrativos a revisar |
| Omnichannel WhatsApp | Registro e consulta por chat/voz. | Não há rota registrada | Planejado |
| Admin & Audit | Auditoria, operação e governanca. | Parcial por logs/middlewares | Planejado/Parcial |

---

## 3. Requisitos Funcionais

### RF001 - Autenticação de usuário

**Contexto:** Identity & Access
**Status:** Implementado
**Endpoint:** `POST /api/v1/auth/login`
**Código:** `FynxApi/src/domains/identity/auth`

**Objetivo:** permitir que um usuário registrado acesse o sistema por email e senha, recebendo um JWT para consumir rotas protegidas.

**Atores:** usuário registrado; API de autenticação; middleware JWT.

**Fluxo principal:**

1. Usuário informa email e senha.
2. Frontend envia `POST /api/v1/auth/login`.
3. Controller valida payload mínimo.
4. Service busca usuário por email.
5. Service compara senha enviada com hash persistido.
6. API assina JWT com identificador do usuário.
7. Frontend armazena token e redireciona para dashboard.

**Fluxos alternativos:**

- Email inexistente ou senha inválida retorna `401` com mensagem genérica.
- Payload incompleto retorna `400`.
- Erro interno de banco retorna `500` e deve ser logado.

**Critérios de aceite:**

- Token deve permitir acesso a `/dashboard`, `/transactions`, `/goals`, `/ranking` e `/categories/custom`.
- A resposta não pode revelar se o email existe.
- Nenhuma senha em texto puro pode ser persistida ou logada.

### RF002 - Registro de usuário

**Contexto:** Identity & Access
**Status:** Implementado
**Endpoint:** `POST /api/v1/auth/register`
**Tabelas:** `users`, `user_scores`

**Objetivo:** criar nova conta e preparar o usuário para os demais módulos.

**Fluxo principal:**

1. Visitante informa nome, email e senha.
2. API valida obrigatoriedade e formato de email.
3. Sistema verifica unicidade em `users.email`.
4. Senha e convertida para hash.
5. Registro e criado em `users`.
6. Perfil inicial de gamificação deve ser criado em `user_scores`.
7. API retorna usuário e token.

**Fluxos alternativos:**

- Email duplicado retorna `409`.
- Senha fraca ou payload incompleto retorna `400`.
- Falha ao inicializar score deve impedir registro parcial ou ser tratada como pendencia transacional.

**Critérios de aceite:**

- Usuário novo inicia com `total_score = 0`, `level = 1`, `league = Bronze`.
- Email fica Único.
- Registro deve ser rastreavel em logs de erro, sem vazar senha.

### RF003 - Cadastro de transação financeira

**Contexto:** Financial Core
**Status:** Implementado
**Endpoint:** `POST /api/v1/transactions`
**Tabela:** `transactions`
**CSU:** CSU03

**Objetivo:** registrar receitas e despesas como base de analytics, metas e gamificação.

**Fluxo principal:**

1. Usuário abre formulário de transação.
2. Informa tipo, valor, descrição, categoria e data.
3. Opcionalmente informa observação e meta vinculada.
4. Frontend envia payload autenticado.
5. Middleware injeta `userId`.
6. Service valida `amount > 0`, tipo permitido e categoria.
7. Registro e persistido em `transactions`.
8. Sistema disponibiliza a nova transação para dashboard e ranking.

**Fluxos alternativos:**

- Valor menor ou igual a zero retorna `400`.
- Categoria ausente retorna `400`.
- Meta vinculada inexistente retorna `404` ou `409`, conforme regra aplicada.

**Critérios de aceite:**

- Toda transação pertence ao usuário autenticado.
- Datas retroativas são aceitas.
- Transações futuras devem ter comportamento documentado antes de afetarem saldo corrente.

### RF004 - Consulta, filtros e paginação de transações

**Contexto:** Financial Core
**Status:** Implementado
**Endpoint:** `GET /api/v1/transactions`

**Objetivo:** permitir que o usuário encontre histórico financeiro por período, tipo, categoria, texto e paginação.

**Critérios de aceite:**

- Suportar filtros `type`, `category`, `dateFrom`, `dateTo` e `search`.
- Retornar metadados de página.
- Nunca retornar transações de outro usuário.
- Manter performance aceitável com índices por `user_id` e `date`.

### RF005 - Operações em lote

**Contexto:** Financial Core
**Status:** Implementado
**Endpoint:** `POST /api/v1/transactions/bulk`

**Objetivo:** executar ações massivas em transações selecionadas.

**Critérios de aceite:**

- Operação deve receber lista de IDs.
- Cada ID deve ser validado contra o usuário autenticado.
- Falhas parciais devem ser comunicadas no response.
- Operações que alteram saldo ou metas devem preservar integridade.

### RF006 - Metas de economia

**Contexto:** Financial Core
**Status:** Implementado
**Endpoints:** `/api/v1/goals/spending-goals` com `goalType = saving`

**Objetivo:** permitir que o usuário defina objetivos de acumulacao de dinheiro.

**Critérios de aceite:**

- Meta possui título, categoria, valor alvo, período, início, fim e status.
- Progresso pode ser atualizado diretamente ou por transação.
- Ao atingir o alvo, status pode mudar para `completed`.

### RF007 - Metas de gasto e budgets

**Contexto:** Financial Core
**Status:** Implementado
**Endpoints:** `/api/v1/goals/spending-goals`, `/api/v1/goals/budgets`

**Objetivo:** planejar teto de gastos e orçamento por período.

**Critérios de aceite:**

- Meta de gasto usa `goalType = spending`.
- Budget representa plano financeiro por período.
- Deve haver cálculo de gasto atual e restante.
- Estouro de limite deve ser sinalizado ao usuário.

### RF008 - Dashboard e analytics

**Contexto:** Analytics
**Status:** Implementado
**Endpoints:** `/api/v1/dashboard`, `/api/v1/dashboard/overview`, `/api/v1/dashboard/transactions`

**Objetivo:** consolidar indicadores financeiros para a tela principal.

**Critérios de aceite:**

- Exibir receitas, despesas, saldo e taxa de economia.
- Exibir histórico recente.
- Exibir distribuição por categoria.
- Consultas devem filtrar obrigatoriamente por `user_id`.

### RF009 - Onboarding e tour guiado

**Contexto:** Frontend Experience
**Status:** Implementado no frontend
**Código:** `FynxFront/src/tours`, `FynxFront/src/hooks/useTour.ts`

**Objetivo:** orientar novos usuários nas telas principais.

**Critérios de aceite:**

- Tours devem existir para dashboard, transações, metas e ranking.
- Usuário deve poder iniciar manualmente o tour.
- Estado de conclusão não deve bloquear uso da aplicação.

### RF010 - Engine de score

**Contexto:** Gamification
**Status:** Implementado
**Endpoints:** `/api/v1/ranking`, `/api/v1/ranking/score/:userId`

**Objetivo:** calcular score com base em comportamento financeiro, metas e consistência.

**Critérios de aceite:**

- Score deve ser derivado de dados financeiros do usuário.
- Alterações relevantes devem atualizar `user_scores`.
- Fórmula documentada em `MOTOR_DE_GAMIFICACAO.md` deve bater com `ranking.service.ts`.

### RF011 - Ranking e ligas

**Contexto:** Gamification
**Status:** Implementado
**Endpoints:** `/api/v1/ranking/leaderboard/*`

**Objetivo:** comparar usuários por score e liga.

**Critérios de aceite:**

- Ranking global deve retornar posição, usuário, score, nível, liga e tendência.
- Ranking por categoria deve separar critérios de economia, metas e consistência.
- Dados sensíveis do usuário não devem ser expostos.

### RF012 - Achievements e badges

**Contexto:** Gamification
**Status:** Implementado
**Endpoints:** `/api/v1/ranking/achievements/:userId`, `/api/v1/ranking/badges/:userId`

**Objetivo:** premiar marcos de uso e comportamento financeiro.

**Critérios de aceite:**

- O mesmo achievement/badge não pode ser concedido duas vezes ao mesmo usuário.
- Tabelas `user_achievements` e `user_badges` devem garantir unicidade.
- Catálogo deve ser semeado por `seed.ts`.

### RF013 - Categorias customizadas

**Contexto:** Financial Core
**Status:** Implementado
**Endpoint:** `/api/v1/categories/custom`

**Objetivo:** permitir que usuários criem categorias próprias de receita ou despesa.

**Fluxo principal:**

1. Usuário abre gerenciador de categorias.
2. Informa nome e tipo.
3. API valida duplicidade ativa por usuário.
4. Categoria e salva em `custom_categories`.
5. Categoria passa a aparecer nos formulários financeiros.

**Critérios de aceite:**

- Categoria customizada pertence a um Único usuário.
- Arquivamento deve preservar histórico quando usado.
- Categoria duplicada ativa deve retornar conflito.

### RF014 - Spending limits

**Contexto:** Financial Core
**Status:** Parcial
**Código:** `financial/spending-limits` existe, mas não Está registrado em `routes/index.ts`.

**Objetivo:** controlar limite de gasto por categoria.

**Lacunas atuais:**

- Rota central não registra `/spending-limits`.
- Não há tabela `spending_limits` em `schema.ts` ou `database.ts` no estado inspecionado.

**Critérios de aceite para concluir implementação:**

- Registrar rota no roteador central.
- Criar tabela física ou mapear para estrutura existente.
- Documentar regras de estouro, pausa e progresso.

### RF015 - Importacao/exportacao financeira

**Contexto:** Financial Core
**Status:** Planejado
**Base técnica:** tipos `TransactionImport` existem em `transactions.types.ts`, mas não há rota registrada.

**Objetivo:** permitir importacao de CSV, Excel ou OFX.

**Critérios de aceite futuros:**

- Validar mapeamento de colunas.
- Prevenir duplicidades.
- Gerar relatório de sucesso e falha.

### RF016 - Vinculação WhatsApp via OTP

**Contexto:** Omnichannel
**Status:** Planejado

**Objetivo:** associar número de WhatsApp a conta do usuário.

**Critérios de aceite futuros:**

- OTP de uso Único com expiração.
- Tentativas limitadas.
- Registro de auditoria de sucesso e falha.

### RF017 - Registro por linguagem natural

**Contexto:** Omnichannel
**Status:** Planejado

**Objetivo:** converter mensagens de texto/voz em transações financeiras.

**Critérios de aceite futuros:**

- Extrair valor, descrição, tipo, categoria e data.
- Confirmar antes de persistir.
- Reusar caso de uso de criação de transação.

### RF018 - Consultas e notificações proativas

**Contexto:** Omnichannel
**Status:** Planejado

**Objetivo:** responder consultas e enviar alertas de limite/meta.

**Critérios de aceite futuros:**

- Consultas devem respeitar autenticação e vinculação do número.
- Alertas devem evitar duplicidade.
- Logs de envio devem ser persistidos.

### RF019 - Auditoria de eventos criticos

**Contexto:** Admin & Audit
**Status:** Parcial/Planejado

**Objetivo:** rastrear ações sensíveis e falhas operacionais.

**Critérios de aceite:**

- Logs HTTP e erros devem existir para diagnostico.
- Mudancas de score, reset de temporada e exclusoes devem ser auditaveis.
- Tabela `audit_logs` deve ser criada se a auditoria for persistida no banco.

### RF020 - Gestão de temporadas de gamificação

**Contexto:** Gamification/Admin
**Status:** Implementado como endpoint sensível a revisar
**Endpoint:** `POST /api/v1/ranking/reset-season`

**Objetivo:** recalcular temporada e carry-over.

**Critérios de aceite:**

- Endpoint deve exigir permissão administrativa.
- Operação deve ser atômica.
- Deve gerar registro de auditoria.
- Deve preservar histórico ou documentar a ausencia dele.

---

## 4. Requisitos Não Funcionais

| ID | Categoria | Critério mensuravel | Verificação |
|---|---|---|---|
| RNF001 | Performance | Leituras comuns devem responder em até 300 ms em base local de desenvolvimento. | Teste de carga local e análise de query. |
| RNF002 | Segurança | Senhas devem ser persistidas como hash; rotas protegidas exigem JWT. | Revisão de auth service e middleware. |
| RNF003 | Isolamento multiusuário | Toda query de dado do usuário deve filtrar por `user_id`. | Revisão de services/repositories. |
| RNF004 | Manutenibilidade | Controllers devem delegar regra para services/use cases. | Revisão de arquitetura. |
| RNF005 | Persistência | Operações multi-etapa devem usar transação quando houver risco de estado parcial. | Revisão de `database.withTransaction`. |
| RNF006 | Observabilidade | Falhas HTTP, banco e performance devem ser logaveis. | Middlewares em `infrastructure/http/middlewares`. |
| RNF007 | UX responsiva | Telas principais devem funcionar em viewport mobile e desktop. | Testes manuais e automatizados no frontend. |
| RNF008 | Documentação viva | Mudanca em rota, schema ou RF exige atualização cruzada da Rev06. | Checklist documental. |

---

## 5. Regras de Negócio

### 5.1. Financeiro

| ID | Regra | Aplica-se a | Rastreabilidade |
|---|---|---|---|
| RN001 | Transação deve ter valor maior que zero. | Transactions | RF003, CSU03, `transactions` |
| RN002 | Toda transação deve pertencer ao usuário autenticado. | Transactions | RF003, RF004, PI007 |
| RN003 | Toda transação deve ter tipo `income` ou `expense`. | Transactions | RF003 |
| RN004 | Exclusão de transação vinculada a meta deve estornar progresso quando a implementação de vínculo estiver ativa. | Transactions, Goals | RF005, CSU de exclusão |
| RN005 | Categoria é obrigatória para transações. | Transactions, Categories | RF003, RF013 |
| RN006 | Meta concluída não deve ser alterada de forma que invalide histórico sem regra explícita de reabertura. | Goals | RF006, RF007 |
| RN007 | Budget deve calcular gasto acumulado e restante por período. | Goals/Budgets | RF007 |
| RN008 | Categoria customizada ativa não deve duplicar nome e tipo para o mesmo usuário. | Custom Categories | RF013 |

### 5.2. Gamificação

| ID | Regra | Aplica-se a | Rastreabilidade |
|---|---|---|---|
| RN009 | Score é derivado de comportamento financeiro e consistência. | Ranking | RF010 |
| RN010 | Usuário possui uma linha Única em `user_scores`. | Ranking | RF010, `user_scores.user_id UNIQUE` |
| RN011 | Badge e achievement não podem ser concedidos duas vezes ao mesmo usuário. | Badges/Achievements | RF012 |
| RN012 | Reset de temporada deve preservar regra de carry-over documentada ou declarar estratégia alternativa. | Ranking | RF020 |

### 5.3. Planejado e Governanca

| ID | Regra | Status | Rastreabilidade |
|---|---|---|---|
| RN013 | OTP de WhatsApp expira e tem tentativas limitadas. | Planejado | RF016 |
| RN014 | Registro por linguagem natural exige confirmação antes de salvar. | Planejado | RF017 |
| RN015 | Endpoint administrativo de reset não deve ficar aberto a qualquer usuário autenticado. | A revisar | RF020 |

---

## 6. Políticas de Integridade de Dados

| ID | Política | Estado atual |
|---|---|---|
| PI001 | `users.email` é único. | Implementado em `schema.ts`. |
| PI002 | `transactions.user_id` Referência `users.id`. | Implementado sem `ON DELETE CASCADE` explícito no schema atual. |
| PI003 | `user_scores.user_id` é único. | Implementado. |
| PI004 | `user_achievements` usa `UNIQUE(user_id, achievement_id)`. | Implementado. |
| PI005 | `user_badges` usa `UNIQUE(user_id, badge_id)`. | Implementado. |
| PI006 | `custom_categories` pertence a `user_id`. | Implementado em `database.ts`. |
| PI007 | Toda leitura/escrita multiusuário deve filtrar por `user_id`. | Obrigatório por requisito; validar em services. |
| PI008 | `spending_limits` precisa de modelo físico antes de ser considerado persistido. | Pendente. |

---

## 7. Matriz de Rastreabilidade

| Requisito | CSU | Endpoint | Tabela principal | Documento complementar |
|---|---|---|---|---|
| RF001 | CSU01 | `/auth/login` | `users` | `REFERENCIA_DA_API.md` |
| RF002 | CSU02 | `/auth/register` | `users`, `user_scores` | `BANCO_DE_DADOS.md` |
| RF003 | CSU03 | `/transactions` | `transactions` | `FLUXOS_E_CASOS_DE_USO.md` |
| RF004 | CSU07 | `/transactions`, `/dashboard` | `transactions` | `REFERENCIA_DA_API.md` |
| RF005 | CSU15 | `/transactions/bulk` | `transactions` | `REFERENCIA_DA_API.md` |
| RF006 | CSU05 | `/goals/spending-goals` | `spending_goals` | `BANCO_DE_DADOS.md` |
| RF007 | CSU04 | `/goals/budgets` | `budgets` | `BANCO_DE_DADOS.md` |
| RF010 | CSU08 | `/ranking/score/:userId` | `user_scores` | `MOTOR_DE_GAMIFICACAO.md` |
| RF012 | CSU08 | `/ranking/achievements/:userId`, `/ranking/badges/:userId` | `achievements`, `badges` | `MOTOR_DE_GAMIFICACAO.md` |
| RF013 | CSU13 | `/categories/custom` | `custom_categories` | `REFERENCIA_DA_API.md` |
| RF014 | CSU14 | Não registrado | Pendente | `REFERENCIA_DA_API.md` |
| RF016-RF018 | CSU09-CSU12 | Planejado | Planejado | `FLUXOS_E_CASOS_DE_USO.md` |

---

## 8. Glossario Técnico

| Termo | Definição |
|---|---|
| Bounded Context | Fronteira semântica e técnica de um domínio DDD. |
| JWT | Token assinado usado para autenticação stateless. |
| User Score | Linha de estado de gamificação em `user_scores`. |
| Spending Goal | Meta de controle de gasto armazenada em `spending_goals` com `goalType = spending`. |
| Saving Goal | Meta de acumulacao armazenada em `spending_goals` com `goalType = saving`. |
| Budget | Planejamento por período armazenado em `budgets`. |
| Custom Category | Categoria criada por usuário em `custom_categories`. |
| Spending Limit | Módulo parcial de limites por categoria; ainda precisa registro central e persistência física. |
| Achievement | Conquista catalogada em `achievements`. |
| Badge | Premio visual catalogado em `badges`. |
| Sad Path | Fluxo de exceção ou erro esperado. |
| Domain Event | Evento emitido por uma mudanca relevante no domínio. |
| Repository Pattern | Padrão que isola persistência concreta das regras de domínio. |
| Unit of Work | Padrão para agrupar mudancas em transação atômica. |
