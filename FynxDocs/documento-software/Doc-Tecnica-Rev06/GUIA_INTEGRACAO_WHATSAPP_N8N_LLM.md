# Guia Central de Implementação: WhatsApp + n8n + LLM + FynxApi

## 1. Objetivo

Este documento define a arquitetura, os fluxos, os contratos HTTP, as tabelas, os serviços e as regras de Segurança para integrar o Fynx com WhatsApp usando n8n, Evolution API e uma LLM multimodal.

O objetivo principal é permitir que um usuário do Fynx interaja pelo WhatsApp para:

- consultar métricas financeiras;
- consultar transações;
- cadastrar transações por texto, áudio, imagem ou vídeo;
- consultar metas;
- consultar categorias;
- receber respostas financeiras contextualizadas;
- executar ações somente dentro do escopo do próprio usuário.

A LLM não deve acessar banco de dados diretamente, não deve receber `user_id`, não deve receber telefone real, não deve receber JWT do usuário e não deve ter liberdade para consultar dados fora das tools autorizadas.

## 2. Decisão Arquitetural

### 2.1. Decisão recomendada

A integração deve ser feita por meio de endpoints HTTP internos no `FynxApi`.

O n8n deve chamar o backend usando um token de serviço. O backend resolve o número de WhatsApp para um usuário verificado e executa as regras de negócio usando os serviços já existentes.

### 2.2. O que não fazer

Não permitir que o n8n leia ou escreva diretamente no banco SQLite.

Motivos:

- ignora validações de domínio;
- ignora autenticação e autorização do backend;
- ignora efeitos colaterais, como gamificação e eventos;
- cria uma segunda API informal dentro do n8n;
- aumenta risco de vazamento entre usuários;
- dificulta migração futura para nuvem ou PostgreSQL;
- acopla o workflow ao schema físico do banco.

### 2.3. Papel de cada componente

```text
+------------------+       +-------------------+       +-------------------+
| Fynx Web         |       | FynxApi           |       | SQLite local      |
| Usuário logado   +------>+ Auth, Financial,  +------>+ Dados do Fynx     |
| cadastra número  | JWT   | WhatsApp Domain   | SQL   |                   |
+------------------+       +-------------------+       +-------------------+

+------------------+       +-------------------+       +-------------------+
| WhatsApp Usuário |       | Evolution API     |       | n8n               |
| envia mensagem   +------>+ recebe mensagem   +------>+ orquestra fluxo   |
+------------------+       +-------------------+       +---------+---------+
                                                                |
                                                                | HTTP interno
                                                                v
                                                        +-------+--------+
                                                        | FynxApi        |
                                                        | resolve número |
                                                        | executa ações  |
                                                        +-------+--------+
                                                                |
                                                                | dados mínimos
                                                                v
                                                        +-------+--------+
                                                        | LLM multimodal |
                                                        | interpreta     |
                                                        +----------------+
```

## 3. Estado Atual Da Codebase

O `FynxApi` já possui uma estrutura separada por domínios:

```text
FynxApi/
  src/
    domains/
      analytics/
        dashboard/
      financial/
        transactions/
        goals/
        custom-categories/
        spending-limits/
      gamification/
        ranking/
      identity/
        auth/
    infrastructure/
      database/
      http/
```

O roteador central atual registra rotas protegidas por JWT para:

```text
/api/v1/auth
/api/v1/dashboard
/api/v1/goals
/api/v1/transactions
/api/v1/ranking
/api/v1/categories/custom
```

O novo domínio deve seguir o mesmo padrão: `routes`, `controller`, `service`, `types` e repositórios quando necessário.

## 4. Arquitetura De Pastas Proposta

### 4.1. Estrutura recomendada e aderente ao FynxApi atual

```text
FynxApi/
  src/
    domains/
      integrations/
        whatsapp/
          config/
            whatsapp.config.ts
          clients/
            evolution-api.client.ts
          repositories/
            user-whatsapp.repository.ts
            whatsapp-otp.repository.ts
            whatsapp-audit.repository.ts
          schemas/
            whatsapp.schemas.ts
          whatsapp.routes.ts
          whatsapp-integration.routes.ts
          whatsapp.controller.ts
          whatsapp-integration.controller.ts
          whatsapp.service.ts
          whatsapp-integration.service.ts
          whatsapp.types.ts
          whatsapp-auth.middleware.ts
          otp.service.ts
          whatsapp-session.service.ts
```

Essa organização segue melhor o estilo já usado no projeto, que possui `config/` dentro de domínios como `analytics/dashboard/config`. O módulo de WhatsApp tem mais superficie de integração do que `transactions` ou `goals`, então vale separar `clients`, `repositories` e `schemas` para evitar que o service vire um arquivo grande demais.

### 4.2. Alternativa mínima para MVP

Se a primeira entrega precisar ser menor, a estrutura mínima aceitável e:

```text
FynxApi/
  src/
    domains/
      integrations/
        whatsapp/
          config/
            whatsapp.config.ts
          whatsapp.routes.ts
          whatsapp-integration.routes.ts
          whatsapp.controller.ts
          whatsapp-integration.controller.ts
          whatsapp.service.ts
          whatsapp-integration.service.ts
          whatsapp.types.ts
          whatsapp.schemas.ts
          whatsapp-auth.middleware.ts
          evolution-api.client.ts
          otp.service.ts
          user-whatsapp.repository.ts
```

Essa versão funciona, mas a estrutura recomendada e melhor para manutenção.

### 4.3. Responsabilidade dos arquivos

```text
config/whatsapp.config.ts
  Centraliza configurações de OTP, rate limit, permissão, Evolution API, mock local e contextRef.

whatsapp.routes.ts
  Define rotas usadas pelo usuário logado no Fynx Web.

whatsapp-integration.routes.ts
  Define rotas internas usadas pelo n8n.

whatsapp.controller.ts
  Recebe request/response das rotas do Fynx Web e chama o service.

whatsapp-integration.controller.ts
  Recebe request/response das rotas internas do n8n.

whatsapp.service.ts
  Orquestra casos de uso do usuário logado: solicitar OTP, confirmar OTP, listar e revogar número.

whatsapp-integration.service.ts
  Orquestra casos de uso do n8n: resolver número, consultar dashboard, criar transação e consultar dados.

whatsapp.schemas.ts
  Schemas Zod para validar payloads recebidos.

whatsapp.types.ts
  Tipos TypeScript do domínio.

whatsapp-auth.middleware.ts
  Valida o token de serviço usado pelo n8n.

evolution-api.client.ts
  Cliente HTTP para enviar mensagens pela Evolution API.

otp.service.ts
  Gera, hasheia, expira e valida códigos OTP.

user-whatsapp.repository.ts
  Acesso a tabela user_whatsapp_accounts e desafios OTP.

whatsapp-session.service.ts
  Cria e valida contextRef usado em chamadas internas.

whatsapp-audit.repository.ts
  Persiste auditoria de mensagens, intenções, ações e erros.
```

### 4.4. Configuração do domínio

Arquivo recomendado:

```text
FynxApi/src/domains/integrations/whatsapp/config/whatsapp.config.ts
```

Conteúdo conceitual:

```ts
export const whatsappConfig = {
  otp: {
    ttlMinutes: Number(process.env.WHATSAPP_OTP_TTL_MINUTES || 10),
    maxAttempts: Number(process.env.WHATSAPP_OTP_MAX_ATTEMPTS || 5),
    resendCooldownSeconds: Number(process.env.WHATSAPP_OTP_RESEND_COOLDOWN_SECONDS || 60),
  },
  evolution: {
    baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instance: process.env.EVOLUTION_INSTANCE || 'FYNX_LOCAL',
    mock: process.env.EVOLUTION_API_MOCK === 'true',
    timeoutMs: Number(process.env.EVOLUTION_API_TIMEOUT_MS || 10000),
  },
  serviceAuth: {
    token: process.env.N8N_SERVICE_TOKEN || '',
  },
  context: {
    secret: process.env.WHATSAPP_CONTEXT_SECRET || '',
    ttlMinutes: Number(process.env.WHATSAPP_CONTEXT_TTL_MINUTES || 15),
  },
  permissions: {
    default: [
      'dashboard:read',
      'transactions:read',
      'transactions:create',
      'goals:read',
      'categories:read',
    ],
  },
};
```

Esse arquivo evita espalhar `process.env` por controller, service e client.

## 5. Camadas E Comunicação Interna

### 5.1. Fluxo de cadastro de número atraves do Fynx Web

```text
Fynx Web
  |
  | POST /api/v1/whatsapp/accounts/request-verification
  | Authorization: Bearer <JWT usuário>
  v
Express Router
  |
  | authenticateToken
  v
WhatsappController
  |
  | valida body com Zod
  v
WhatsappService
  |
  | normaliza telefone
  | gera OTP
  | salva desafio OTP
  | cria/atualiza conta pending
  v
UserWhatsappRepository ---------------> SQLite
  |
  v
EvolutionApiClient -------------------> Evolution API
  |
  v
WhatsApp do usuário recebe código
```

### 5.2. Fluxo de uma mensagem recebida pelo WhatsApp

```text
Usuário envia mensagem no WhatsApp
  |
  v
Evolution API
  |
  | webhook
  v
n8n
  |
  | POST /api/v1/integrations/whatsapp/resolve
  | Authorization: Bearer <N8N_SERVICE_TOKEN>
  v
FynxApi
  |
  | valida token de serviço
  | normaliza phone
  | busca phone_hash verificado
  | cria contextRef opaco
  v
n8n recebe contexto autorizado
  |
  | envia mensagem/mídia para LLM com tools limitadas
  v
LLM retorna intenção estruturada
  |
  | n8n chama action endpoint do FynxApi
  v
FynxApi executa regra de negócio
  |
  v
n8n envia resposta via Evolution API
  |
  v
WhatsApp do usuário
```

### 5.3. Fluxo de criação de transação por mensagem

```text
Mensagem:
  "gastei 45 no almoco hoje"

Evolution API
  |
  v
n8n
  |
  | resolve número
  v
FynxApi
  |
  | retorna contextRef
  v
n8n
  |
  | chama LLM
  v
LLM
  |
  | retorna JSON:
  | {
  |   intent: "create_transaction",
  |   data: {
  |     type: "expense",
  |     amount: 45,
  |     description: "Almoço",
  |     category: "Alimentação",
  |     date: "2026-05-13"
  |   }
  | }
  v
n8n
  |
  | POST /api/v1/integrations/whatsapp/actions/transactions/create
  v
FynxApi
  |
  | valida contextRef
  | valida payload
  | chama createTransactionUseCase
  | registra auditoria
  v
n8n
  |
  | envia confirmação
  v
WhatsApp:
  "Transação registrada: Almoço, R$ 45,00, Alimentação."
```

### 5.4. Lógica natural do fluxo OTP

O fluxo OTP existe para garantir que o usuário realmente controla o número informado no Fynx Web.

Funcionamento:

1. O usuário entra no Fynx Web já autenticado.
2. Ele informa um número de WhatsApp.
3. O frontend envia esse número para o FynxApi usando o JWT normal do usuário.
4. O backend normaliza o número para formato E.164.
5. O backend calcula um hash do telefone normalizado.
6. O backend verifica se esse telefone já está verificado para outro usuário.
7. Se o número estiver livre ou pendente para o mesmo usuário, o backend gera um código OTP de 6 dígitos.
8. O backend salva o hash do código na tabela de desafios OTP.
9. O backend envia o código para o telefone usando a Evolution API.
10. O usuário recebe o código no WhatsApp.
11. O usuário digita o código no Fynx Web.
12. O backend compara o código informado com o hash salvo.
13. Se estiver correto e dentro do prazo, o número passa para `verified`.
14. A partir desse momento, mensagens vindas daquele número podem ser resolvidas pelo n8n.

Regras importantes:

- o OTP não deve ser salvo em texto puro;
- o OTP deve expirar;
- tentativas inválidas devem incrementar contador;
- muitas tentativas devem bloquear o desafio;
- solicitar novo OTP deve invalidar desafios antigos pendentes;
- número verificado por outro usuário não pode ser tomado sem processo de revogação/administração.

#### 5.4.1. Quando o OTP esta errado

Quando o usuário informa um código incorreto, o backend não deve dizer qual parte esta errada e não deve revelar se o código correto está perto ou longe. A resposta deve ser genérica.

Fluxo:

```text
Usuário informa OTP
  |
  v
FynxApi busca desafio pending mais recente
  |
  v
FynxApi verifica expiração
  |
  v
FynxApi compara código informado com code_hash
  |
  +-- código correto --> marca used, marca conta verified
  |
  +-- código errado --> incrementa attempts
                         |
                         +-- attempts < limite --> retorna 400 código inválido
                         |
                         +-- attempts >= limite --> marca desafio blocked e retorna 429
```

Resposta para código errado ainda dentro do limite:

```json
{
  "error": "Código de verificação inválido.",
  "code": "WHATSAPP_OTP_INVALID",
  "remainingAttempts": 3
}
```

Resposta quando o limite de tentativas foi atingido:

```json
{
  "error": "Limite de tentativas excedido. Solicite um novo código.",
  "code": "WHATSAPP_OTP_ATTEMPTS_EXCEEDED"
}
```

Regra importante: `remainingAttempts` é útil para UX, mas não deve ser usado se a equipe quiser reduzir ainda mais informação para atacantes. Em ambiente de maior rigor, retornar apenas mensagem genérica.

#### 5.4.2. Quando o OTP esta expirado

O OTP deve expirar por tempo, mesmo que o usuário ainda não tenha usado nenhuma tentativa.

Fluxo:

```text
Usuário informa OTP
  |
  v
FynxApi busca desafio pending
  |
  v
now > expires_at?
  |
  +-- sim --> marca desafio expired e retorna 410
  |
  +-- não --> continua validação normal
```

Resposta:

```json
{
  "error": "Código expirado. Solicite um novo código de verificação.",
  "code": "WHATSAPP_OTP_EXPIRED"
}
```

#### 5.4.3. Quando o usuário pede OTP muitas vezes

O endpoint de solicitar OTP deve ter cooldown para evitar abuso, custo desnecessario na Evolution API e spam no WhatsApp do usuário.

Fluxo:

```text
Usuário solicita OTP
  |
  v
FynxApi normaliza telefone e calcula phone_hash
  |
  v
Existe OTP recente para esse user_id + phone_hash?
  |
  +-- sim, criado há menos de 60s --> retorna 429 cooldown
  |
  +-- não --> inválida OTPs pendentes antigos, gera novo OTP e envia
```

Resposta durante cooldown:

```json
{
  "error": "Aguarde antes de solicitar um novo código.",
  "code": "WHATSAPP_OTP_COOLDOWN",
  "retryAfterSeconds": 42
}
```

Regra recomendada:

```text
cooldown entre envios:
  60 segundos por user_id + phone_hash

limite por hora:
  3 códigos por phone_hash

limite por dia:
  10 códigos por user_id
```

#### 5.4.4. Quando o número já pertence a outro usuário

Se o telefone já esta `verified` para outro `user_id`, o backend deve impedir o cadastro automático.

Resposta:

```json
{
  "error": "Este número já esta vinculado a outra conta.",
  "code": "WHATSAPP_PHONE_ALREADY_LINKED"
}
```

Para evitar vazamento de informação, se o produto exigir mais privacidade, a mensagem pública pode ser mais neutra:

```json
{
  "error": "Não foi possível vincular este número. Entre em contato com o suporte.",
  "code": "WHATSAPP_PHONE_LINK_FAILED"
}
```

#### 5.4.5. Reenvio de OTP

Quando o usuário pede reenvio depois do cooldown:

1. O backend marca desafios pendentes anteriores como `expired`.
2. Gera novo código.
3. Salva novo `code_hash`.
4. Envia nova mensagem via Evolution API.
5. Apenas o OTP mais recente deve ser aceito.

Isso evita que códigos antigos ainda funcionem depois de um reenvio.

### 5.5. Lógica natural do fluxo de transação

Esse fluxo permite que o usuário diga algo como:

```text
gastei 45 no almoco hoje
recebi 2500 de salario
adicione 89,90 em mercado ontem
```

Funcionamento:

1. A mensagem chega no WhatsApp.
2. A Evolution API entrega a mensagem ao webhook do n8n.
3. O n8n extrai o telefone remetente.
4. O n8n chama o endpoint `/resolve` do FynxApi.
5. O FynxApi valida o token de serviço do n8n.
6. O FynxApi normaliza e hasheia o telefone.
7. O FynxApi busca uma conta WhatsApp `verified`.
8. Se não Encontrar, o n8n responde orientando o cadastro no Fynx Web.
9. Se encontrar, o FynxApi retorna um `contextRef`.
10. O n8n envia a mensagem para a LLM com instrucoes e schema JSON.
11. A LLM extrai intenção, valor, tipo, categoria, descrição e data.
12. O n8n valida se o JSON retornado esta correto.
13. Se faltar dado, o n8n pergunta ao usuário.
14. Se estiver completo, o n8n chama o endpoint interno de criação de transação.
15. O FynxApi valida o `contextRef`.
16. O FynxApi recupera o `user_id` internamente.
17. O FynxApi valida o payload da transação com Zod.
18. O FynxApi chama o use case de criação de transação já existente.
19. O FynxApi registra auditoria.
20. O n8n recebe a transação criada e envia uma confirmação no WhatsApp.

Campos mínimos para criar transação:

```text
type: income ou expense
amount: número positivo
description: texto curto
category: categoria existente ou aceita pelo domínio
date: YYYY-MM-DD
```

Quando pedir confirmação:

- valor alto;
- categoria inferida com baixa confiança;
- data ambígua;
- mensagem com mais de uma transação;
- usuário pediu para alterar ou excluir algo;
- LLM retornou confiança baixa.

### 5.6. Lógica natural do fluxo de consulta de saldo e dashboard

Esse fluxo permite perguntas como:

```text
quanto gastei esse mês?
qual meu saldo mensal?
como estão minhas despesas?
qual categoria mais consumiu dinheiro?
```

Funcionamento:

1. A mensagem chega pelo WhatsApp.
2. O n8n resolve o telefone no FynxApi.
3. A LLM classifica a intenção como consulta financeira.
4. O n8n chama uma action de dashboard ou summary.
5. O FynxApi valida o `contextRef`.
6. O FynxApi chama `DashboardService.getDashboardData(userId)` ou serviços de resumo de transações.
7. O FynxApi retorna dados estruturados para o n8n.
8. A LLM transforma esses dados em uma resposta curta e clara.
9. O n8n envia a resposta no WhatsApp.

Regra importante: a LLM deve receber apenas os dados necessários para responder a pergunta. Se o usuário perguntar "quanto gastei esse mês?", não há necessidade de enviar todo o histórico detalhado de transações.

Exemplo de resposta:

```text
Neste mês você teve R$ 2.300,00 em despesas. A maior categoria foi Alimentação, com R$ 720,00.
```

### 5.7. Lógica natural do fluxo de categorias

Esse fluxo permite:

```text
quais categorias posso usar?
crie a categoria Freelance como receita
use Alimentação nessa transação
```

MVP recomendado:

- permitir consultar categorias;
- permitir usar uma categoria existente na criação de transação;
- não permitir criar categoria automaticamente sem confirmação.

Funcionamento para consulta:

1. Usuário pergunta pelas categorias.
2. n8n resolve o telefone.
3. LLM identifica intenção `categories:list`.
4. n8n chama action de categorias.
5. FynxApi retorna categorias globais e, se aplicável, categorias customizadas do usuário.
6. n8n responde no WhatsApp.

Funcionamento para categoria nova:

1. Usuário diz "crie categoria Freelance".
2. LLM identifica criação de categoria.
3. Como cria dados novos, o n8n pede confirmação.
4. Após confirmação, n8n chama endpoint específico.
5. FynxApi valida se já existe categoria ativa com mesmo nome e tipo.
6. FynxApi cria categoria customizada para o usuário.
7. n8n confirma no WhatsApp.

No MVP, se ainda não quiser liberar criação via WhatsApp, o bot deve responder:

```text
Ainda não posso criar categorias pelo WhatsApp. Você pode criar essa categoria no Fynx Web.
```

### 5.8. Lógica natural do fluxo de metas

Esse fluxo permite:

```text
como estão minhas metas?
quanto falta para minha reserva?
crie uma meta de guardar 5000 reais até dezembro
```

MVP recomendado:

- permitir consultar metas;
- não permitir criar, editar ou excluir metas sem confirmação explícita;
- iniciar com leitura antes de liberar escrita.

Funcionamento para consulta:

1. Usuário pergunta sobre metas.
2. n8n resolve o telefone.
3. LLM identifica intenção `goals:list` ou `goals:summary`.
4. n8n chama action de metas.
5. FynxApi chama `GoalsService.getGoalsData(userId)`.
6. FynxApi retorna metas e progresso.
7. LLM formata resposta curta.
8. n8n envia pelo WhatsApp.

Funcionamento para criar meta futuramente:

1. Usuário pede criação de meta.
2. LLM extrai título, categoria, valor alvo, período, data inicial e data final.
3. Se faltar qualquer campo essencial, o n8n pergunta.
4. Se estiver completo, o n8n pede confirmação.
5. Após confirmação, n8n chama endpoint interno de criação de meta.
6. FynxApi valida permissão `goals:create`.
7. FynxApi cria a meta usando o service de goals.
8. FynxApi registra auditoria.
9. n8n confirma no WhatsApp.

No MVP, `goals:create` deve ficar bloqueado até existir boa experiência de confirmação.

## 6. Autenticação E Autorização

### 6.1. Usuário logado no Fynx Web

Usa o JWT atual do sistema:

```http
Authorization: Bearer <fynx_user_jwt>
```

Esse token permite:

- cadastrar número de WhatsApp;
- solicitar OTP;
- confirmar OTP;
- listar números vinculados;
- revogar número.

### 6.2. n8n como sistema autorizado

O n8n usa um token de serviço:

```http
Authorization: Bearer <N8N_SERVICE_TOKEN>
```

Esse token deve ficar em:

```text
FynxApi .env
n8n credentials
```

O token de serviço não representa um usuário final. Ele apenas autentica a integração.

### 6.3. Resolucao do usuário

O usuário final é resolvido pelo número verificado:

```text
phone recebido do WhatsApp
  -> normalizacao E.164
  -> hash do telefone
  -> busca user_whatsapp_accounts.status = verified
  -> user_id interno
  -> contextRef opaco
```

O `user_id` não deve ser enviado para a LLM.

### 6.4. contextRef

O `contextRef` é um identificador opaco usado entre n8n e FynxApi.

Ele pode ser:

- um JWT interno assinado com segredo específico;
- ou um identificador de sessão persistido em tabela temporária.

Recomendação inicial: JWT interno curto, com expiração de 15 minutos.

Payload interno sugerido:

```json
{
  "sub": "user:123",
  "phoneHash": "hash...",
  "permissions": [
    "dashboard:read",
    "transactions:read",
    "transactions:create",
    "goals:read",
    "categories:read"
  ],
  "iat": 1778670000,
  "exp": 1778670900
}
```

O n8n pode armazenar esse `contextRef` durante a execução do workflow. A LLM não precisa receber esse valor.

## 7. Variaveis De Ambiente

### 7.1. Ambiente local

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=local_jwt_secret
ALLOWED_ORIGIN=http://localhost:5173

N8N_SERVICE_TOKEN=local_n8n_service_token
WHATSAPP_CONTEXT_SECRET=local_whatsapp_context_secret

EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=local_evolution_key
EVOLUTION_INSTANCE=FYNX_LOCAL

WHATSAPP_OTP_TTL_MINUTES=10
WHATSAPP_OTP_MAX_ATTEMPTS=5
WHATSAPP_OTP_RESEND_COOLDOWN_SECONDS=60
WHATSAPP_MAX_MESSAGES_PER_PHONE_PER_MINUTE=10
```

### 7.2. Ambiente de nuvem

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<secret forte>
ALLOWED_ORIGIN=https://app.fynx.com.br

N8N_SERVICE_TOKEN=<secret forte rotacionavel>
WHATSAPP_CONTEXT_SECRET=<secret forte separado>

EVOLUTION_API_URL=https://evolution.fynx.com.br
EVOLUTION_API_KEY=<api key>
EVOLUTION_INSTANCE=FYNX_PROD

WHATSAPP_OTP_TTL_MINUTES=10
WHATSAPP_OTP_MAX_ATTEMPTS=5
WHATSAPP_OTP_RESEND_COOLDOWN_SECONDS=60
WHATSAPP_MAX_MESSAGES_PER_PHONE_PER_MINUTE=10
```

## 8. Banco De Dados

### 8.0. Decisão sobre quantidade de tabelas

Para o MVP, não é necessário criar uma tabela para cada detalhe do fluxo. A separação deve existir quando ela reduz risco ou simplifica a regra de negócio.

Classificacao recomendada:

```text
Obrigatória:
  user_whatsapp_accounts
    Guarda o vínculo entre usuário e número autorizado.

Obrigatória:
  whatsapp_otp_challenges
    Guarda o desafio OTP, expiração e tentativas. Separar essa tabela evita poluir a tabela de contas com histórico temporario.

Recomendada:
  whatsapp_audit_logs
    Guarda auditoria das ações feitas pelo bot. Importante para suporte, Segurança e investigação de erros.

Opcional no MVP:
  whatsapp_message_events
    Guarda idempotência por providerMessageId. Pode ser incorporada em whatsapp_audit_logs no início, desde que exista campo Único para providerMessageId.
```

Versão enxuta para primeira entrega:

```text
1. user_whatsapp_accounts
2. whatsapp_otp_challenges
3. whatsapp_audit_logs com coluna provider_message_id UNIQUE opcional
```

Versão mais robusta para produção:

```text
1. user_whatsapp_accounts
2. whatsapp_otp_challenges
3. whatsapp_audit_logs
4. whatsapp_message_events
```

Recomendação prática: implementar 3 tabelas no MVP e deixar `whatsapp_message_events` como evolução se a idempotência ficar mais complexa.

### 8.1. Tabela user_whatsapp_accounts

Responsável por vincular usuários do Fynx a números de WhatsApp verificados.

```sql
CREATE TABLE IF NOT EXISTS user_whatsapp_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  phone_e164 TEXT NOT NULL UNIQUE,
  phone_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'revoked')) DEFAULT 'pending',
  verified_at DATETIME,
  revoked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

Campos:

```text
id
  Identificador interno.

user_id
  Usuário dono do número.

phone_e164
  Telefone normalizado. Exemplo: +5511999999999.

phone_hash
  Hash do telefone normalizado. Usado para busca e auditoria segura.

status
  pending, verified ou revoked.

verified_at
  Data de confirmação do OTP.

revoked_at
  Data de revogação.
```

### 8.2. Tabela whatsapp_otp_challenges

Responsável pelos desafios de verificação.

```sql
CREATE TABLE IF NOT EXISTS whatsapp_otp_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  phone_e164 TEXT NOT NULL,
  phone_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'used', 'expired', 'blocked')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

Regras:

- salvar apenas `code_hash`, nunca o OTP em texto puro;
- expirar automaticamente por `expires_at`;
- bloquear após `WHATSAPP_OTP_MAX_ATTEMPTS`;
- invalidar desafios antigos quando novo OTP for solicitado para o mesmo usuário e telefone.

### 8.3. Tabela whatsapp_message_events opcional

Responsável por idempotência. Evita processar a mesma mensagem duas vezes. No MVP, essa responsabilidade pode ficar em `whatsapp_audit_logs.provider_message_id`. Crie esta tabela separada se os retries, reprocessamentos e status de mensagens ficarem complexos.

```sql
CREATE TABLE IF NOT EXISTS whatsapp_message_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_message_id TEXT NOT NULL UNIQUE,
  phone_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processed', 'ignored', 'failed')) DEFAULT 'processed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8.4. Tabela whatsapp_audit_logs

Responsável por rastrear tudo que aconteceu no bot.

```sql
CREATE TABLE IF NOT EXISTS whatsapp_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  phone_hash TEXT,
  provider_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  intent TEXT,
  action TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'blocked', 'pending_confirmation')),
  request_payload TEXT,
  response_payload TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

Observação: `request_payload` e `response_payload` devem ser sanitizados. Não registrar token, OTP, telefone puro, senha ou dados sensíveis desnecessarios.

No MVP, `provider_message_id` pode ser usado para deduplicação simples. Em SQLite, se desejar garantir unicidade apenas quando o valor existir, criar índice Único parcial:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_audit_provider_message
ON whatsapp_audit_logs(provider_message_id)
WHERE provider_message_id IS NOT NULL;
```

### 8.5. Alteração no schema.ts

Adicionar as tabelas ao objeto `SCHEMA` em:

```text
FynxApi/src/infrastructure/database/schema.ts
```

Exemplo de chaves:

```ts
user_whatsapp_accounts: `...`,
whatsapp_otp_challenges: `...`,
whatsapp_audit_logs: `...`
// opcional em produção:
whatsapp_message_events: `...`
```

## 9. Rotas HTTP

### 9.1. Rotas do usuário logado

Prefixo:

```text
/api/v1/whatsapp
```

Devem usar `authenticateToken`.

#### POST /api/v1/whatsapp/accounts/request-verification

Solicita envio de OTP para o número informado.

Request:

```json
{
  "phone": "+5511999999999"
}
```

Response 200:

```json
{
  "status": "pending",
  "message": "Código de verificação enviado pelo WhatsApp.",
  "expiresInMinutes": 10
}
```

Erros:

```text
400 telefone inválido
401 JWT ausente
403 JWT inválido
409 número já verificado por outro usuário
429 muitas tentativas de OTP
500 erro ao enviar mensagem
```

#### POST /api/v1/whatsapp/accounts/confirm-verification

Confirma o OTP.

Request:

```json
{
  "phone": "+5511999999999",
  "code": "482913"
}
```

Response 200:

```json
{
  "status": "verified",
  "message": "WhatsApp verificado com sucesso."
}
```

Erros:

```text
400 código inválido
401 JWT ausente
403 JWT inválido
404 desafio não Encontrado
410 código expirado
429 limite de tentativas excedido
```

#### GET /api/v1/whatsapp/accounts

Lista números vinculados ao usuário.

Response 200:

```json
[
  {
    "id": 1,
    "phoneMasked": "+55 11 *****-9999",
    "status": "verified",
    "verifiedAt": "2026-05-13T10:00:00.000Z"
  }
]
```

#### DELETE /api/v1/whatsapp/accounts/:id

Revoga um número.

Response 204.

### 9.2. Rotas internas da integração n8n

Prefixo:

```text
/api/v1/integrations/whatsapp
```

Devem usar `authenticateWhatsappService`.

#### POST /api/v1/integrations/whatsapp/resolve

Resolve o número recebido pelo WhatsApp em um contexto autorizado.

Request:

```json
{
  "phone": "+5511999999999",
  "providerMessageId": "evolution_msg_abc123"
}
```

Response 200:

```json
{
  "authorized": true,
  "contextRef": "ctx_or_jwt_interno",
  "displayName": "Douglas",
  "permissions": [
    "dashboard:read",
    "transactions:read",
    "transactions:create",
    "goals:read",
    "categories:read"
  ]
}
```

Response 403:

```json
{
  "authorized": false,
  "reason": "PHONE_NOT_VERIFIED"
}
```

#### POST /api/v1/integrations/whatsapp/actions/dashboard

Consulta métricas do dashboard para o usuário resolvido.

Request:

```json
{
  "contextRef": "ctx_or_jwt_interno"
}
```

Response 200:

```json
{
  "overview": [],
  "spendingByCategory": [],
  "incomeByCategory": [],
  "recentTransactions": []
}
```

#### POST /api/v1/integrations/whatsapp/actions/transactions/create

Cria uma transação.

Request:

```json
{
  "contextRef": "ctx_or_jwt_interno",
  "transaction": {
    "type": "expense",
    "amount": 45,
    "description": "Almoço",
    "category": "Alimentação",
    "date": "2026-05-13"
  },
  "source": {
    "providerMessageId": "evolution_msg_abc123",
    "inputType": "text"
  }
}
```

Response 201:

```json
{
  "id": "123",
  "type": "expense",
  "amount": 45,
  "description": "Almoço",
  "category": "Alimentação",
  "date": "2026-05-13"
}
```

#### POST /api/v1/integrations/whatsapp/actions/transactions/search

Busca transações do usuário resolvido.

Request:

```json
{
  "contextRef": "ctx_or_jwt_interno",
  "filters": {
    "type": "expense",
    "startDate": "2026-05-01",
    "endDate": "2026-05-13",
    "category": "Alimentação",
    "limit": 10
  }
}
```

#### POST /api/v1/integrations/whatsapp/actions/goals

Consulta metas.

Request:

```json
{
  "contextRef": "ctx_or_jwt_interno"
}
```

#### POST /api/v1/integrations/whatsapp/actions/categories

Consulta categorias disponíveis.

Request:

```json
{
  "contextRef": "ctx_or_jwt_interno"
}
```

## 10. Permissões Da Integração

### 10.1. Permissões iniciais

```text
dashboard:read
transactions:read
transactions:create
goals:read
categories:read
```

### 10.2. Permissões futuras com confirmação

```text
transactions:update
transactions:delete
goals:create
goals:update
categories:create
```

### 10.3. Permissões bloqueadas no MVP

```text
ranking:update
ranking:reset
admin:*
auth:*
users:*
```

## 11. LLM E Tools

### 11.1. Principio

A LLM interpreta. O FynxApi executa.

A LLM não recebe:

- `user_id`;
- telefone real;
- JWT do usuário;
- token de serviço;
- SQL;
- acesso direto ao banco;
- payloads completos com dados sensíveis desnecessarios.

### 11.2. Entrada recomendada para a LLM

```json
{
  "message": "gastei 45 no almoco hoje",
  "userContext": {
    "displayName": "Douglas",
    "locale": "pt-BR",
    "currency": "BRL"
  },
  "availableActions": [
    "consultar_dashboard",
    "criar_transacao",
    "listar_transacoes",
    "consultar_metas",
    "consultar_categorias"
  ]
}
```

### 11.3. Saída obrigatória da LLM

```json
{
  "intent": "create_transaction",
  "confidence": 0.94,
  "requiresConfirmation": false,
  "missingFields": [],
  "data": {
    "type": "expense",
    "amount": 45,
    "description": "Almoço",
    "category": "Alimentação",
    "date": "2026-05-13"
  },
  "replyDraft": "Vou registrar uma despesa de R$ 45,00 em Alimentação com descrição Almoço."
}
```

### 11.4. Regras de confirmação

Confirmacao obrigatória quando:

- a intenção tiver baixa confiança;
- faltar campo obrigatório;
- houver ambiguidade de data;
- valor for acima de limite configurado;
- usuário pedir edição ou exclusão;
- usuário pedir ação em lote;
- usuário pedir algo fora das permissões atuais.

Exemplo:

```json
{
  "intent": "create_transaction",
  "confidence": 0.62,
  "requiresConfirmation": true,
  "missingFields": ["category"],
  "question": "Qual categoria devo usar para essa transação?"
}
```

## 12. Tipos De Mídia

### 12.1. Texto

Fluxo simples:

```text
WhatsApp texto -> n8n -> LLM -> FynxApi action
```

### 12.2. Áudio

```text
WhatsApp áudio
  -> Evolution API
  -> n8n baixa arquivo
  -> transcricao
  -> LLM recebe texto transcrito
  -> FynxApi action
```

### 12.3. Imagem

Casos esperados:

- nota fiscal;
- comprovante;
- print de compra;
- imagem com texto.

```text
WhatsApp imagem
  -> n8n baixa imagem
  -> LLM multimodal extrai dados
  -> se confiança baixa, pedir confirmação
  -> FynxApi cria transação
```

### 12.4. Vídeo

MVP:

- extrair áudio;
- transcrever;
- opcionalmente extrair frames;
- enviar texto resumido para LLM.

```text
WhatsApp vídeo
  -> n8n baixa vídeo
  -> extrai áudio/frame
  -> LLM interpreta
  -> FynxApi action
```

## 13. Evolution API

### 13.1. Envio de OTP

O `EvolutionApiClient` deve chamar a Evolution API para enviar o código.

Payload conceitual:

```json
{
  "number": "5511999999999",
  "text": "Seu código de verificação Fynx e: 482913. Ele expira em 10 minutos."
}
```

O formato exato depende da versão/configuração da Evolution API usada no ambiente.

### 13.2. Webhook de entrada

Recomendação: configurar a Evolution API para chamar um webhook do n8n, não diretamente o FynxApi.

Motivo:

- n8n orquestra midias;
- n8n chama LLM;
- n8n controla fluxo conversacional;
- FynxApi fica responsável por Segurança e regras de negócio.

## 14. Implementação No FynxApi

### 14.1. Passo 1: Criar tabelas no schema

Adicionar as tabelas em:

```text
FynxApi/src/infrastructure/database/schema.ts
```

Tabelas:

```text
user_whatsapp_accounts
whatsapp_otp_challenges
whatsapp_audit_logs
```

`whatsapp_message_events` deve ser adicionada somente se a equipe decidir separar idempotência da auditoria.

### 14.2. Passo 2: Criar middleware do token de serviço

Arquivo:

```text
FynxApi/src/domains/integrations/whatsapp/whatsapp-auth.middleware.ts
```

Responsabilidade:

```text
ler Authorization
validar Bearer token
comparar com N8N_SERVICE_TOKEN
retornar 401/403 se inválido
chamar next() se válido
```

### 14.3. Passo 3: Criar OtpService

Responsabilidade:

```text
gerar código randômico de 6 dígitos
criar hash seguro
validar código
calcular expiração
controlar tentativas
```

Recomendação:

- usar `crypto.randomInt(100000, 999999)`;
- usar `bcrypt` para hash do OTP, já presente no projeto;
- TTL padrão: 10 minutos;
- tentativas maximas: 5.

### 14.4. Passo 4: Criar EvolutionApiClient

Responsabilidade:

```text
enviar texto para número
tratar erro da Evolution API
timeout curto
log seguro
```

Em ambiente local, se a Evolution API não Estiver disponível, permitir modo mock:

```env
EVOLUTION_API_MOCK=true
```

Nesse modo, o código não é enviado de verdade, mas o backend registra log de desenvolvimento.

### 14.5. Passo 5: Criar WhatsappService

Métodos recomendados:

```ts
requestVerification(userId: number, phone: string)
confirmVerification(userId: number, phone: string, code: string)
listAccounts(userId: number)
revokeAccount(userId: number, accountId: string)
resolvePhone(phone: string, providerMessageId?: string)
getDashboard(contextRef: string)
createTransaction(contextRef: string, payload: CreateWhatsappTransactionPayload)
searchTransactions(contextRef: string, filters: WhatsappTransactionFilters)
getGoals(contextRef: string)
getCategories(contextRef: string)
```

### 14.6. Passo 6: Registrar rotas

Adicionar ao roteador central:

```ts
import whatsappRoutes from '../../../domains/integrations/whatsapp/whatsapp.routes.js';
import whatsappIntegrationRoutes from '../../../domains/integrations/whatsapp/whatsapp-integration.routes.js';

router.use('/whatsapp', authenticateToken, whatsappRoutes);
router.use('/integrations/whatsapp', authenticateWhatsappService, whatsappIntegrationRoutes);
```

Se preferir evitar dois arquivos de rotas, o mesmo `whatsapp.routes.ts` pode exportar dois routers.

### 14.7. Passo 7: Reaproveitar serviços existentes

A camada WhatsApp não deve duplicar regra financeira.

Para dashboard:

```text
usar DashboardService.getDashboardData(userId)
```

Para transações:

```text
usar createTransactionUseCase.execute(data, userId)
usar transactionRepository.findAll(userId, filters, page, limit)
usar TransactionsService.getTransactionsSummary(userId)
usar TransactionsService.getTransactionsStats(userId)
```

Para goals:

```text
usar GoalsService.getGoalsData(userId)
```

Para categorias:

```text
usar categoryRepository.findAll()
usar CustomCategoriesService para categorias do usuário, se aplicável
```

## 15. Workflow n8n

### 15.1. Workflow principal

```text
[Evolution Webhook]
        |
        v
[Normalize Phone]
        |
        v
[HTTP Request: FynxApi /resolve]
        |
        +-- unauthorized --> [Send WhatsApp: número não autorizado]
        |
        v
[Detect Message Type]
        |
        +-- text  --> [LLM]
        +-- áudio --> [Download] -> [Transcribe] -> [LLM]
        +-- image --> [Download] -> [LLM vision]
        +-- vídeo --> [Download] -> [Extract áudio/frame] -> [LLM]
        |
        v
[Validate LLM JSON]
        |
        +-- missing data --> [Ask clarification]
        +-- needs confirmation --> [Ask confirmation]
        |
        v
[HTTP Request: FynxApi action]
        |
        v
[Format response]
        |
        v
[Evolution API send message]
```

### 15.2. Workflow de confirmação

```text
Usuário pede ação sensível
  |
  v
LLM identifica requiresConfirmation = true
  |
  v
n8n salva pending action em storage ou banco auxiliar
  |
  v
WhatsApp: "Confirma registrar R$ 450,00 em Lazer?"
  |
  v
Usuário responde "sim"
  |
  v
n8n recupera pending action
  |
  v
FynxApi executa action
  |
  v
WhatsApp confirma resultado
```

Para produção, pending actions devem ter expiração curta.

## 16. Tratamento De Erros

### 16.1. Número não autorizado

Resposta:

```text
Este número ainda não Está autorizado no Fynx. Acesse sua conta no Fynx Web e cadastre seu WhatsApp.
```

### 16.2. OTP inválido

Resposta no Fynx Web:

```text
Código inválido. Verifique o código recebido no WhatsApp.
```

### 16.3. OTP expirado

Resposta:

```text
Código expirado. Solicite um novo código de verificação.
```

### 16.4. LLM com baixa confiança

Resposta:

```text
Não consegui identificar todos os dados. Você pode confirmar o valor, categoria e data?
```

### 16.5. Erro de API financeira

Resposta:

```text
Não consegui registrar agora. Tente novamente em alguns instantes.
```

Internamente:

- registrar auditoria;
- registrar erro técnico;
- não Expor stack trace ao usuário.

## 17. Segurança

### 17.1. Regras obrigatórias

- n8n nunca acessa banco diretamente.
- LLM nunca recebe `user_id`.
- LLM nunca recebe telefone real.
- LLM nunca recebe token.
- OTP nunca e salvo em texto puro.
- Token de serviço fica somente no FynxApi e no n8n.
- Todo endpoint interno valida `N8N_SERVICE_TOKEN`.
- Toda action valida `contextRef`.
- Toda action valida permissões.
- Toda action registra auditoria.
- Ações destrutivas exigem confirmação.
- Mensagens repetidas devem ser deduplicadas por `providerMessageId`.

### 17.2. Rate limits

Aplicar limites específicos:

```text
request-verification:
  máximo 3 OTP por telefone por hora
  cooldown de 60 segundos entre envios

confirm-verification:
  máximo 5 tentativas por desafio

resolve:
  máximo por phone_hash por minuto

actions:
  máximo por contextRef por minuto
```

### 17.2.1. Matriz recomendada de rate limit

Os limites abaixo são valores iniciais para desenvolvimento e homologação. Em produção, devem ser ajustados com base no uso real e nos custos da Evolution API e da LLM.

```text
Endpoint:
  POST /api/v1/whatsapp/accounts/request-verification

Chave de rate limit:
  user_id + phone_hash

Limite recomendado:
  1 requisição por 60 segundos
  3 requisições por hora por phone_hash
  10 requisições por dia por user_id

Motivo:
  Evitar spam de OTP, custo externo e tentativa de abuso.
```

```text
Endpoint:
  POST /api/v1/whatsapp/accounts/confirm-verification

Chave de rate limit:
  otp_challenge_id

Limite recomendado:
  5 tentativas por desafio

Motivo:
  Evitar brute force do código OTP.
```

```text
Endpoint:
  POST /api/v1/integrations/whatsapp/resolve

Chave de rate limit:
  phone_hash + IP/origem do n8n

Limite recomendado:
  20 requisições por minuto por phone_hash

Motivo:
  Evitar loop de workflow ou ataque usando o endpoint de resolucao.
```

```text
Endpoint:
  POST /api/v1/integrations/whatsapp/actions/*

Chave de rate limit:
  contextRef ou user_id interno

Limite recomendado:
  30 actions por minuto por usuário
  5 actions de escrita por minuto por usuário

Motivo:
  Evitar criação acidental em massa e loops da LLM/n8n.
```

```text
Endpoint:
  actions/transactions/create

Chave adicional:
  providerMessageId

Limite recomendado:
  providerMessageId deve ser idempotente

Motivo:
  Retries do webhook não podem criar transações duplicadas.
```

### 17.2.2. Como implementar rate limit no FynxApi

O projeto já usa `express-rate-limit` globalmente. Para o domínio WhatsApp, criar limitadores específicos em `whatsapp.routes.ts` ou em um middleware dedicado.

Padrão sugerido:

```text
rate limit global da API
  protege tudo de abuso geral

rate limit específico de OTP
  protege envio de código

rate limit específico de confirmação OTP
  protege brute force

rate limit específico de actions
  protege loops e escritas em massa
```

Para limites baseados em `user_id`, `phone_hash` ou `contextRef`, o rate limit precisa de uma key customizada. Em desenvolvimento com SQLite e processo Único, memória local pode funcionar. Em produção com múltiplas instancias, usar Redis ou outro storage compartilhado.

### 17.2.3. Respostas padrão para rate limit

Resposta genérica:

```json
{
  "error": "Muitas requisições. Tente novamente em alguns instantes.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfterSeconds": 60
}
```

Resposta específica para OTP:

```json
{
  "error": "Aguarde antes de solicitar um novo código.",
  "code": "WHATSAPP_OTP_RATE_LIMITED",
  "retryAfterSeconds": 60
}
```

O n8n deve respeitar `retryAfterSeconds` e não repetir automaticamente antes desse prazo.

### 17.3. Logs

Não logar:

- OTP;
- senha;
- token;
- telefone completo em produção;
- payload bruto de mídia;
- dados financeiros excessivos.

Logar:

- `phone_hash`;
- user_id interno somente no backend;
- action executada;
- status;
- erro resumido;
- providerMessageId;
- timestamp.

### 17.4. LGPD e privacidade

Princípios:

- coletar somente o telefone necessário;
- permitir revogação;
- informar finalidade do uso;
- registrar consentimento implicito no cadastro;
- mascarar telefone no frontend;
- evitar persistir conteúdo integral de conversas sem necessidade.

## 18. Otimização E Resiliencia

### 18.1. Timeouts

Configurar timeout curto para Evolution API e chamadas externas:

```text
Evolution API send: 5s a 10s
LLM: depende do provedor, mas com fallback de erro amigavel
FynxApi internal actions: 10s
```

### 18.2. Idempotência

Usar `providerMessageId` para evitar duplicidade.

Fluxo:

```text
recebe providerMessageId
  -> verifica provider_message_id em whatsapp_audit_logs no MVP
  -> ou verifica whatsapp_message_events em uma versão mais robusta
  -> se já processado, ignora ou retorna Último resultado
  -> se novo, processa
  -> grava status
```

### 18.3. Fila futura

No MVP, o n8n pode processar direto.

Em produção com volume maior, considerar:

```text
Webhook -> fila -> worker -> LLM -> FynxApi -> resposta
```

Ferramentas possíveis:

- Redis;
- BullMQ;
- RabbitMQ;
- filas nativas da cloud.

## 19. Preparacao Para Nuvem

### 19.1. Local

```text
FynxApi:       http://localhost:3001
Fynx Web:      http://localhost:5173
n8n:           http://localhost:5678
Evolution API: http://localhost:8080
SQLite:        FynxApi/src/data/fynx.db
```

Para webhooks locais:

```text
ngrok
cloudflared tunnel
localtunnel
```

### 19.2. Produção

```text
FynxApi:       https://api.fynx.com.br
Fynx Web:      https://app.fynx.com.br
n8n:           https://automation.fynx.com.br
Evolution API: https://evolution.fynx.com.br
Banco:         PostgreSQL recomendado
```

### 19.3. Migração futura de SQLite para PostgreSQL

Preparar desde já:

- repositórios isolados;
- não Expor SQL no n8n;
- não acoplar workflow ao schema;
- usar endpoints do FynxApi para tudo;
- manter migrations documentadas.

## 20. Checklist De Implementação

### Fase 1: Backend base

```text
[ ] Criar domínio domains/integrations/whatsapp
[ ] Adicionar tabelas ao schema.ts
[ ] Criar repository de contas WhatsApp
[ ] Criar repository de OTP
[ ] Criar repository de auditoria
[ ] Decidir se idempotência fica em whatsapp_audit_logs ou em whatsapp_message_events
[ ] Criar OtpService
[ ] Criar EvolutionApiClient com modo mock
[ ] Criar middleware authenticateWhatsappService
[ ] Criar WhatsappService
[ ] Criar controllers e schemas Zod
[ ] Registrar rotas no roteador central
```

### Fase 2: Fluxo de verificação

```text
[ ] Endpoint request-verification
[ ] Normalizacao E.164
[ ] Hash do telefone
[ ] Geracao OTP
[ ] Persistência do desafio
[ ] Envio via Evolution API
[ ] Endpoint confirm-verification
[ ] Controle de expiração
[ ] Controle de tentativas
[ ] Revogação de número
[ ] Listagem mascarada no frontend
```

### Fase 3: Integração n8n

```text
[ ] Endpoint resolve
[ ] Geracao de contextRef
[ ] Validação de contextRef
[ ] Endpoint dashboard
[ ] Endpoint create transaction
[ ] Endpoint search transactions
[ ] Endpoint goals
[ ] Endpoint categories
[ ] Auditoria de actions
[ ] Deduplicação por providerMessageId
```

### Fase 4: LLM e workflow

```text
[ ] Definir schema JSON obrigatório da LLM
[ ] Criar prompt de extração de intenção
[ ] Validar JSON no n8n
[ ] Pedir esclarecimento quando faltar campo
[ ] Pedir confirmação para ações sensíveis
[ ] Integrar texto
[ ] Integrar áudio
[ ] Integrar imagem
[ ] Integrar vídeo
```

### Fase 5: Segurança e produção

```text
[ ] Rate limit OTP
[ ] Rate limit resolve/actions
[ ] Sanitizacao de logs
[ ] Secrets fortes
[ ] HTTPS
[ ] Monitoramento de erros
[ ] Backup do banco
[ ] Plano de rotação do N8N_SERVICE_TOKEN
[ ] Documentar política de privacidade do WhatsApp
```

## 21. Ordem Recomendada De Desenvolvimento

1. Criar tabelas e repositórios.
2. Implementar cadastro de número com OTP em modo mock.
3. Integrar envio real via Evolution API.
4. Criar tela no Fynx Web para cadastrar e confirmar WhatsApp.
5. Implementar endpoint `/resolve`.
6. Criar workflow n8n simples para texto.
7. Implementar action de dashboard.
8. Implementar action de criar transação.
9. Adicionar auditoria e idempotência.
10. Adicionar áudio, imagem e vídeo.
11. Adicionar confirmacoes para ações sensíveis.
12. Preparar deploy em nuvem.

## 22. Critérios De Aceite

### Cadastro e OTP

```text
Dado um usuário logado
Quando ele cadastrar um número válido
Então o FynxApi deve gerar OTP e enviar pelo WhatsApp

Dado um OTP válido e não Expirado
Quando o usuário confirmar
Então o número deve ficar verified

Dado um OTP expirado
Quando o usuário tentar confirmar
Então o backend deve rejeitar com erro apropriado
```

### Mensagem autorizada

```text
Dado um número verified
Quando uma mensagem chegar no n8n
Então o n8n deve conseguir resolver o contexto no FynxApi
E a LLM deve receber apenas contexto mínimo
E a action deve executar no escopo correto do usuário
```

### Mensagem não autorizada

```text
Dado um número não verificado
Quando uma mensagem chegar
Então o FynxApi deve retornar authorized=false
E o n8n deve responder orientando cadastro no Fynx Web
```

### Criação de transação

```text
Dado uma mensagem "gastei 45 no almoco"
Quando a LLM extrair os campos obrigatórios
Então o n8n deve chamar o endpoint de criação
E o FynxApi deve criar a transação para o usuário correto
E o usuário deve receber confirmação no WhatsApp
```

## 23. Riscos E Mitigações

```text
Risco: número de WhatsApp cadastrado errado
Mitigação: OTP obrigatório antes de liberar uso

Risco: LLM inventar dados
Mitigação: schema JSON, validação Zod e confirmação em baixa confiança

Risco: duplicar transação por retry do webhook
Mitigação: providerMessageId Único em whatsapp_audit_logs no MVP ou tabela whatsapp_message_events em produção

Risco: vazamento entre usuários
Mitigação: resolve por phone_hash no backend, contextRef assinado e actions sempre escopadas por userId interno

Risco: token do n8n vazado
Mitigação: token forte, rotação, logs sem token, HTTPS e rate limit

Risco: n8n virar backend paralelo
Mitigação: n8n só orquestra; toda regra e persistência passam pelo FynxApi
```

## 24. Conclusão

A implementação correta e tratar WhatsApp como um domínio de integração do `FynxApi`.

O Fynx Web permite que o usuário cadastre e verifique seu número. A Evolution API entrega e recebe mensagens. O n8n orquestra mídia, LLM e resposta. O FynxApi permanece como autoridade de autenticação, autorização, regra de negócio, persistência, auditoria e Segurança.

Esse desenho permite começar em ambiente local com SQLite e mocks, mas já deixa o sistema preparado para nuvem, Evolution API hospedada, n8n em produção, HTTPS, segredos rotacionáveis e futura migração para PostgreSQL.
