# Motor de Gamificação - FYNX Rev. 06

> Documento especializado do contexto de gamificação. Consolida score, ranking, ligas, achievements e badges com base em `domains/gamification`, `user_scores`, `achievements`, `user_achievements`, `badges` e `user_badges`.

---

## 1. Escopo

O contexto de gamificação transforma comportamento financeiro em sinais de engajamento. Ele não deve alterar a semântica financeira das transações; ele consome dados financeiros e produz:

- score;
- nível;
- liga;
- ranking;
- achievements;
- badges;
- recomendações e estatísticas de competição.

**Endpoints relacionados:**

| Endpoint | Uso |
|---|---|
| `GET /api/v1/ranking` | Dados consolidados. |
| `GET /api/v1/ranking/leaderboard/global` | Ranking global. |
| `GET /api/v1/ranking/leaderboard/friends` | Ranking de amigos. |
| `GET /api/v1/ranking/leaderboard/categories` | Rankings segmentados. |
| `GET /api/v1/ranking/user/:userId` | Ranking de usuário. |
| `GET /api/v1/ranking/score/:userId` | Cálculo/consulta de score. |
| `PUT /api/v1/ranking/score/:userId` | Atualização de score. |
| `GET /api/v1/ranking/achievements/:userId` | Conquistas. |
| `GET /api/v1/ranking/badges/:userId` | Badges. |
| `POST /api/v1/ranking/reset-season` | Reset sazonal. |

---

## 2. Modelo de Dados

| Tabela | Papel |
|---|---|
| `user_scores` | Estado atual do score, nível, liga, carry-over e streak. |
| `achievements` | Catálogo de conquistas com pontos. |
| `user_achievements` | Conquistas obtidas por usuário. |
| `badges` | Catálogo de badges visuais. |
| `user_badges` | Badges obtidos por usuário. |
| `transactions` | Fonte primaria para cálculo financeiro. |
| `spending_goals` | Fonte para progresso e metas concluidas. |

---

## 3. Score

O score É um indicador derivado de comportamento financeiro. A documentação deve refletir `ranking.service.ts`; se a fórmula mudar no código, esta seção deve ser atualizada.

### 3.1. Componentes recomendados

| Componente | Fonte | Intenção |
|---|---|---|
| `savingsScore` | Receitas, despesas e saldo liquido | Premiar economia real. |
| `goalsScore` | Metas concluidas e progresso | Premiar planejamento. |
| `consistencyScore` | Streak e atividade recorrente | Premiar habito. |
| `bonusScore` | Achievements e badges | Premiar marcos especiais. |
| `totalScore` | Soma ponderada | Ranking e liga. |

### 3.2. Exemplo de cálculo documentavel

```json
{
  "savingsScore": 620,
  "goalsScore": 180,
  "consistencyScore": 90,
  "bonusScore": 50,
  "totalScore": 940,
  "breakdown": [
    {
      "category": "savings",
      "points": 620,
      "description": "Saldo liquido positivo no período."
    },
    {
      "category": "goals",
      "points": 180,
      "description": "Progresso em metas ativas."
    }
  ]
}
```

### 3.3. Regras de qualidade do score

- Score não deve usar dados de outro usuário.
- Score deve tolerar usuário sem transações.
- Score deve documentar se usa dados mensais, semanais, anuais ou históricos.
- Mudanca manual de score (`PUT /score/:userId`) deve ser protegida por autorização administrativa.

---

## 4. Ligas

As ligas são a representacao competitiva do score.

| Liga | Uso recomendado | Observação |
|---|---|---|
| Bronze | Entrada e score baixo. | Valor default em `user_scores.league`. |
| Prata | Evolução intermediária. | Deve ser calculada pelo service. |
| Ouro | Alta disciplina. | Deve refletir score e percentil. |
| Platina | Usuário avancado. | Exige critério claro. |
| Diamante | Elite competitiva. | Evitar critério impossivel ou arbitrario. |

**Regra documental:** os limites numéricos de cada liga só devem ser fixados aqui se estiverem fixos no código ou em arquivo de config. Caso contrário, documentar como cálculo dinâmico.

### 4.1. Fonte atual dos limites

No código atual, existem duas estratégias registradas em `ranking.service.ts`:

| Fonte no código | Regra | Observação |
|---|---|---|
| `calculateLeague(score)` | Bronze abaixo de 2500, Prata a partir de 2500, Ouro a partir de 5000, Platina a partir de 7500, Diamante a partir de 10000. | Faixa absoluta por pontos. |
| `calculateUserLeague(userId, score)` | Diamante até 1% superior, Platina até 5%, Ouro até 20%, Prata até 50%, Bronze acima disso. | Faixa relativa por percentile do ranking. |

Essa duplicidade deve ser consolidada em uma Única política antes de tratar a regra de ligas como governanca final. O arquivo `ranking.config.ts` existe, mas não define thresholds no estado atual inspecionado.

---

## 5. Ranking

### 5.1. Ranking global

Ordena usuários por score, retornando posição, username, score, nível, liga e tendência.

**Contrato base:**

```json
{
  "position": 1,
  "userId": "1",
  "username": "Usuário Demo",
  "score": 1250,
  "level": 4,
  "league": "Prata",
  "change": 1,
  "trend": "up"
}
```

### 5.2. Rankings por categoria

Podem separar:

- economia;
- metas;
- consistência.

Cada categoria deve ter fonte de dados e regra documentada no service.

### 5.3. Ranking de amigos

Existe endpoint para leaderboard de amigos. Se ainda não houver modelo de amizade no schema, a resposta deve ser tratada como read model derivado, mockado ou funcionalidade parcial, conforme implementação real.

---

## 6. Achievements

Achievements são conquistas sem necessariamente serem exibidas como badge visual principal.

**Tabela fonte:** `achievements`
**Tabela de ganho:** `user_achievements`

| Campo | Origem | Uso |
|---|---|---|
| `name` | `achievements.name` | Nome da conquista. |
| `description` | `achievements.description` | Explicação. |
| `icon` | `achievements.icon` | Representacao visual. |
| `points` | `achievements.points` | Bonus no score, se aplicável. |
| `earned_at` | `user_achievements.earned_at` | Data de desbloqueio. |

**Regra de integridade:** `UNIQUE(user_id, achievement_id)` impede duplicidade.

---

## 7. Badges

Badges são prêmios visuais. O catálogo É semeado por `INITIAL_BADGES` em `seed.ts`.

**Tabela fonte:** `badges`
**Tabela de ganho:** `user_badges`

| Campo | Origem | Uso |
|---|---|---|
| `id` | `badges.id` | Chave textual. |
| `name` | `badges.name` | Nome público. |
| `description` | `badges.description` | Critério narrativo. |
| `icon` | `badges.icon` | UI. |
| `category` | `badges.category` | Agrupamento. |
| `requirements` | `badges.requirements` | JSON de requisitos, se usado. |

**Regra de integridade:** `UNIQUE(user_id, badge_id)` impede duplicidade.

---

## 8. Eventos de Domínio

Eventos encontrados no contexto:

| Evento | Arquivo | Uso esperado |
|---|---|---|
| `TransactionCreatedEvent` | `domains/financial/events/transaction-created.event.ts` | Acionar recálculo de score ou badges por transação. |
| `GoalCompletedEvent` | `domains/financial/events/goal-completed.event.ts` | Acionar conquistas por meta. |
| `BadgeEarnedEvent` | `domains/gamification/events/badge-earned.event.ts` | Notificar obtenção de badge. |

**Status:** a documentação deve verificar, antes de afirmar comportamento assíncrono, se os eventos estão efetivamente conectados ao `event-bus`.

---

## 9. Temporadas e Reset

`POST /api/v1/ranking/reset-season` existe no roteador de ranking.

**Requisitos para uso seguro:**

1. Exigir permissão administrativa.
2. Registrar auditoria.
3. Definir regra de carry-over.
4. Evitar execução concorrente.
5. Preservar ou documentar histórico da temporada encerrada.

Se qualquer item acima não Existir no código, o endpoint deve ser considerado funcionalmente incompleto do ponto de vista de governanca.

---

## 10. Anti-manipulação

Políticas recomendadas:

| Política | Status documental | Motivo |
|---|---|---|
| Limite de ganho por período | Recomendado | Evita farming por muitas transações pequenas. |
| Auditoria de alteração manual de score | Recomendado | Protege `PUT /score/:userId`. |
| Recálculo idempotente de score | Recomendado | Evita duplicar pontos por retry. |
| Validação de ownership | Obrigatório | Impede consultar ou alterar outro usuário indevidamente. |

---

## 11. UX de Gamificação

O frontend deve expor gamificação sem esconder o objetivo financeiro principal.

Elementos esperados:

- card de score;
- liga atual;
- progresso de nível;
- ranking global;
- conquistas obtidas;
- badges disponíveis;
- feedback visual quando uma conquista e desbloqueada.

Esses elementos devem consumir `/api/v1/ranking` e endpoints auxiliares, sem recalcular regra critica no client.

---

## 12. Checklist de Consistência

- `MOTOR_DE_GAMIFICACAO.md` deve bater com `ranking.service.ts`.
- Limites de ligas não devem ser inventados se não Estiverem fixos no código.
- Achievements e badges devem bater com `schema.ts` e `seed.ts`.
- Endpoints administrativos devem ser marcados como sensíveis.
- Eventos só devem ser descritos como ativos se estiverem conectados.
