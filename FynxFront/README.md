# 🐐 Fynx - Dashboard Financeiro

![Fynx Logo](src/assets/FYNX%20CABRA%20SF.png)

## 📋 Visão Geral

Fynx é uma plataforma completa de gestão financeira com gamificação e ranking, desenvolvida em React com TypeScript. O projeto oferece uma interface moderna e intuitiva para controle de finanças pessoais, incluindo metas financeiras, transações e um sistema de ranking competitivo.

## 🏗️ Arquitetura do Projeto

### Stack Tecnológica

- **Frontend**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 5.4.19
- **Styling**: TailwindCSS + Tailwind Animate
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router DOM 6.30.1
- **State Management**: TanStack React Query 5.83.0
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts 2.15.4
- **Icons**: Lucide React
- **Notifications**: Sonner + Radix Toast

## 📁 Estrutura de Arquivos

```
FynxFront/
├── 📄 Arquivos de Configuração
│   ├── .gitattributes
│   ├── .gitignore
│   ├── README.md
│   ├── bun.lockb
│   ├── components.json          # Configuração shadcn/ui
│   ├── eslint.config.js         # Configuração ESLint
│   ├── package.json             # Dependências e scripts
│   ├── package-lock.json
│   ├── postcss.config.js        # Configuração PostCSS
│   ├── tailwind.config.ts       # Configuração TailwindCSS
│   ├── tsconfig.json            # Configuração TypeScript
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── vite.config.ts           # Configuração Vite
│
├── 🌐 Arquivos Públicos
│   ├── index.html               # Template HTML principal
│   └── public/
│       ├── favicon.ico          # Ícone do site
│       ├── placeholder.svg      # Imagem placeholder
│       └── robots.txt           # Configuração SEO
│
└── 💻 Código Fonte
    └── src/
        ├── 📱 Componentes
        │   ├── components/
        │   │   ├── AddTransactionSheet.tsx   # Modal para adicionar transações
        │   │   ├── AppSidebar.tsx            # Barra lateral de navegação
        │   │   ├── CreateGoalSheet.tsx       # Modal para criar metas
        │   │   ├── Layout.tsx                # Layout principal da aplicação
        │   │   └── ui/                       # Componentes UI reutilizáveis (shadcn/ui)
        │   │
        │   ├── 🎯 Páginas
        │   │   ├── pages/
        │   │   │   ├── Index.tsx             # Dashboard principal
        │   │   │   ├── Goal.tsx              # Página de metas financeiras
        │   │   │   ├── Ranking.tsx           # Página de ranking e gamificação
        │   │   │   └── NotFound.tsx          # Página 404
        │   │
        │   ├── 🔧 Utilitários
        │   │   ├── hooks/
        │   │   │   ├── use-mobile.tsx        # Hook para detecção mobile
        │   │   │   └── use-toast.ts          # Hook para notificações
        │   │   │
        │   │   └── lib/
        │   │       └── utils.ts              # Funções utilitárias
        │   │
        │   ├── 🎨 Assets e Estilos
        │   │   ├── assets/
        │   │   │   └── FYNX CABRA SF.png     # Logo da aplicação
        │   │   │
        │   │   ├── App.css                   # Estilos específicos do App
        │   │   └── index.css                 # Estilos globais
        │   │
        │   ├── 🚀 Arquivos Principais
        │   │   ├── App.tsx                   # Componente raiz da aplicação
        │   │   ├── main.tsx                  # Ponto de entrada da aplicação
        │   │   └── vite-env.d.ts            # Tipos do Vite
```

## 📄 Páginas e Funcionalidades

### 🏠 Dashboard Principal (`Index.tsx`)
**Rota**: `/`

A página principal oferece uma visão geral completa das finanças do usuário:

#### Funcionalidades:
- **Cards de Resumo Financeiro**:
  - Total Balance: Saldo total atual
  - Monthly Income: Receita mensal
  - Monthly Expenses: Gastos mensais  
  - Savings Rate: Taxa de poupança

- **Transações Recentes**: Lista das últimas transações com status e categorização
- **Portfólio de Investimentos**: Distribuição visual dos investimentos (Ações, Títulos, Dinheiro)
- **Ações Rápidas**: Botões para adicionar transação, transferir fundos, definir metas e gerar relatórios

#### Componentes Utilizados:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`, `Progress`, `Badge`
- `AddTransactionSheet`
- Ícones: `Eye`, `TrendingUp`, `TrendingDown`, `Users`, `Plus`, etc.

### 🎯 Metas Financeiras (`Goal.tsx`)
**Rota**: `/goals`

Página dedicada ao gerenciamento de metas financeiras pessoais:

#### Funcionalidades:
- **Criação de Metas**: Interface para definir novas metas financeiras
- **Visualização de Progresso**: Barras de progresso para cada meta
- **Metas Mockadas**:
  - Viagem para Europa (R$ 15.000)
  - Carro Novo (R$ 45.000)
  - Casa Própria (R$ 200.000)

#### Componentes Utilizados:
- `CreateGoalSheet` para criação de novas metas
- `AddTransactionSheet` para adicionar valores às metas
- `Progress` para visualização do progresso
- Ícones: `Target`, `TrendingUp`, `Plus`

### 🏆 Ranking e Gamificação (`Ranking.tsx`)
**Rota**: `/ranking`

Sistema de gamificação com ranking competitivo entre usuários:

#### Funcionalidades:
- **Sistema de Ligas**: Ferro, Bronze, Prata, Ouro, Diamante
- **Ranking de Usuários**: Posicionamento baseado em pontos
- **Estatísticas Pessoais**: Posição atual, pontos, liga e streak
- **Calendário de Contribuições**: Visualização estilo GitHub do progresso diário
- **Indicadores de Tendência**: Setas mostrando subida/descida no ranking

#### Componentes Utilizados:
- `Calendar` do react-github-contribution-calendar
- `Badge` para ligas e status
- `Progress` para progresso até próxima liga
- Ícones: `Trophy`, `TrendingUp`, `TrendingDown`, `Flame`, `Shield`

### ❌ Página 404 (`NotFound.tsx`)
**Rota**: `*` (catch-all)

Página de erro para rotas não encontradas.

## 🧩 Componentes Principais

### 🎛️ Layout (`Layout.tsx`)
Componente wrapper que define a estrutura base da aplicação:
- **SidebarProvider**: Contexto para controle da sidebar
- **Header**: Cabeçalho com trigger da sidebar e título
- **Main Content**: Área principal para renderização das páginas

### 📋 Sidebar (`AppSidebar.tsx`)
Barra lateral de navegação com:
- **Itens de Navegação**:
  - Dashboard (`/`)
  - Ranking (`/ranking`)
  - Goals (`/goals`)
  - Settings (`/settings`)
- **Estado Responsivo**: Colapsa em dispositivos móveis
- **Indicador Visual**: Destaque da página ativa

### 💰 Modal de Transações (`AddTransactionSheet.tsx`)
Sheet modal para adicionar novas transações:

#### Campos do Formulário:
- **Descrição**: Texto descritivo da transação
- **Tipo**: Receita ou Despesa
- **Valor**: Quantia da transação
- **Categoria**: Categorização (Salário, Moradia, Alimentação, etc.)
- **Recorrente**: Switch para transações recorrentes
- **Meta Relacionada**: Vinculação opcional com metas

#### Categorias Disponíveis:
- **Receitas**: Salary, Freelance, Investment, Business, Gift, Other Income
- **Despesas**: Housing, Food, Transportation, Healthcare, Entertainment, Shopping, Bills, Education, Travel, Other Expense

### 🎯 Modal de Metas (`CreateGoalSheet.tsx`)
Sheet modal para criação de novas metas financeiras com campos para nome, valor alvo e descrição.

## 🔧 Dependências Principais

### 📦 Dependências de Produção

#### Core React
- `react` (18.3.1) - Biblioteca principal
- `react-dom` (18.3.1) - Renderização DOM
- `react-router-dom` (6.30.1) - Roteamento

#### UI e Styling
- `@radix-ui/*` - Componentes primitivos acessíveis
- `tailwindcss` (3.4.17) - Framework CSS utilitário
- `tailwindcss-animate` (1.0.7) - Animações CSS
- `lucide-react` (0.462.0) - Biblioteca de ícones
- `class-variance-authority` (0.7.1) - Variantes de classes CSS
- `clsx` (2.1.1) - Utilitário para classes condicionais
- `tailwind-merge` (2.6.0) - Merge inteligente de classes Tailwind

#### Formulários e Validação
- `react-hook-form` (7.61.1) - Gerenciamento de formulários
- `@hookform/resolvers` (3.10.0) - Resolvers para validação
- `zod` (3.25.76) - Schema de validação TypeScript

#### Estado e Dados
- `@tanstack/react-query` (5.83.0) - Gerenciamento de estado servidor

#### Gráficos e Visualizações
- `recharts` (2.15.4) - Biblioteca de gráficos React
- `react-github-contribution-calendar` (2.2.0) - Calendário de contribuições

#### Utilitários
- `date-fns` (3.6.0) - Manipulação de datas
- `cmdk` (1.1.1) - Command palette
- `sonner` (1.7.4) - Notificações toast
- `vaul` (0.9.9) - Drawer component
- `next-themes` (0.3.0) - Gerenciamento de temas

### 🛠️ Dependências de Desenvolvimento

#### Build e Bundling
- `vite` (5.4.19) - Build tool e dev server
- `@vitejs/plugin-react-swc` (3.11.0) - Plugin React com SWC

#### TypeScript
- `typescript` (5.8.3) - Linguagem TypeScript
- `@types/react` (18.3.23) - Tipos React
- `@types/react-dom` (18.3.7) - Tipos React DOM
- `@types/node` (22.16.5) - Tipos Node.js

#### Linting e Qualidade
- `eslint` (9.32.0) - Linter JavaScript/TypeScript
- `typescript-eslint` (8.38.0) - ESLint para TypeScript
- `eslint-plugin-react-hooks` (5.2.0) - Regras ESLint para React Hooks
- `eslint-plugin-react-refresh` (0.4.20) - Plugin para React Refresh

#### CSS e PostCSS
- `postcss` (8.5.6) - Processador CSS
- `autoprefixer` (10.4.21) - Autoprefixer para CSS

#### Ferramentas Especiais
- `lovable-tagger` (1.1.9) - Ferramenta de desenvolvimento

## 🚀 Scripts Disponíveis

```json
{
  "dev": "vite",                    // Inicia servidor de desenvolvimento
  "build": "vite build",            // Build para produção
  "build:dev": "vite build --mode development", // Build em modo desenvolvimento
  "lint": "eslint .",               // Executa linting
  "preview": "vite preview"         // Preview do build de produção
}
```

## 🎨 Sistema de Design

### Tema e Cores
O projeto utiliza um sistema de design baseado em CSS custom properties com suporte a tema escuro/claro através do `next-themes`.

### Componentes UI
Todos os componentes UI são baseados no **shadcn/ui**, que combina:
- **Radix UI**: Componentes primitivos acessíveis
- **TailwindCSS**: Styling utilitário
- **CVA**: Variantes de componentes

### Responsividade
- Design mobile-first
- Sidebar colapsável em dispositivos móveis
- Grid responsivo para cards e layouts

## 🔄 Fluxo de Dados

### Estado Local
- Formulários gerenciados com `react-hook-form`
- Estado de UI (modals, sidebar) com hooks nativos do React

### Estado Global
- Dados do servidor gerenciados com `TanStack React Query`
- Cache automático e sincronização de dados

### Validação
- Schemas Zod para validação de formulários
- Validação em tempo real nos inputs

## 🚦 Roteamento

```typescript
Routes:
├── "/" → Index (Dashboard)
├── "/ranking" → Ranking
├── "/goals" → Goal
└── "*" → NotFound (404)
```

## 🎯 Funcionalidades Futuras

- Integração com APIs bancárias
- Relatórios avançados e exportação
- Notificações push
- Modo offline
- Sincronização multi-dispositivo
- Sistema de conquistas expandido

## 🤝 Contribuição

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com 💚 pela equipe Fynx**
