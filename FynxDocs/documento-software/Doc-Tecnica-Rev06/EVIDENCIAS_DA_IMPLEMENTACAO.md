# Evidências de Implementação - FYNX Rev. 06

> Documento acadêmico para demonstrar implementação, camadas, pastas, CRUD, regras, validações, SQL, banco de dados, persistência e histórico Git.

---

## 1. Funcionalidades Implementadas

| Módulo | Objetivo | Funcionalidades | Entradas | Saídas | Regras principais | Status |
|---|---|---|---|---|---|---|
| Auth | Registrar e autenticar usuários | Registro, login, JWT | Nome, email, senha | Token e usuário público | Hash de senha, email Único | Implementado |
| Transactions | Gerenciar lançamentos financeiros | CRUD, filtros, stats, summary, bulk | Tipo, valor, categoria, data | Transação/coleção/resumos | Valor positivo, ownership por `user_id` | Implementado |
| Goals/Budgets | Acompanhar metas e budgets | CRUD de metas, progresso, budgets | Valor alvo, período, categoria | Meta/budget e progresso | Status e período válidos | Implementado |
| Dashboard | Exibir analytics financeiros | Overview, histórico e agregacoes | Usuário autenticado | Cards, gráficos, histórico | Filtro por `user_id` | Implementado |
| Ranking/Gamification | Calcular score e ranking | Score, ligas, badges, achievements | Usuário autenticado | Leaderboards e progresso | Regras de pontuação e anti-manipulação | Implementado com risco admin |
| Custom Categories | Personalizar categorias | Criar, listar, editar, excluir, arquivar | Nome e tipo | Categoria customizada | Duplicidade por usuário | Implementado |
| Spending Limits | Limites por categoria | Rotas e service existem | Limite, categoria, período | Limite/progresso | Persistência esperada | Parcial |
| WhatsApp/IA | Operações por mensagem | Vínculo, NLP, notificações | Telefone/mensagem | Resposta natural | OTP e opt-in | Planejado |

---

## 2. Organização em Camadas

| Camada | Pasta/arquivo | Papel |
|---|---|---|
| Interface | `FynxFront/src/pages`, `components`, `hooks`, `refine` | Telas, formulários e consumo da API |
| HTTP | `FynxApi/src/infrastructure/http` | Express, middlewares, roteador central |
| Controller | `FynxApi/src/domains/*/*.controller.ts` | Adaptação HTTP para service/use case |
| Application | `FynxApi/src/application` | Casos de uso já extraidos |
| Domain | `FynxApi/src/domains`, `shared/domain` | Entidades, value objects, eventos e regras |
| Persistence | `FynxApi/src/infrastructure/database`, `repositories` | SQLite, DDL, seed e repositories concretos |

---

## 3. CRUD e Endpoints

| Recurso | Create | Read | Update | Delete | Observação |
|---|---|---|---|---|---|
| Auth | `POST /auth/register` | N/A | N/A | N/A | Login em `POST /auth/login` |
| Transactions | `POST /transactions` | `GET /transactions`, `GET /transactions/:id` | `PUT /transactions/:id` | `DELETE /transactions/:id` | CRUD completo |
| Spending goals | `POST /goals/spending-goals` | `GET /goals/spending-goals` | `PUT/PATCH /goals/spending-goals/:id` | `DELETE /goals/spending-goals/:id` | CRUD completo |
| Budgets | `POST /goals/budgets` | `GET /goals/budgets` | `PUT/PATCH /goals/budgets/:id` | `DELETE /goals/budgets/:id` | CRUD completo |
| Custom categories | `POST /categories/custom` | `GET /categories/custom` | `PUT /categories/custom/:id` | `DELETE /categories/custom/:id` | Possui archive |
| Ranking | Admin/parcial | `GET /ranking/*` | `PUT /ranking/score/:userId` | `POST /ranking/reset-season` | Operações sensíveis exigem controle admin |
| Spending limits | `POST` definido | `GET` definido | `PUT/PATCH` definido | `DELETE` definido | Não Exposto no roteador central |

---

## 4. Regras de Negócio e Validações

| Tipo | Evidência | Observação |
|---|---|---|
| Validação de entrada | `zod` em controllers de goals e transactions | Payloads inválidos retornam erro de validação |
| Auth | `auth.middleware.ts` | Rotas protegidas usam JWT |
| Hash de senha | `auth.service.ts` com bcrypt | Senha não deve ser persistida em texto puro |
| Integridade multiusuário | Uso de `user_id` em tabelas e services | Toda leitura/escrita deve filtrar por usuário |
| Regras financeiras | Services e use cases financeiros | Valor positivo, categoria e tipo válido |
| Gamificação | `ranking.service.ts`, `MOTOR_DE_GAMIFICACAO.md` | Score, ligas, badges e reset de temporada |

---

## 5. Banco de Dados, SQL e Persistência

| Exigencia | Evidência | Status |
|---|---|---|
| Conexão com banco | `FynxApi/src/infrastructure/database/database.ts` | Implementado |
| Script SQL CREATE | `schema.ts` e criacoes complementares em `database.ts` | Implementado |
| Script SQL INSERT/seed | `seedInitialData()` em `database.ts` | Implementado |
| Camada de persistência | `infrastructure/repositories` e services com SQLite | Implementado parcial |
| Banco relacional | SQLite | Implementado localmente |
| Migrations | `applyMigrations()` em `database.ts` | Implementado incremental |

---

## 6. Estrutura Clara de Projeto

```text
ProjetoFynx/
|-- FynxApi/      backend Express/TypeScript/SQLite
|-- FynxFront/       frontend React/Vite/TypeScript
|-- FynxDocs/     documentação técnica, manual e site de docs
```

Detalhamento técnico completo em `ARQUITETURA.md`.

---

## 7. Histórico Git

Evidência local observada por `git rev-list --count HEAD`: **99 commits** no histórico da branch atual.

Evidência local observada por `git log --oneline -n 15`:

| Commit | Mensagem | Evidência |
|---|---|---|
| `e5649b7` | `feature: Site de visualizacao de documento` | Evolução de documentação/site |
| `4804705` | `refactor & docs: adaptacao para DDD` | Refatoração e docs |
| `e2ba4ad` | `Otimização do Documento de Software` | Documentação |
| `0b8a3eb` | `Atividade da aula 01/04/2026` | Entrega acadêmica |
| `7194c3e` | `Design` | Evolução visual |
| `7d090bc` | `Design` | Evolução visual |
| `56e2c63` | `Design` | Evolução visual |
| `8aac823` | `fix` | Correção pontual |
| `74994c1` | `atualização de documentação` | Documentação |
| `a554353` | `Enhance (Alterações estéticas` | UI/estética |
| `af1ab25` | `feat (FynxAPI): Otimização do backend` | Backend |
| `1a8947c` | `Atualização visual` | Frontend/UI |
| `efd40b8` | `Implementação Diagrama de Classes` | Artefato UML |
| `fbb3e25` | `Atualização DocSoftware` | Documento de software |
| `65d971b` | `docs: atualiza FynxRev05.md e adiciona Mapeamento_Processos_BPMN.md` | Documentação/processos |
| `5172efd` | `feat(auth): implementar sistema de autenticação, sessão JWT e isolamento de dados` | Auth e isolamento |

O histórico demonstra commits frequentes, embora algumas mensagens antigas sejam genéricas. A recomendação é manter o padrão `tipo(escopo): descrição objetiva` nas próximas entregas.

---

## 8. Testes e Evidências Funcionais

| Área | Arquivos/evidências |
|---|---|
| Cadastro de transação de entrada | `FynxFront/tests/cadastrar-transacao-entrada.test.js` |
| Cadastro de transação de saída | `FynxFront/tests/cadastrar-transacao-saida.test.js` |
| Deleção de transação | `FynxFront/tests/deletar-transacao-*.test.js` |
| Cadastro de meta | `FynxFront/tests/cadastrar-meta.test.js` |
| Screenshots de falhas/regressoes | `FynxFront/output/*.png`, `*.html` |

---

## 9. Lacunas Declaradas

- `spending-limits` tem rotas/service, mas não Está exposto em `routes/index.ts` e não possui tabela em `schema.ts`.
- WhatsApp/IA possui fluxos planejados, mas não possui módulo produtivo registrado.
- Endpoints administrativos de ranking precisam de autorização por papel antes de serem considerados seguros.
- Alguns campos TypeScript são mais ricos que o schema físico atual e não devem ser tratados como persistidos.
