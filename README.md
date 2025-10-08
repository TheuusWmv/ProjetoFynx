# FYNX – Plataforma de Gestão Financeira com Gamificação

![Logo FYNX](FynxV2/src/assets/FYNX%20CABRA%20SF.png)

FYNX é um software de gestão financeira pessoal com elementos de gamificação, criado para incentivar hábitos de economia e planejamento. A proposta é transformar o controle financeiro em uma experiência envolvente, com metas, ranking, ligas e conquistas que recompensam o progresso do usuário.

Este repositório centraliza o backend (`FynxApi`) e o frontend (`FynxV2`) da plataforma.

---

## Visão Geral

- Plataforma web moderna construída com React (frontend) e Node.js/Express (backend).
- Experiência de usuário rica com componentes UI acessíveis e responsivos.
- API organizada por módulos: dashboard, metas, transações, limites de gasto e ranking.
- Gamificação: ligas (Ferro → Diamante), pontos, badges, calendário de contribuições e leaderboard.

---

## Arquitetura do Repositório

```
ProjetoFynx/
├── FynxApi/          # Backend Node.js + Express
│   ├── src/
│   │   ├── routes/                      # Rotas principais da API
│   │   ├── modules/
│   │   │   ├── dashboard/              # Módulo de visão geral
│   │   │   ├── goals/                  # Metas e orçamentos
│   │   │   ├── ranking/                # Ranking e gamificação
│   │   │   ├── transactions/           # Transações (CRUD, filtros, stats)
│   │   │   └── spending-limits/        # Limites de gasto
│   │   └── server.ts                   # Entrada do servidor Express
│   ├── .env                            # Variáveis de ambiente (PORT, NODE_ENV)
│   ├── package.json                    # Scripts (dev/build/start)
│   └── tsconfig.json                   # Configuração TypeScript
│
└── FynxV2/            # Frontend React + Vite + TypeScript
    ├── src/
    │   ├── pages/                      # Páginas (Dashboard, Ranking, Goals, Login, 404)
    │   ├── components/                 # Layout, Sidebar, modais, UI (shadcn/ui)
    │   ├── lib/                        # `apiClient.ts` (cliente HTTP), utilitários
    │   ├── hooks/                      # Hooks (mobile, toast, etc.)
    │   └── assets/                     # Imagens (inclui a logo)
    ├── vite.config.ts                  # Porta do dev server e proxy para a API
    ├── tailwind.config.ts              # Tema e tokens de design
    └── package.json                    # Scripts (dev/build/preview)
```

---

## Backend (FynxApi)

- Servidor Express com CORS e JSON habilitados.
- Base da API: `http://localhost:<PORT>/api/v1`.
- Porta padrão: `3001` (configurável via `.env`).

### Entrypoint e Rotas

- `src/server.ts`
  - Lê `PORT` de `process.env.PORT` (fallback `3001`).
  - Monta as rotas em `app.use('/api/v1', routes)`.
- `src/routes/index.ts`
  - Agrupa módulos: `/dashboard`, `/goals`, `/ranking`, `/transactions`, `/spending-limits`.

### Módulos principais

- `dashboard`: visão geral e histórico de transações.
- `goals`: metas de gasto e orçamentos (CRUD, progresso).
- `transactions`: CRUD de transações, filtros, paginação e estatísticas.
- `ranking`: leaderboard global/amigos, pontuação do usuário, badges e conquistas.
- `spending-limits`: limites de gasto por categoria.

### Exemplos de Endpoints

- `GET /api/v1/dashboard`
- `GET /api/v1/goals`
- `POST /api/v1/goals/spending-goals`
- `GET /api/v1/transactions?type=expense&limit=10`
- `GET /api/v1/ranking/leaderboard/global`

---

## Frontend (FynxV2)

- SPA em React + Vite + TypeScript.
- UI com shadcn/ui (Radix UI + TailwindCSS) e TanStack Query para dados.
- Dev server padrão: `http://localhost:5173`.
- Proxy para backend já configurado.

### Roteamento

- `"/" →` redireciona para `"/login"`.
- `"/dashboard" →` visão geral financeira.
- `"/ranking" →` gamificação (ligas, leaderboard, progresso).
- `"/goals" →` metas e orçamentos.
- `"*" →` 404.

### Cliente HTTP

- `src/lib/apiClient.ts`
  - `BASE_URL = "/api/v1"` (assume proxy do Vite em desenvolvimento).
  - Métodos: `get`, `post`, `put`, `patch`, `delete` usando `fetch`.

---

## Setup e Execução Local

### Pré‑requisitos

- Node.js 18+ e npm (ou pnpm/yarn).

### 1) Backend – FynxApi

1. Vá para o backend: `cd ProjetoFynx/FynxApi`
2. Instale dependências: `npm install`
3. Configure o `.env` (crie/edite):
   - `PORT=3001`
   - `NODE_ENV=development`
4. Execute em desenvolvimento (TypeScript com watch): `npm run dev`
   - Alternativa produção: `npm run build` seguido de `npm run start`

Servidor disponível em `http://localhost:3001`.

### 2) Frontend – FynxV2

1. Vá para o frontend: `cd ProjetoFynx/FynxV2`
2. Instale dependências: `npm install`
3. Execute o dev server: `npm run dev`
4. Acesse `http://localhost:5173`

O frontend está configurado para chamar o backend via proxy (`/api → http://localhost:3001`).

---

## Alterando Portas e URLs

### Backend (porta da API)

- Arquivo: `FynxApi/.env`
  - Ajuste `PORT=<nova_porta>`.
- Alternativa direta: `FynxApi/src/server.ts` (const `PORT`).

### Frontend (porta do dev server e proxy)

- Arquivo: `FynxV2/vite.config.ts`
  - `server.port`: porta do Vite (padrão `5173`).
  - `server.proxy["/api"].target`: URL do backend (padrão `http://localhost:3001`).

### Cliente HTTP (quando NÃO usar proxy)

- Arquivo: `FynxV2/src/lib/apiClient.ts`
  - Troque `BASE_URL = "/api/v1"` por `BASE_URL = "http://localhost:<PORTA_API>/api/v1"`.
  - Use essa abordagem se preferir chamadas diretas sem proxy.

---

## Comandos úteis

- Backend
  - `npm run dev` → inicia servidor com `ts-node` e watch.
  - `npm run build` → compila para `dist/`.
  - `npm run start` → executa `dist/server.js`.

- Frontend
  - `npm run dev` → inicia Vite em `localhost:5173`.
  - `npm run build` → build de produção.
  - `npm run preview` → serve o build para checagem local.

---

## Dicas e Solução de Problemas

- Conflito de portas: se `5173` ou `3001` estiverem ocupadas, ajuste conforme seção acima.
- CORS: o backend já utiliza `cors()`. Com proxy do Vite, as chamadas funcionam de forma transparente.
- Variáveis de ambiente: garanta que `FynxApi/.env` exista antes de executar `npm run dev`.

---

## Objetivo e Diferenciais

- Incentivar a economia e a educação financeira com feedbacks visuais e recompensas.
- Transformar o controle de gastos em uma jornada com metas, progresso e competição saudável.

---

## Créditos

Desenvolvido como parte da disciplina de Práticas Interdisciplinares da UEG.

---

## Frontend – Detalhes e Funcionalidades

### Páginas Principais

- `Index.tsx` (Dashboard)
  - Cards de resumo: saldo total, receitas mensais, despesas mensais, taxa de poupança.
  - Lista de transações recentes com status e categoria.
  - Portfólio de investimentos (Ações, Títulos, Dinheiro).
  - Ações rápidas: adicionar transação, transferir, definir metas, relatórios.

- `Goal.tsx` (Metas)
  - Criação e acompanhamento de metas financeiras com barras de progresso.
  - Exemplos: Viagem para Europa, Carro Novo, Casa Própria.
  - Integração com `CreateGoalSheet` e `AddTransactionSheet`.

- `Ranking.tsx` (Gamificação)
  - Ligas: Ferro, Bronze, Prata, Ouro, Diamante.
  - Leaderboard global e de amigos, posição e pontos do usuário.
  - Calendário de contribuições estilo GitHub, progresso até próxima liga.

- `NotFound.tsx` (404)
  - Página de erro para rotas inexistentes.

### Componentes Essenciais

- `Layout.tsx`
  - Estrutura base com header, sidebar e área principal.
  - `SidebarProvider` para controle de navegação responsiva.

- `AppSidebar.tsx`
  - Navegação para Dashboard, Ranking, Goals e Settings.
  - Suporte a estado responsivo e destaque da página ativa.

- `AddTransactionSheet.tsx`
  - Modal para adicionar transações com descrição, tipo (receita/despesa), valor, categoria, recorrência e meta relacionada.

- `CreateGoalSheet.tsx`
  - Modal para criar metas com nome, objetivo financeiro e descrição.

### Stack Tecnológica (Frontend)

- React 18 + TypeScript, Vite 5 (dev server/build), TailwindCSS.
- UI: Radix UI + shadcn/ui, ícones `lucide-react`.
- Estado de dados: TanStack React Query.
- Formulários: React Hook Form + Zod.
- Visualizações: Recharts, calendário de contribuições.
- Notificações: Sonner e Radix Toast.

### Scripts (Frontend)

- `npm run dev` → inicia servidor de desenvolvimento (Vite).
- `npm run build` → build de produção.
- `npm run build:dev` → build em modo desenvolvimento.
- `npm run preview` → serve o build de produção localmente.
- `npm run lint` → executa ESLint.

### Sistema de Design e Responsividade

- Tokens de design via CSS custom properties; tema claro/escuro com `next-themes`.
- Componentes acessíveis (Radix UI) combinados com utilitários Tailwind.
- Layout mobile-first; sidebar colapsável; grids responsivos.

### Fluxo de Dados

- Estado local: hooks React e `react-hook-form` para formulários.
- Estado servidor: `@tanstack/react-query` com cache, revalidação e sincronização.
- Validação: `zod` para schemas e feedback em tempo real.

### Roteamento

```
Routes:
├── "/" → redireciona para "/login"
├── "/dashboard" → Index (Dashboard)
├── "/ranking" → Ranking
├── "/goals" → Goal
└── "*" → NotFound (404)
```

---

## Dependências Principais (Resumo)

- Produção
  - `react`, `react-dom`, `react-router-dom`
  - `@radix-ui/*`, `shadcn/ui`, `tailwindcss`, `tailwindcss-animate`, `lucide-react`
  - `@tanstack/react-query`, `react-hook-form`, `zod`
  - `recharts`, `react-github-contribution-calendar`, `date-fns`, `sonner`

- Desenvolvimento
  - `vite`, `@vitejs/plugin-react-swc`, `typescript`
  - `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
  - `postcss`, `autoprefixer`

---

## Funcionalidades Futuras

- Integração com APIs bancárias.
- Relatórios avançados e exportação.
- Notificações push e modo offline.
- Sincronização multi-dispositivo.
- Sistema de conquistas expandido.

---

## API do Backend (Resumo)

- Base: `http://localhost:3001/api/v1`
- Formato: `application/json`
- Autenticação: não aplicável no protótipo atual (dados mockados/serviço in-memory)

### Módulo Dashboard
- `GET /dashboard` → dados agregados do painel.
- `POST /dashboard/transactions` → adiciona transação (atalho do dashboard).
- `GET /dashboard/transactions` → histórico de transações do dashboard.

### Módulo Transactions
- `GET /transactions` → lista transações com filtros e paginação.
  - Query: `userId`, `page`, `limit`, `type` (`income|expense|all`), `category`, `subcategory`, `paymentMethod`, `dateFrom`, `dateTo`, `amountMin`, `amountMax`, `search`, `tags` (CSV).
- `GET /transactions/categories` → categorias disponíveis.
- `GET /transactions/summary` → resumo (totais, receitas, despesas, etc.).
- `GET /transactions/stats` → estatísticas (médias, mais cara, breakdown por método).
- `GET /transactions/:id` → detalhe da transação.
- `POST /transactions` → cria transação.
- `POST /transactions/bulk` → operações em lote.
- `PUT /transactions/:id` → atualiza transação.
- `DELETE /transactions/:id` → remove transação.

### Módulo Goals
- `GET /goals` → visão geral (metas + budgets + progresso).
- `GET /goals/spending-goals` → lista metas de gasto.
- `GET /goals/spending-goals/:id` → detalhe da meta.
- `POST /goals/spending-goals` → cria meta de gasto.
- `PUT /goals/spending-goals/:id` → atualiza meta.
- `DELETE /goals/spending-goals/:id` → remove meta.
- `PATCH /goals/spending-goals/:id/progress` → atualiza progresso da meta.
- `PATCH /goals/spending-goals/:id/progress-transaction` → atualiza progresso via transação.
- `GET /goals/budgets` → lista budgets.
- `GET /goals/budgets/:id` → detalhe de budget.
- `POST /goals/budgets` → cria budget.
- `PUT /goals/budgets/:id` → atualiza budget.
- `DELETE /goals/budgets/:id` → remove budget.
- `PATCH /goals/budgets/:id/spending` → atualiza gasto do budget.

### Módulo Spending Limits
- `GET /spending-limits` → lista limites de gasto.
- `GET /spending-limits/:id` → detalhe do limite.
- `GET /spending-limits/category/:category` → busca por categoria.
- `POST /spending-limits` → cria limite.
- `PUT /spending-limits/:id` → atualiza limite.
- `PATCH /spending-limits/:id/progress` → atualiza progresso (registrar despesa).
- `DELETE /spending-limits/:id` → remove limite.
- `GET /spending-limits/categories/list` → lista de categorias suportadas.

### Módulo Ranking
- `GET /ranking` → dados completos do ranking.
- `GET /ranking/leaderboard/global` → leaderboard global.
- `GET /ranking/leaderboard/friends` → leaderboard de amigos (`userId` via query opcional).
- `GET /ranking/leaderboard/categories` → leaderboards por categoria.
- `GET /ranking/user/:userId` → ranking de um usuário.
- `GET /ranking/score/:userId` → cálculo do score do usuário.
- `PUT /ranking/score/:userId` → atualiza score do usuário.
- `GET /ranking/achievements/:userId` → conquistas do usuário.
- `GET /ranking/badges/:userId` → badges do usuário.

---

## Exemplos de Requisição

### cURL
- `GET` transações com filtros:
  - `curl "http://localhost:3001/api/v1/transactions?userId=user1&type=expense&category=Food&page=1&limit=10"`

- `POST` criar transação:
  - `curl -X POST http://localhost:3001/api/v1/transactions -H "Content-Type: application/json" -d '{
    "type":"expense",
    "amount": 120.5,
    "description":"Almoço",
    "category":"Food",
    "subcategory":"Lunch",
    "date":"2025-10-01",
    "paymentMethod":"credit_card",
    "tags":["restaurant","work"],
    "notes":"Cliente",
    "recurring": {"isRecurring": false }
  }'`

- `PATCH` progresso de limite de gasto:
  - `curl -X PATCH http://localhost:3001/api/v1/spending-limits/limit-001/progress -H "Content-Type: application/json" -d '{
    "amount": 85.0,
    "date": "2025-10-02",
    "category": "Food"
  }'`

- `GET` leaderboard global:
  - `curl "http://localhost:3001/api/v1/ranking/leaderboard/global"`

### Fetch (Frontend)

- `GET` categorias de transações:
  - ```ts
    const res = await fetch('/api/v1/transactions/categories');
    const data = await res.json();
    ```

- `POST` criar transação:
  - ```ts
    await fetch('/api/v1/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'income',
        amount: 1500,
        description: 'Salário',
        category: 'Salary',
        date: new Date().toISOString(),
        paymentMethod: 'bank_transfer'
      })
    });
    ```

- `PATCH` progresso de meta:
  - ```ts
    await fetch('/api/v1/goals/spending-goals/meta-001/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 200 })
    });
    ```
