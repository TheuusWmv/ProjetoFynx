# Arquitetura e Engenharia de Software - FYNX Rev. 06

> Documento arquitetural da Rev06. Descreve a migração de um desenho MVC/transaction script para uma organização orientada a domínios, com status explícito do que já está implementado e do que ainda e evolução planejada.

---

## 1. Visão Macro

O backend `FynxApi` está organizado por domínios, com separação entre:

- `domains`: controllers, routes, services, types e elementos de domínio por contexto.
- `application`: use cases específicos já iniciados para operações financeiras.
- `infrastructure`: Express, banco, repositórios concretos, container e middlewares.
- `shared`: primitivas de domínio, configurações, constantes e utilitários.

A Rev06 adota DDD de forma incremental. O projeto já tem bounded contexts e algumas entidades/value objects, mas ainda possui services de domínio que acessam infraestrutura diretamente em alguns pontos. Portanto, a arquitetura deve ser lida como **DDD em consolidação**, não como Clean Architecture pura totalmente finalizada.

### 1.1. Arquitetura do Sistema Exigida na Entrega

| Item acadêmico | Definição Rev06 |
|---|---|
| Tipo de sistema | Sistema web SPA com frontend React e backend API REST. |
| Modelo de distribuição | Cliente-servidor. O navegador consome a API via HTTP/JSON. |
| Camadas | Interface, HTTP/middleware, controllers, services/use cases, domínio, persistência. |
| API | Express com prefixo global `/api/v1`. |
| Banco de dados | SQLite local inicializado por `database.ts`; schema documentado em `BANCO_DE_DADOS.md`. |
| Integrações externas | WhatsApp/IA planejados; não há rota produtiva registrada. |
| Autenticação | JWT Bearer em rotas protegidas. |
| Criptografia | Senhas com hash bcrypt; transporte seguro por HTTPS deve ser exigido em ambiente publicado. |

```mermaid
flowchart LR
    U[Usuário no Navegador] --> FE[Frontend React/Vite]
    FE --> API[API REST Express /api/v1]
    API --> MW[Middlewares Auth/Logs]
    MW --> CT[Controllers]
    CT --> SV[Services e Use Cases]
    SV --> DM[Domínio: Entidades, VOs, Eventos]
    SV --> RP[Repositories/Database Adapter]
    RP --> DB[(SQLite)]
```

---

## 2. Bounded Contexts

| Contexto | Responsabilidade | Arquivos principais | Status |
|---|---|---|---|
| Identity & Access | Registro, login e JWT. | `domains/identity/auth/*`, `http/middleware/auth.middleware.ts` | Implementado |
| Financial Core | Transações, metas, budgets, categorias customizadas e limites. | `domains/financial/*`, `application/financial/*` | Implementado com lacuna em spending limits |
| Analytics | Dados agregados para dashboard. | `domains/analytics/dashboard/*` | Implementado |
| Gamification | Ranking, score, ligas, achievements e badges. | `domains/gamification/*` | Implementado |
| Infrastructure | HTTP, banco, logs e repositórios concretos. | `infrastructure/*` | Implementado |
| Omnichannel | WhatsApp, NLP e notificações. | Sem módulo produtivo registrado | Planejado |

---

## 3. Regra de Dependencia

A diretriz desejada e:

```text
HTTP/DB/Frameworks -> Application -> Domain
```

Na prática atual:

- controllers e routes estão dentro de cada domínio;
- services executam boa parte da regra de aplicação;
- `application/financial` possui use cases para criação e deleção de transações;
- repositories concretos SQLite ficam em `infrastructure/repositories`;
- primitivas reutilizáveis ficam em `shared/domain`.

**Diretriz de evolução:** novos fluxos complexos devem preferir use cases em `application`, mantendo controllers finos e reduzindo SQL dentro de services de domínio.

---

## 4. Topologia Real da Codebase

```text
FynxApi/src/
â”œâ”€â”€ application/
â”‚   â””â”€â”€ financial/
â”‚       â”œâ”€â”€ create-transaction.usecase.ts
â”‚       â””â”€â”€ delete-transaction.usecase.ts
â”œâ”€â”€ domains/
â”‚   â”œâ”€â”€ analytics/dashboard/
â”‚   â”‚   â”œâ”€â”€ dashboard.controller.ts
â”‚   â”‚   â”œâ”€â”€ dashboard.routes.ts
â”‚   â”‚   â”œâ”€â”€ dashboard.service.ts
â”‚   â”‚   â”œâ”€â”€ dashboard.types.ts
â”‚   â”‚   â””â”€â”€ config/dashboard.config.ts
â”‚   â”œâ”€â”€ financial/
â”‚   â”‚   â”œâ”€â”€ custom-categories/
â”‚   â”‚   â”œâ”€â”€ entities/
â”‚   â”‚   â”œâ”€â”€ events/
â”‚   â”‚   â”œâ”€â”€ goals/
â”‚   â”‚   â”œâ”€â”€ repositories/
â”‚   â”‚   â”œâ”€â”€ spending-limits/
â”‚   â”‚   â”œâ”€â”€ transactions/
â”‚   â”‚   â””â”€â”€ value-objects/
â”‚   â”œâ”€â”€ gamification/
â”‚   â”‚   â”œâ”€â”€ events/
â”‚   â”‚   â”œâ”€â”€ handlers/
â”‚   â”‚   â”œâ”€â”€ ranking/
â”‚   â”‚   â”œâ”€â”€ repositories/
â”‚   â”‚   â””â”€â”€ value-objects/
â”‚   â””â”€â”€ identity/auth/
â”œâ”€â”€ infrastructure/
â”‚   â”œâ”€â”€ container.ts
â”‚   â”œâ”€â”€ database/
â”‚   â”‚   â”œâ”€â”€ database.ts
â”‚   â”‚   â”œâ”€â”€ schema.ts
â”‚   â”‚   â””â”€â”€ seed.ts
â”‚   â”œâ”€â”€ http/
â”‚   â”‚   â”œâ”€â”€ middleware/auth.middleware.ts
â”‚   â”‚   â”œâ”€â”€ middlewares/
â”‚   â”‚   â”œâ”€â”€ routes/index.ts
â”‚   â”‚   â””â”€â”€ server.ts
â”‚   â””â”€â”€ repositories/
â”‚       â”œâ”€â”€ sqlite-category.repository.ts
â”‚       â”œâ”€â”€ sqlite-score.repository.ts
â”‚       â””â”€â”€ sqlite-transaction.repository.ts
â””â”€â”€ shared/
    â”œâ”€â”€ config/
    â”œâ”€â”€ constants/
    â”œâ”€â”€ domain/
    â”œâ”€â”€ infrastructure/
    â””â”€â”€ utils/
```

### 4.1. Responsabilidade por pasta

| Pasta | Responsabilidade | Observação |
|---|---|---|
| `application/financial` | Orquestração de casos de uso financeiros. | Ainda não cobre todos os fluxos. |
| `domains/*/*.routes.ts` | Definição de endpoints por contexto. | Registro final ocorre em `routes/index.ts`. |
| `domains/*/*.controller.ts` | Adaptação HTTP para service. | Deve permanecer fino. |
| `domains/*/*.service.ts` | Regra de aplicação/domínio. | Alguns services ainda acessam banco diretamente. |
| `domains/*/*.types.ts` | Contratos TypeScript. | Nem todo campo existe fisicamente no banco. |
| `domains/financial/entities` | Entidades ricas iniciadas. | `SavingGoal`, `SpendingLimit`. |
| `domains/financial/value-objects` | Objetos de valor financeiros. | `Money`, `TransactionType`. |
| `domains/gamification/value-objects` | Objetos de valor de gamificação. | `Score`, `League`. |
| `infrastructure/database` | SQLite, schema, migrations e seed. | Fonte da verdade física. |
| `infrastructure/http/routes/index.ts` | Roteador central. | Define o que está exposto em `/api/v1`. |
| `shared/domain` | Primitivas DDD reutilizáveis. | `Entity`, `ValueObject`, `AggregateRoot`, `DomainError`. |

---

## 5. Rotas Expostas

| Prefixo | Registro central | Status |
|---|---|---|
| `/auth` | Sim | Implementado |
| `/dashboard` | Sim | Implementado |
| `/goals` | Sim | Implementado |
| `/transactions` | Sim | Implementado |
| `/ranking` | Sim | Implementado |
| `/categories/custom` | Sim | Implementado |
| `/spending-limits` | Não | Parcial |
| `/webhooks/whatsapp` | Não | Planejado |

Essa tabela é obrigatória para evitar documentar uma rota como produtiva apenas porque existe arquivo `*.routes.ts`.

---

## 6. Fluxo de Requisição

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant RT as Express Route
    participant MW as Auth Middleware
    participant CT as Controller
    participant SV as Service/UseCase
    participant DB as Database/Repository

    FE->>RT: Request HTTP /api/v1/*
    RT->>MW: Aplica autenticação quando protegida
    MW->>CT: Injeta userId
    CT->>SV: Chama operação de aplicação
    SV->>SV: Aplica regras e validações
    SV->>DB: Consulta ou persiste
    DB-->>SV: Resultado
    SV-->>CT: DTO
    CT-->>FE: Response JSON
```

---

## 7. Patterns Implementados

| Pattern | Onde aparece | Status | Observação |
|---|---|---|---|
| Bounded Context | `domains/identity`, `financial`, `analytics`, `gamification` | Implementado | Organização por domínio. |
| Repository Pattern | Interfaces em `domains/*/repositories`, concretos em `infrastructure/repositories` | Parcial | Nem todos os services usam repository abstrato. |
| Use Case | `application/financial/*.usecase.ts` | Parcial | Deve expandir para fluxos complexos. |
| Entity/Value Object | `shared/domain`, `domains/financial/entities`, `value-objects` | Implementado parcial | Nem todo domínio usa entidades ricas. |
| Event Bus / Domain Events | `shared/infrastructure/event-bus.ts`, eventos em `domains/*/events` | Parcial | Documentar apenas onde usado de fato. |
| Middleware | `infrastructure/http/middleware*` | Implementado | Auth, logs e performance. |

---

## 8. Mapeamento de Responsabilidades

| Módulo | Controller | Service | Type/Entity | Persistência |
|---|---|---|---|---|
| Auth | `auth.controller.ts` | `auth.service.ts` | - | `users` |
| Transactions | `transactions.controller.ts` | `transactions.service.ts` | `transactions.types.ts`, use cases financeiros | `transactions` |
| Goals | `goals.controller.ts` | `goals.service.ts` | `goals.types.ts`, `SavingGoal` | `spending_goals`, `budgets` |
| Custom Categories | `customCategories.controller.ts` | `customCategories.service.ts` | `customCategories.types.ts` | `custom_categories` |
| Spending Limits | `spending-limits.controller.ts` | `spending-limits.service.ts` | `spending-limits.types.ts`, `SpendingLimit` | Persistência pendente |
| Dashboard | `dashboard.controller.ts` | `dashboard.service.ts` | `dashboard.types.ts` | read model sobre `transactions` |
| Ranking | `ranking.controller.ts` | `ranking.service.ts` | `ranking.types.ts`, `Score`, `League` | `user_scores`, `achievements`, `badges` |

### 8.1. Especificação dos Módulos do Sistema

| Módulo | Objetivo | Funcionalidades | Entradas | Saídas | Regras principais |
|---|---|---|---|---|---|
| Auth | Controlar acesso | Registro e login | Nome, email, senha | JWT e usuário público | Email Único, senha com hash |
| Transactions | Registrar movimentações | CRUD, filtros, bulk, stats | Valor, tipo, categoria, data | Transação e agregados | Valor positivo, ownership |
| Goals/Budgets | Planejar metas | Metas de gasto/economia, budgets, progresso | Valor alvo, período, categoria | Meta/budget | Status e período válidos |
| Dashboard | Consolidar dados | Overview, histórico, gráficos | Usuário autenticado | DTO de dashboard | Filtrar por `user_id` |
| Ranking | Gamificar uso | Score, ligas, leaderboards, badges | Usuário e eventos financeiros | Ranking e progresso | Anti-manipulação e auditoria futura |
| Custom Categories | Personalizar classificacao | CRUD e archive | Nome e tipo | Categoria | Duplicidade por usuário |
| Spending Limits | Limitar gastos | CRUD e progresso esperado | Limite, categoria, período | Limite | Parcial até expor rota e tabela |
| WhatsApp/IA | Entrada conversacional | OTP, NLP, notificações | Telefone e mensagem | Comando/alerta | Planejado |

---

## 9. Diagrama de Classes UML Nível Projeto

O diagrama abaixo representa a arquitetura de projeto atual com controllers, services, entidades/value objects e persistência.

```mermaid
classDiagram
    class AuthController {
      +register(req, res)
      +login(req, res)
    }
    class AuthService {
      +register(data)
      +login(email, password)
    }
    class TransactionsController {
      +getTransactions(req, res)
      +createTransaction(req, res)
      +updateTransaction(req, res)
      +deleteTransaction(req, res)
    }
    class TransactionsService {
      +getTransactions(userId, query)
      +createTransaction(userId, data)
      +updateTransaction(userId, id, data)
      +deleteTransaction(userId, id)
    }
    class GoalsController {
      +getSpendingGoals(req, res)
      +createSpendingGoal(req, res)
      +updateGoalProgress(req, res)
      +getBudgets(req, res)
    }
    class GoalsService {
      +createSpendingGoal(userId, data)
      +updateSpendingGoal(userId, id, data)
      +createBudget(userId, data)
    }
    class RankingController {
      +getRankingData(req, res)
      +getGlobalLeaderboard(req, res)
      +updateUserScore(req, res)
      +resetSeason(req, res)
    }
    class RankingService {
      +calculateUserScore(userId)
      +getGlobalLeaderboard()
      +getUserBadges(userId)
      +resetSeason()
    }
    class DashboardController {
      +getDashboardData(req, res)
      +getOverviewData(req, res)
    }
    class DashboardService {
      +getDashboardData(userId)
      +getOverviewData(userId)
    }
    class SavingGoal {
      +id
      +targetAmount
      +currentAmount
      +status
    }
    class SpendingLimit {
      +id
      +category
      +limitAmount
      +currentSpent
      +status
    }
    class Money {
      +amount
      +currency
      +add()
      +subtract()
    }
    class Score {
      +value
      +add()
    }
    class League {
      +name
      +minScore
    }
    class Database {
      +run(sql, params)
      +get(sql, params)
      +all(sql, params)
    }

    AuthController --> AuthService
    TransactionsController --> TransactionsService
    GoalsController --> GoalsService
    RankingController --> RankingService
    DashboardController --> DashboardService
    TransactionsService --> Money
    GoalsService --> SavingGoal
    GoalsService --> SpendingLimit
    RankingService --> Score
    RankingService --> League
    AuthService --> Database
    TransactionsService --> Database
    GoalsService --> Database
    DashboardService --> Database
    RankingService --> Database
```

Imagem legada disponível: `imagens/DC-WppClasses.svg`. Como ela É ligada ao WhatsApp, deve ser tratada como Referência histórica/planejada até o módulo Omnichannel existir no código.

---

## 10. Diagramas de Sequência / Comunicação

### 10.1. Login com JWT

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant FE as Frontend
    participant CT as AuthController
    participant SV as AuthService
    participant DB as SQLite

    U->>FE: Envia email e senha
    FE->>CT: POST /api/v1/auth/login
    CT->>SV: login(email, password)
    SV->>DB: Busca usuário por email
    DB-->>SV: Usuário com hash
    SV->>SV: Valida bcrypt e gera JWT
    SV-->>CT: Token + usuário público
    CT-->>FE: 200 OK
```

### 10.2. Cadastro de transação

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant FE as Frontend
    participant MW as AuthMiddleware
    participant CT as TransactionsController
    participant SV as TransactionsService
    participant DB as SQLite

    U->>FE: Preenche formulário
    FE->>MW: POST /api/v1/transactions
    MW->>MW: Valida JWT
    MW->>CT: Request com userId
    CT->>SV: createTransaction(userId, body)
    SV->>SV: Valida regras financeiras
    SV->>DB: INSERT transactions
    DB-->>SV: Registro criado
    SV-->>CT: DTO
    CT-->>FE: 201 Created
```

---

## 11. ADRs

### ADR-001 - SQLite no ambiente atual

**Status:** Aceito
**Contexto:** projeto precisa rodar localmente com baixa fricção.
**Decisão:** usar SQLite e inicializar banco via `database.ts`.
**Alternativas descartadas:** PostgreSQL local obrigatório, Supabase como Única fonte.
**Consequências:** setup simples; exige cuidado com concorrencia e migrations.

### ADR-002 - JWT stateless

**Status:** Aceito
**Contexto:** API precisa proteger rotas sem manter sessão em memória.
**Decisão:** usar JWT no header Bearer.
**Alternativas descartadas:** sessão server-side.
**Consequências:** backend fica simples; revogação imediata de token exige estratégia adicional.

### ADR-003 - Documentação híbrida DDD + clássica

**Status:** Aceito
**Contexto:** Rev05 era completa, mas monolitica; Rev06 ficou modular, mas perdeu cobertura.
**Decisão:** manter arquivos tematicos e adicionar rastreabilidade clássica.
**Consequências:** melhor manutenção; exige links cruzados consistentes.

### ADR-004 - Separar implementado, parcial e planejado

**Status:** Aceito
**Contexto:** havia conteúdo WhatsApp, audit e spending limits documentado como ativo sem schema/rota central.
**Decisão:** todo recurso deve carregar status explícito.
**Consequências:** documentação fica mais confiável e evita promessa falsa.

### ADR-005 - Consolidar Use Cases progressivamente

**Status:** Proposto
**Contexto:** alguns services ainda concentram orquestração e acesso a dados.
**Decisão:** novos fluxos complexos devem ir para `application/*`.
**Consequências:** refatoração incremental sem quebrar endpoints existentes.

---

## 12. Riscos Arquiteturais

| Risco | Impacto | Mitigação |
|---|---|---|
| Rota existe no domínio mas não no roteador central. | Documentação ou frontend chama endpoint inexistente. | Validar sempre `routes/index.ts`. |
| Tipos TS mais ricos que schema físico. | API promete campos não persistidos. | Marcar divergencia em `BANCO_DE_DADOS.md`. |
| Services acessam banco diretamente. | Testes e substituicao de persistência ficam mais difíceis. | Mover fluxos para use cases/repositories. |
| Endpoints administrativos sem autorização forte. | Risco de manipulação de ranking. | Criar middleware de papel/admin. |
| Recursos planejados misturados com implementados. | Perda de confiança documental. | Usar status obrigatório. |


