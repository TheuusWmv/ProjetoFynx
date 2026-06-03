# Apresentação do Documento de Requisitos - FYNX Rev. 06

> Roteiro de apresentação para a atividade de 25/02/2026, alinhado ao documento de requisitos mais recente.

---

## 1. Objetivo da Apresentação

Apresentar a visão do FYNX, seus requisitos funcionais e não funcionais, regras de negócio, atores principais, módulos e rastreabilidade entre requisito, caso de uso e implementação.

---

## 2. Roteiro de Slides

| Slide | Título | Conteúdo |
|---|---|---|
| 1 | FYNX | Sistema web de gestão financeira gamificada. |
| 2 | Problema | Usuários precisam registrar gastos, acompanhar metas é manter disciplina financeira. |
| 3 | Proposta | Unir controle financeiro, dashboard, metas e gamificação. |
| 4 | Atores | Usuário autenticado, visitante, sistema, admin futuro, provedor WhatsApp planejado. |
| 5 | Escopo implementado | Auth, transações, metas, budgets, dashboard, ranking e categorias. |
| 6 | Escopo parcial/planejado | Spending limits parcial; WhatsApp/IA e auditoria persistida planejados. |
| 7 | Requisitos funcionais | Resumo RF001 a RF020 com status. |
| 8 | Requisitos não funcionais | Segurança, performance, usabilidade, manutenibilidade e integridade. |
| 9 | Casos de uso | Diagrama de caso de uso e CSUs principais. |
| 10 | Regras de negócio | Valor positivo, ownership por usuário, JWT, score, ligas e metas. |
| 11 | Rastreabilidade | RF -> CSU -> endpoint -> tabela -> código -> teste. |
| 12 | Encerramento | Status da Rev06, lacunas conhecidas e proximos passos. |

---

## 3. Mensagem Central

O FYNX entrega um núcleo financeiro funcional com autenticação, transações, metas, dashboard e gamificação. A Rev06 documenta o sistema de forma modular e diferencia claramente o que está implementado, parcial e planejado.

---

## 4. Referências para Apresentação

| Tema | Documento |
|---|---|
| Requisitos | `REQUISITOS_E_REGRAS.md` |
| Casos de uso e processos | `FLUXOS_E_CASOS_DE_USO.md` |
| API | `REFERENCIA_DA_API.md` |
| Banco | `BANCO_DE_DADOS.md` |
| Arquitetura | `ARQUITETURA.md` |
| Protótipos e UI | `PROTOTIPOS_E_TELAS.md` |
| Evidências de implementação | `EVIDENCIAS_DA_IMPLEMENTACAO.md` |
| Rastreabilidade | `MATRIZ_DE_RASTREABILIDADE.md` |
