# FYNX Rev. 06 - Documentação Técnica Global

> Hub principal da documentação Rev06. A revisão consolida a migração do backend para uma organização orientada a domínios, mantendo uma estrutura híbrida: DDD para arquitetura e rastreabilidade clássica para requisitos, fluxos, banco, API e artefatos acadêmicos.

---

## 1. Controle de Revisões

| Revisão | Data | Objetivo | Status |
|---|---|---|---|
| Rev05 | Abril/2026 | Documento técnico monolítico, com padrão clássico. | Referência histórica |
| Rev06 | Abril/2026 | Documentação modular alinhada ao backend DDD e ?s atividades do professor. | Ativa |

---

## 2. Como Ler a Rev06

| Documento | Quando usar | Status |
|---|---|---|
| [Requisitos e Regras](./REQUISITOS_E_REGRAS.md) | Entender requisitos, regras, RNFs e rastreabilidade. | Refatorado |
| [Fluxos e Casos de Uso](./FLUXOS_E_CASOS_DE_USO.md) | Entender casos de uso, sad paths, processos e diagramas. | Refatorado |
| [Processo Ágil](./PROCESSO_AGIL.md) | Entender como a equipe organiza atividades, comunicação, validação visual e desenvolvimento por domínios. | Novo |
| [Referência da API](./REFERENCIA_DA_API.md) | Consumir ou manter contratos HTTP. | Refatorado |
| [Banco de Dados](./BANCO_DE_DADOS.md) | Entender DER, modelo lógico, modelo físico, SQL e dicionario. | Refatorado |
| [Arquitetura](./ARQUITETURA.md) | Entender arquitetura, camadas, UML, sequências, módulos e ADRs. | Refatorado |
| [Motor de Gamificação](./MOTOR_DE_GAMIFICACAO.md) | Entender score, ranking, badges e temporadas. | Refatorado |
| [Matriz de Rastreabilidade](./MATRIZ_DE_RASTREABILIDADE.md) | Validar compatibilidade com os artefatos acadêmicos exigidos. | Novo |
| [Protótipos e Telas](./PROTOTIPOS_E_TELAS.md) | Consultar protótipos, telas, navegação e comparativo visual. | Novo |
| [Evidências da Implementação](./EVIDENCIAS_DA_IMPLEMENTACAO.md) | Conferir evidências de implementação, CRUD, Git, SQL e camadas. | Novo |
| [Roteiro de Apresentação](./ROTEIRO_DE_APRESENTACAO.md) | Roteiro da apresentação do documento de requisitos. | Novo |
| [llms.txt](./llms.txt) | Dar contexto rápido para agentes de IA. | Refatorado |

**Ordem recomendada de leitura:** regras, workflows, API, banco, arquitetura, gamificação, rastreabilidade, evidências.

### 2.1. Compatibilidade com as Atividades do Professor

| Atividade | Artefato solicitado | Documento Rev06/FynxDocs | Status |
|---|---|---|---|
| 11/02/2026 | Documento de Requisitos Funcionais e Não Funcionais | [Requisitos e Regras](./REQUISITOS_E_REGRAS.md) | Coberto |
| 25/02/2026 | Apresentação do Documento de Requisitos | [Roteiro de Apresentação](./ROTEIRO_DE_APRESENTACAO.md) | Coberto |
| 04/03/2026 | Termo de Abertura do Projeto | [termo_abertura.md](../../Termo-abertura/termo_abertura.md) | Coberto fora da Rev06 |
| 04/03/2026 | Mapeamento de Processos | [Fluxos e Casos de Uso](./FLUXOS_E_CASOS_DE_USO.md) | Coberto |
| 04/03/2026 | Definição do Processo Ágil e organização da equipe | [Processo Ágil](./PROCESSO_AGIL.md) | Coberto |
| 04/03/2026 | Protótipos UI/UX | [Protótipos e Telas](./PROTOTIPOS_E_TELAS.md) | Coberto por evidências visuais |
| 04/03/2026 | Diagrama de Caso de Uso | [Fluxos e Casos de Uso](./FLUXOS_E_CASOS_DE_USO.md) | Coberto |
| 18/03/2026 | Diagrama de Classes | [Arquitetura](./ARQUITETURA.md) | Coberto |
| 18/03/2026 | Especificação detalhada de Casos de Uso | [Fluxos e Casos de Uso](./FLUXOS_E_CASOS_DE_USO.md) | Coberto |
| 25/03/2026 | Arquitetura do Sistema | [Arquitetura](./ARQUITETURA.md) | Coberto |
| 25/03/2026 | Projeto de Banco de Dados | [Banco de Dados](./BANCO_DE_DADOS.md) | Coberto |
| 25/03/2026 | Protótipos refinados e fluxo de telas | [Protótipos e Telas](./PROTOTIPOS_E_TELAS.md) | Coberto |
| 25/03/2026 | Sequência/Comunicação e Módulos | [Fluxos e Casos de Uso](./FLUXOS_E_CASOS_DE_USO.md), [Evidências da Implementação](./EVIDENCIAS_DA_IMPLEMENTACAO.md) | Coberto |
| 15/04/2026 | Implementação, camadas, CRUD, SQL, Git e comparativo | [Evidências da Implementação](./EVIDENCIAS_DA_IMPLEMENTACAO.md), [Protótipos e Telas](./PROTOTIPOS_E_TELAS.md) | Coberto |

Detalhamento completo em [MATRIZ_DE_RASTREABILIDADE.md](./MATRIZ_DE_RASTREABILIDADE.md).

---

## 3. Escopo Atual do Sistema

O FYNX é um sistema de gestão financeira gamificada com:

- autenticação JWT;
- cadastro e consulta de transações;
- metas de gasto e economia;
- budgets;
- categorias globais e customizadas;
- dashboard financeiro;
- ranking, score, achievements e badges;
- tours de onboarding no frontend;
- módulo WhatsApp planejado.

### 3.1. Status dos módulos

| Módulo | Status | Observação |
|---|---|---|
| Auth | Implementado | `/api/v1/auth`. |
| Transactions | Implementado | CRUD, filtros, summary, stats e bulk. |
| Goals/Budgets | Implementado | `/api/v1/goals`. |
| Dashboard | Implementado | `/api/v1/dashboard`. |
| Ranking/Gamification | Implementado | `/api/v1/ranking`. |
| Custom Categories | Implementado | `/api/v1/categories/custom`. |
| Spending Limits | Parcial | Existe domínio, mas rota central e tabela física estão pendentes. |
| WhatsApp/IA | Planejado | Não há rota registrada no backend atual. |
| Admin/Audit | Parcial/Planejado | Logs existem; auditoria persistida precisa evoluir. |

---

## 4. Quick Start

### 4.1. Backend

```bash
cd FynxApi
npm install
npm run dev
```

O banco SQLite É inicializado em `FynxApi/src/data/fynx.db` por `infrastructure/database/database.ts`.

### 4.2. Frontend

```bash
cd FynxFront
npm install
npm run dev
```

O frontend deve apontar para:

```env
VITE_API_URL=http://localhost:3001/api/v1
```

---

## 5. Stack Tecnologica

### Backend - `FynxApi`

| Tecnologia | Papel | Justificativa |
|---|---|---|
| Node.js | Runtime | Ecossistema simples para API REST. |
| Express | HTTP server e roteamento | Leve e direto para rotas modulares. |
| TypeScript | Tipagem | Melhora manutenção e contratos internos. |
| SQLite | Persistência atual | Baixo atrito local e seed simples. |
| bcrypt | Hash de senha | Protege credenciais. |
| JWT | Autenticação stateless | Protege rotas sem sessão server-side. |
| Zod/validações | Contrato de entrada | Reduz payload inválido nos controllers. |

### Frontend - `FynxFront`

| Tecnologia | Papel | Justificativa |
|---|---|---|
| React | Interface | SPA com componentes reutilizáveis. |
| Vite | Build/dev server | Desenvolvimento rápido. |
| TypeScript | Tipagem | Contratos mais seguros. |
| Tailwind CSS | Estilo | UI responsiva e utilitaria. |
| shadcn/ui | Componentes | Base consistente de componentes. |
| Refine | Recursos CRUD/admin | Telas de recursos no frontend. |
| Driver.js | Tours | Onboarding guiado. |

---

## 6. Estrutura do Repositório

```text
ProjetoFynx/
|-- FynxApi/
|   |-- src/application/
|   |-- src/domains/
|   |-- src/infrastructure/
|   `-- src/shared/
|-- FynxFront/
|   |-- src/components/
|   |-- src/pages/
|   |-- src/hooks/
|   |-- src/refine/
|   `-- src/services/
`-- FynxDocs/
    `-- documento-software/Doc-Tecnica-Rev06/
```

Detalhes de pastas e responsabilidades estão em [ARQUITETURA.md](./ARQUITETURA.md).

---

## 7. Rastreabilidade

A Rev06 usa a seguinte cadeia:

```text
RF/RN -> CSU -> Endpoint -> Tabela -> Código -> Evidência/Teste
```

Exemplo:

```text
RF003 Cadastro de transação
-> CSU03 Cadastro de transação financeira
-> POST /api/v1/transactions
-> transactions
-> domains/financial/transactions/*
-> FynxFront/tests/cadastrar-transacao-*.test.js
```

A matriz completa fica em [MATRIZ_DE_RASTREABILIDADE.md](./MATRIZ_DE_RASTREABILIDADE.md).

---

## 8. Diretrizes de Atualização

Ao alterar o sistema:

1. Mudou rota: atualizar `REFERENCIA_DA_API.md`.
2. Mudou regra de negócio: atualizar `REQUISITOS_E_REGRAS.md`.
3. Mudou fluxo de usuário: atualizar `FLUXOS_E_CASOS_DE_USO.md`.
4. Mudou organização da equipe ou processo de trabalho: atualizar `PROCESSO_AGIL.md`.
5. Mudou tabela/migration: atualizar `BANCO_DE_DADOS.md`.
6. Mudou arquitetura/pasta/pattern: atualizar `ARQUITETURA.md`.
7. Mudou score/ranking/badge: atualizar `MOTOR_DE_GAMIFICACAO.md`.
8. Mudou tela/protótipo: atualizar `PROTOTIPOS_E_TELAS.md`.
9. Mudou evidência acadêmica: atualizar `EVIDENCIAS_DA_IMPLEMENTACAO.md` e `MATRIZ_DE_RASTREABILIDADE.md`.
10. Mudou contexto para agentes: atualizar `llms.txt`.

---

## 9. Lacunas Técnicas Conhecidas

| Lacuna | Documento fonte | Ação recomendada |
|---|---|---|
| `spending-limits` não registrado no roteador central. | API, Architecture | Registrar rota ou marcar módulo como interno. |
| `spending_limits` sem tabela física. | Database | Criar migration ou mapear para goals. |
| Tipos de `transactions` possuem campos sem colunas físicas. | API, Database | Persistir campos ou ajustar contrato. |
| `budgets` diverge entre tipo TS e schema físico. | API, Database | Normalizar nomes e períodos. |
| WhatsApp documentado como planejado. | Workflows, API | Criar módulo antes de marcar como implementado. |
| Reset de temporada precisa controle administrativo forte. | Business, Gamification | Adicionar autorização e auditoria. |

---

## 10. Critério de Qualidade Rev06

Um documento da Rev06 só deve ser considerado atualizado quando:

- diferencia implementado, parcial e planejado;
- aponta para código real quando falar de implementação;
- não inventa endpoint ou tabela;
- possui rastreabilidade com RF, CSU, endpoint, tabela, código e evidência quando aplicável;
- mantém linguagem técnica consistente.

### 10.1. Critério Acadêmico de Entrega

Antes de entregar a Rev06 ao professor, validar:

- todos os artefatos da tabela 2.1 possuem link direto;
- todo diagrama exigido esta inserido no documento responsável;
- todo caso de uso possui ator, descrição, fluxo principal, fluxo alternativo, pré-condições e pós-condições;
- banco de dados possui DER, modelo lógico, modelo físico, dicionario e SQL;
- existe comparativo claro entre protótipo e sistema implementado;
- recursos parciais ou planejados não são apresentados como concluídos.
