# Guia Central de Implementacao: WhatsApp + n8n + LLM + FynxApi

## 1. Objetivo

Este documento define a arquitetura, os fluxos, os contratos HTTP, as tabelas, os servicos e as regras de seguranca para integrar o Fynx com WhatsApp usando n8n, Evolution API e uma LLM multimodal.

O objetivo principal e permitir que um usuario do Fynx interaja pelo WhatsApp para:

- consultar metricas financeiras;
- consultar transacoes;
- cadastrar transacoes por texto, audio, imagem ou video;
- consultar metas;
- consultar categorias;
- receber respostas financeiras contextualizadas;
- executar acoes somente dentro do escopo do proprio usuario.

A LLM nao deve acessar banco de dados diretamente, nao deve receber `user_id`, nao deve receber telefone real, nao deve receber JWT do usuario e nao deve ter liberdade para consultar dados fora das tools autorizadas.

## 2. Decisao Arquitetural

### 2.1. Decisao recomendada

A integracao deve ser feita por meio de endpoints HTTP internos no `FynxApi`.

O n8n deve chamar o backend usando um token de servico. O backend resolve o numero de WhatsApp para um usuario verificado e executa as regras de negocio usando os servicos ja existentes.

### 2.2. O que nao fazer

Nao permitir que o n8n leia ou escreva diretamente no banco SQLite.

Motivos:

- ignora validacoes de dominio;
- ignora autenticacao e autorizacao do backend;
- ignora efeitos colaterais, como gamificacao e eventos;
- cria uma segunda API informal dentro do n8n;
- aumenta risco de vazamento entre usuarios;
- dificulta migracao futura para nuvem ou PostgreSQL;
- acopla o workflow ao schema fisico do banco.

### 2.3. Papel de cada componente

```text
+------------------+       +-------------------+       +-------------------+
| Fynx Web         |       | FynxApi           |       | SQLite local      |
| Usuario logado   +------>+ Auth, Financial,  +------>+ Dados do Fynx     |
| cadastra numero  | JWT   | WhatsApp Domain   | SQL   |                   |
+------------------+       +-------------------+       +-------------------+

+------------------+       +-------------------+       +-------------------+
| WhatsApp Usuario |       | Evolution API     |       | n8n               |
| envia mensagem   +------>+ recebe mensagem   +------>+ orquestra fluxo   |
+------------------+       +-------------------+       +---------+---------+
                                                                |
                                                                | HTTP interno
                                                                v
                                                        +-------+--------+
                                                        | FynxApi        |
                                                        | resolve numero |
                                                        | executa acoes  |
                                                        +-------+--------+
                                                                |
                                                                | dados minimos
                                                                v
                                                        +-------+--------+
                                                        | LLM multimodal |
                                                        | interpreta     |
                                                        +----------------+
```

## 3. Estado Atual Da Codebase

O `FynxApi` ja possui uma estrutura separada por dominios:

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

O novo dominio deve seguir o mesmo padrao: `routes`, `controller`, `service`, `types` e repositorios quando necessario.

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

Essa organizacao segue melhor o estilo ja usado no projeto, que possui `config/` dentro de dominios como `analytics/dashboard/config`. O modulo de WhatsApp tem mais superficie de integracao do que `transactions` ou `goals`, entao vale separar `clients`, `repositories` e `schemas` para evitar que o service vire um arquivo grande demais.

### 4.2. Alternativa minima para MVP

Se a primeira entrega precisar ser menor, a estrutura minima aceitavel e:

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

Essa versao funciona, mas a estrutura recomendada e melhor para manutencao.

### 4.3. Responsabilidade dos arquivos

```text
config/whatsapp.config.ts
  Centraliza configuracoes de OTP, rate limit, permissao, Evolution API, mock local e contextRef.

whatsapp.routes.ts
  Define rotas usadas pelo usuario logado no Fynx Web.

whatsapp-integration.routes.ts
  Define rotas internas usadas pelo n8n.

whatsapp.controller.ts
  Recebe request/response das rotas do Fynx Web e chama o service.

whatsapp-integration.controller.ts
  Recebe request/response das rotas internas do n8n.

whatsapp.service.ts
  Orquestra casos de uso do usuario logado: solicitar OTP, confirmar OTP, listar e revogar numero.

whatsapp-integration.service.ts
  Orquestra casos de uso do n8n: resolver numero, consultar dashboard, criar transacao e consultar dados.

whatsapp.schemas.ts
  Schemas Zod para validar payloads recebidos.

whatsapp.types.ts
  Tipos TypeScript do dominio.

whatsapp-auth.middleware.ts
  Valida o token de servico usado pelo n8n.

evolution-api.client.ts
  Cliente HTTP para enviar mensagens pela Evolution API.

otp.service.ts
  Gera, hasheia, expira e valida codigos OTP.

user-whatsapp.repository.ts
  Acesso a tabela user_whatsapp_accounts e desafios OTP.

whatsapp-session.service.ts
  Cria e valida contextRef usado em chamadas internas.

whatsapp-audit.repository.ts
  Persiste auditoria de mensagens, intencoes, acoes e erros.
```

### 4.4. Configuracao do dominio

Arquivo recomendado:

```text
FynxApi/src/domains/integrations/whatsapp/config/whatsapp.config.ts
```

Conteudo conceitual:

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

## 5. Camadas E Comunicacao Interna

### 5.1. Fluxo de cadastro de numero atraves do Fynx Web

```text
Fynx Web
  |
  | POST /api/v1/whatsapp/accounts/request-verification
  | Authorization: Bearer <JWT usuario>
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
WhatsApp do usuario recebe codigo
```

### 5.2. Fluxo de uma mensagem recebida pelo WhatsApp

```text
Usuario envia mensagem no WhatsApp
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
  | valida token de servico
  | normaliza phone
  | busca phone_hash verificado
  | cria contextRef opaco
  v
n8n recebe contexto autorizado
  |
  | envia mensagem/midia para LLM com tools limitadas
  v
LLM retorna intencao estruturada
  |
  | n8n chama action endpoint do FynxApi
  v
FynxApi executa regra de negocio
  |
  v
n8n envia resposta via Evolution API
  |
  v
WhatsApp do usuario
```

### 5.3. Fluxo de criacao de transacao por mensagem

```text
Mensagem:
  "gastei 45 no almoco hoje"

Evolution API
  |
  v
n8n
  |
  | resolve numero
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
  |     description: "Almoco",
  |     category: "Alimentacao",
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
  | envia confirmacao
  v
WhatsApp:
  "Transacao registrada: Almoco, R$ 45,00, Alimentacao."
```

### 5.4. Logica natural do fluxo OTP

O fluxo OTP existe para garantir que o usuario realmente controla o numero informado no Fynx Web.

Funcionamento:

1. O usuario entra no Fynx Web ja autenticado.
2. Ele informa um numero de WhatsApp.
3. O frontend envia esse numero para o FynxApi usando o JWT normal do usuario.
4. O backend normaliza o numero para formato E.164.
5. O backend calcula um hash do telefone normalizado.
6. O backend verifica se esse telefone ja esta verificado para outro usuario.
7. Se o numero estiver livre ou pendente para o mesmo usuario, o backend gera um codigo OTP de 6 digitos.
8. O backend salva o hash do codigo na tabela de desafios OTP.
9. O backend envia o codigo para o telefone usando a Evolution API.
10. O usuario recebe o codigo no WhatsApp.
11. O usuario digita o codigo no Fynx Web.
12. O backend compara o codigo informado com o hash salvo.
13. Se estiver correto e dentro do prazo, o numero passa para `verified`.
14. A partir desse momento, mensagens vindas daquele numero podem ser resolvidas pelo n8n.

Regras importantes:

- o OTP nao deve ser salvo em texto puro;
- o OTP deve expirar;
- tentativas invalidas devem incrementar contador;
- muitas tentativas devem bloquear o desafio;
- solicitar novo OTP deve invalidar desafios antigos pendentes;
- numero verificado por outro usuario nao pode ser tomado sem processo de revogacao/administracao.

#### 5.4.1. Quando o OTP esta errado

Quando o usuario informa um codigo incorreto, o backend nao deve dizer qual parte esta errada e nao deve revelar se o codigo correto esta perto ou longe. A resposta deve ser generica.

Fluxo:

```text
Usuario informa OTP
  |
  v
FynxApi busca desafio pending mais recente
  |
  v
FynxApi verifica expiracao
  |
  v
FynxApi compara codigo informado com code_hash
  |
  +-- codigo correto --> marca used, marca conta verified
  |
  +-- codigo errado --> incrementa attempts
                         |
                         +-- attempts < limite --> retorna 400 codigo invalido
                         |
                         +-- attempts >= limite --> marca desafio blocked e retorna 429
```

Resposta para codigo errado ainda dentro do limite:

```json
{
  "error": "Codigo de verificacao invalido.",
  "code": "WHATSAPP_OTP_INVALID",
  "remainingAttempts": 3
}
```

Resposta quando o limite de tentativas foi atingido:

```json
{
  "error": "Limite de tentativas excedido. Solicite um novo codigo.",
  "code": "WHATSAPP_OTP_ATTEMPTS_EXCEEDED"
}
```

Regra importante: `remainingAttempts` e util para UX, mas nao deve ser usado se a equipe quiser reduzir ainda mais informacao para atacantes. Em ambiente de maior rigor, retornar apenas mensagem generica.

#### 5.4.2. Quando o OTP esta expirado

O OTP deve expirar por tempo, mesmo que o usuario ainda nao tenha usado nenhuma tentativa.

Fluxo:

```text
Usuario informa OTP
  |
  v
FynxApi busca desafio pending
  |
  v
now > expires_at?
  |
  +-- sim --> marca desafio expired e retorna 410
  |
  +-- nao --> continua validacao normal
```

Resposta:

```json
{
  "error": "Codigo expirado. Solicite um novo codigo de verificacao.",
  "code": "WHATSAPP_OTP_EXPIRED"
}
```

#### 5.4.3. Quando o usuario pede OTP muitas vezes

O endpoint de solicitar OTP deve ter cooldown para evitar abuso, custo desnecessario na Evolution API e spam no WhatsApp do usuario.

Fluxo:

```text
Usuario solicita OTP
  |
  v
FynxApi normaliza telefone e calcula phone_hash
  |
  v
Existe OTP recente para esse user_id + phone_hash?
  |
  +-- sim, criado ha menos de 60s --> retorna 429 cooldown
  |
  +-- nao --> invalida OTPs pendentes antigos, gera novo OTP e envia
```

Resposta durante cooldown:

```json
{
  "error": "Aguarde antes de solicitar um novo codigo.",
  "code": "WHATSAPP_OTP_COOLDOWN",
  "retryAfterSeconds": 42
}
```

Regra recomendada:

```text
cooldown entre envios:
  60 segundos por user_id + phone_hash

limite por hora:
  3 codigos por phone_hash

limite por dia:
  10 codigos por user_id
```

#### 5.4.4. Quando o numero ja pertence a outro usuario

Se o telefone ja esta `verified` para outro `user_id`, o backend deve impedir o cadastro automatico.

Resposta:

```json
{
  "error": "Este numero ja esta vinculado a outra conta.",
  "code": "WHATSAPP_PHONE_ALREADY_LINKED"
}
```

Para evitar vazamento de informacao, se o produto exigir mais privacidade, a mensagem publica pode ser mais neutra:

```json
{
  "error": "Nao foi possivel vincular este numero. Entre em contato com o suporte.",
  "code": "WHATSAPP_PHONE_LINK_FAILED"
}
```

#### 5.4.5. Reenvio de OTP

Quando o usuario pede reenvio depois do cooldown:

1. O backend marca desafios pendentes anteriores como `expired`.
2. Gera novo codigo.
3. Salva novo `code_hash`.
4. Envia nova mensagem via Evolution API.
5. Apenas o OTP mais recente deve ser aceito.

Isso evita que codigos antigos ainda funcionem depois de um reenvio.

### 5.5. Logica natural do fluxo de transacao

Esse fluxo permite que o usuario diga algo como:

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
5. O FynxApi valida o token de servico do n8n.
6. O FynxApi normaliza e hasheia o telefone.
7. O FynxApi busca uma conta WhatsApp `verified`.
8. Se nao encontrar, o n8n responde orientando o cadastro no Fynx Web.
9. Se encontrar, o FynxApi retorna um `contextRef`.
10. O n8n envia a mensagem para a LLM com instrucoes e schema JSON.
11. A LLM extrai intencao, valor, tipo, categoria, descricao e data.
12. O n8n valida se o JSON retornado esta correto.
13. Se faltar dado, o n8n pergunta ao usuario.
14. Se estiver completo, o n8n chama o endpoint interno de criacao de transacao.
15. O FynxApi valida o `contextRef`.
16. O FynxApi recupera o `user_id` internamente.
17. O FynxApi valida o payload da transacao com Zod.
18. O FynxApi chama o use case de criacao de transacao ja existente.
19. O FynxApi registra auditoria.
20. O n8n recebe a transacao criada e envia uma confirmacao no WhatsApp.

Campos minimos para criar transacao:

```text
type: income ou expense
amount: numero positivo
description: texto curto
category: categoria existente ou aceita pelo dominio
date: YYYY-MM-DD
```

Quando pedir confirmacao:

- valor alto;
- categoria inferida com baixa confianca;
- data ambigua;
- mensagem com mais de uma transacao;
- usuario pediu para alterar ou excluir algo;
- LLM retornou confianca baixa.

### 5.6. Logica natural do fluxo de consulta de saldo e dashboard

Esse fluxo permite perguntas como:

```text
quanto gastei esse mes?
qual meu saldo mensal?
como estao minhas despesas?
qual categoria mais consumiu dinheiro?
```

Funcionamento:

1. A mensagem chega pelo WhatsApp.
2. O n8n resolve o telefone no FynxApi.
3. A LLM classifica a intencao como consulta financeira.
4. O n8n chama uma action de dashboard ou summary.
5. O FynxApi valida o `contextRef`.
6. O FynxApi chama `DashboardService.getDashboardData(userId)` ou servicos de resumo de transacoes.
7. O FynxApi retorna dados estruturados para o n8n.
8. A LLM transforma esses dados em uma resposta curta e clara.
9. O n8n envia a resposta no WhatsApp.

Regra importante: a LLM deve receber apenas os dados necessarios para responder a pergunta. Se o usuario perguntar "quanto gastei esse mes?", nao ha necessidade de enviar todo o historico detalhado de transacoes.

Exemplo de resposta:

```text
Neste mes voce teve R$ 2.300,00 em despesas. A maior categoria foi Alimentacao, com R$ 720,00.
```

### 5.7. Logica natural do fluxo de categorias

Esse fluxo permite:

```text
quais categorias posso usar?
crie a categoria Freelance como receita
use Alimentacao nessa transacao
```

MVP recomendado:

- permitir consultar categorias;
- permitir usar uma categoria existente na criacao de transacao;
- nao permitir criar categoria automaticamente sem confirmacao.

Funcionamento para consulta:

1. Usuario pergunta pelas categorias.
2. n8n resolve o telefone.
3. LLM identifica intencao `categories:list`.
4. n8n chama action de categorias.
5. FynxApi retorna categorias globais e, se aplicavel, categorias customizadas do usuario.
6. n8n responde no WhatsApp.

Funcionamento para categoria nova:

1. Usuario diz "crie categoria Freelance".
2. LLM identifica criacao de categoria.
3. Como cria dados novos, o n8n pede confirmacao.
4. Apos confirmacao, n8n chama endpoint especifico.
5. FynxApi valida se ja existe categoria ativa com mesmo nome e tipo.
6. FynxApi cria categoria customizada para o usuario.
7. n8n confirma no WhatsApp.

No MVP, se ainda nao quiser liberar criacao via WhatsApp, o bot deve responder:

```text
Ainda nao posso criar categorias pelo WhatsApp. Voce pode criar essa categoria no Fynx Web.
```

### 5.8. Logica natural do fluxo de metas

Esse fluxo permite:

```text
como estao minhas metas?
quanto falta para minha reserva?
crie uma meta de guardar 5000 reais ate dezembro
```

MVP recomendado:

- permitir consultar metas;
- nao permitir criar, editar ou excluir metas sem confirmacao explicita;
- iniciar com leitura antes de liberar escrita.

Funcionamento para consulta:

1. Usuario pergunta sobre metas.
2. n8n resolve o telefone.
3. LLM identifica intencao `goals:list` ou `goals:summary`.
4. n8n chama action de metas.
5. FynxApi chama `GoalsService.getGoalsData(userId)`.
6. FynxApi retorna metas e progresso.
7. LLM formata resposta curta.
8. n8n envia pelo WhatsApp.

Funcionamento para criar meta futuramente:

1. Usuario pede criacao de meta.
2. LLM extrai titulo, categoria, valor alvo, periodo, data inicial e data final.
3. Se faltar qualquer campo essencial, o n8n pergunta.
4. Se estiver completo, o n8n pede confirmacao.
5. Apos confirmacao, n8n chama endpoint interno de criacao de meta.
6. FynxApi valida permissao `goals:create`.
7. FynxApi cria a meta usando o service de goals.
8. FynxApi registra auditoria.
9. n8n confirma no WhatsApp.

No MVP, `goals:create` deve ficar bloqueado ate existir boa experiencia de confirmacao.

## 6. Autenticacao E Autorizacao

### 6.1. Usuario logado no Fynx Web

Usa o JWT atual do sistema:

```http
Authorization: Bearer <fynx_user_jwt>
```

Esse token permite:

- cadastrar numero de WhatsApp;
- solicitar OTP;
- confirmar OTP;
- listar numeros vinculados;
- revogar numero.

### 6.2. n8n como sistema autorizado

O n8n usa um token de servico:

```http
Authorization: Bearer <N8N_SERVICE_TOKEN>
```

Esse token deve ficar em:

```text
FynxApi .env
n8n credentials
```

O token de servico nao representa um usuario final. Ele apenas autentica a integracao.

### 6.3. Resolucao do usuario

O usuario final e resolvido pelo numero verificado:

```text
phone recebido do WhatsApp
  -> normalizacao E.164
  -> hash do telefone
  -> busca user_whatsapp_accounts.status = verified
  -> user_id interno
  -> contextRef opaco
```

O `user_id` nao deve ser enviado para a LLM.

### 6.4. contextRef

O `contextRef` e um identificador opaco usado entre n8n e FynxApi.

Ele pode ser:

- um JWT interno assinado com segredo especifico;
- ou um identificador de sessao persistido em tabela temporaria.

Recomendacao inicial: JWT interno curto, com expiracao de 15 minutos.

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

O n8n pode armazenar esse `contextRef` durante a execucao do workflow. A LLM nao precisa receber esse valor.

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

### 8.0. Decisao sobre quantidade de tabelas

Para o MVP, nao e necessario criar uma tabela para cada detalhe do fluxo. A separacao deve existir quando ela reduz risco ou simplifica a regra de negocio.

Classificacao recomendada:

```text
Obrigatoria:
  user_whatsapp_accounts
    Guarda o vinculo entre usuario e numero autorizado.

Obrigatoria:
  whatsapp_otp_challenges
    Guarda o desafio OTP, expiracao e tentativas. Separar essa tabela evita poluir a tabela de contas com historico temporario.

Recomendada:
  whatsapp_audit_logs
    Guarda auditoria das acoes feitas pelo bot. Importante para suporte, seguranca e investigacao de erros.

Opcional no MVP:
  whatsapp_message_events
    Guarda idempotencia por providerMessageId. Pode ser incorporada em whatsapp_audit_logs no inicio, desde que exista campo unico para providerMessageId.
```

Versao enxuta para primeira entrega:

```text
1. user_whatsapp_accounts
2. whatsapp_otp_challenges
3. whatsapp_audit_logs com coluna provider_message_id UNIQUE opcional
```

Versao mais robusta para producao:

```text
1. user_whatsapp_accounts
2. whatsapp_otp_challenges
3. whatsapp_audit_logs
4. whatsapp_message_events
```

Recomendacao pratica: implementar 3 tabelas no MVP e deixar `whatsapp_message_events` como evolucao se a idempotencia ficar mais complexa.

### 8.1. Tabela user_whatsapp_accounts

Responsavel por vincular usuarios do Fynx a numeros de WhatsApp verificados.

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
  Usuario dono do numero.

phone_e164
  Telefone normalizado. Exemplo: +5511999999999.

phone_hash
  Hash do telefone normalizado. Usado para busca e auditoria segura.

status
  pending, verified ou revoked.

verified_at
  Data de confirmacao do OTP.

revoked_at
  Data de revogacao.
```

### 8.2. Tabela whatsapp_otp_challenges

Responsavel pelos desafios de verificacao.

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
- bloquear apos `WHATSAPP_OTP_MAX_ATTEMPTS`;
- invalidar desafios antigos quando novo OTP for solicitado para o mesmo usuario e telefone.

### 8.3. Tabela whatsapp_message_events opcional

Responsavel por idempotencia. Evita processar a mesma mensagem duas vezes. No MVP, essa responsabilidade pode ficar em `whatsapp_audit_logs.provider_message_id`. Crie esta tabela separada se os retries, reprocessamentos e status de mensagens ficarem complexos.

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

Responsavel por rastrear tudo que aconteceu no bot.

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

Observacao: `request_payload` e `response_payload` devem ser sanitizados. Nao registrar token, OTP, telefone puro, senha ou dados sensiveis desnecessarios.

No MVP, `provider_message_id` pode ser usado para deduplicacao simples. Em SQLite, se desejar garantir unicidade apenas quando o valor existir, criar indice unico parcial:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_audit_provider_message
ON whatsapp_audit_logs(provider_message_id)
WHERE provider_message_id IS NOT NULL;
```

### 8.5. Alteracao no schema.ts

Adicionar as tabelas ao objeto `SCHEMA` em:

```text
FynxApi/src/infrastructure/database/schema.ts
```

Exemplo de chaves:

```ts
user_whatsapp_accounts: `...`,
whatsapp_otp_challenges: `...`,
whatsapp_audit_logs: `...`
// opcional em producao:
whatsapp_message_events: `...`
```

## 9. Rotas HTTP

### 9.1. Rotas do usuario logado

Prefixo:

```text
/api/v1/whatsapp
```

Devem usar `authenticateToken`.

#### POST /api/v1/whatsapp/accounts/request-verification

Solicita envio de OTP para o numero informado.

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
  "message": "Codigo de verificacao enviado pelo WhatsApp.",
  "expiresInMinutes": 10
}
```

Erros:

```text
400 telefone invalido
401 JWT ausente
403 JWT invalido
409 numero ja verificado por outro usuario
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
400 codigo invalido
401 JWT ausente
403 JWT invalido
404 desafio nao encontrado
410 codigo expirado
429 limite de tentativas excedido
```

#### GET /api/v1/whatsapp/accounts

Lista numeros vinculados ao usuario.

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

Revoga um numero.

Response 204.

### 9.2. Rotas internas da integracao n8n

Prefixo:

```text
/api/v1/integrations/whatsapp
```

Devem usar `authenticateWhatsappService`.

#### POST /api/v1/integrations/whatsapp/resolve

Resolve o numero recebido pelo WhatsApp em um contexto autorizado.

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

Consulta metricas do dashboard para o usuario resolvido.

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

Cria uma transacao.

Request:

```json
{
  "contextRef": "ctx_or_jwt_interno",
  "transaction": {
    "type": "expense",
    "amount": 45,
    "description": "Almoco",
    "category": "Alimentacao",
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
  "description": "Almoco",
  "category": "Alimentacao",
  "date": "2026-05-13"
}
```

#### POST /api/v1/integrations/whatsapp/actions/transactions/search

Busca transacoes do usuario resolvido.

Request:

```json
{
  "contextRef": "ctx_or_jwt_interno",
  "filters": {
    "type": "expense",
    "startDate": "2026-05-01",
    "endDate": "2026-05-13",
    "category": "Alimentacao",
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

Consulta categorias disponiveis.

Request:

```json
{
  "contextRef": "ctx_or_jwt_interno"
}
```

## 10. Permissoes Da Integracao

### 10.1. Permissoes iniciais

```text
dashboard:read
transactions:read
transactions:create
goals:read
categories:read
```

### 10.2. Permissoes futuras com confirmacao

```text
transactions:update
transactions:delete
goals:create
goals:update
categories:create
```

### 10.3. Permissoes bloqueadas no MVP

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

A LLM nao recebe:

- `user_id`;
- telefone real;
- JWT do usuario;
- token de servico;
- SQL;
- acesso direto ao banco;
- payloads completos com dados sensiveis desnecessarios.

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

### 11.3. Saida obrigatoria da LLM

```json
{
  "intent": "create_transaction",
  "confidence": 0.94,
  "requiresConfirmation": false,
  "missingFields": [],
  "data": {
    "type": "expense",
    "amount": 45,
    "description": "Almoco",
    "category": "Alimentacao",
    "date": "2026-05-13"
  },
  "replyDraft": "Vou registrar uma despesa de R$ 45,00 em Alimentacao com descricao Almoco."
}
```

### 11.4. Regras de confirmacao

Confirmacao obrigatoria quando:

- a intencao tiver baixa confianca;
- faltar campo obrigatorio;
- houver ambiguidade de data;
- valor for acima de limite configurado;
- usuario pedir edicao ou exclusao;
- usuario pedir acao em lote;
- usuario pedir algo fora das permissoes atuais.

Exemplo:

```json
{
  "intent": "create_transaction",
  "confidence": 0.62,
  "requiresConfirmation": true,
  "missingFields": ["category"],
  "question": "Qual categoria devo usar para essa transacao?"
}
```

## 12. Tipos De Midia

### 12.1. Texto

Fluxo simples:

```text
WhatsApp texto -> n8n -> LLM -> FynxApi action
```

### 12.2. Audio

```text
WhatsApp audio
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
  -> se confianca baixa, pedir confirmacao
  -> FynxApi cria transacao
```

### 12.4. Video

MVP:

- extrair audio;
- transcrever;
- opcionalmente extrair frames;
- enviar texto resumido para LLM.

```text
WhatsApp video
  -> n8n baixa video
  -> extrai audio/frame
  -> LLM interpreta
  -> FynxApi action
```

## 13. Evolution API

### 13.1. Envio de OTP

O `EvolutionApiClient` deve chamar a Evolution API para enviar o codigo.

Payload conceitual:

```json
{
  "number": "5511999999999",
  "text": "Seu codigo de verificacao Fynx e: 482913. Ele expira em 10 minutos."
}
```

O formato exato depende da versao/configuracao da Evolution API usada no ambiente.

### 13.2. Webhook de entrada

Recomendacao: configurar a Evolution API para chamar um webhook do n8n, nao diretamente o FynxApi.

Motivo:

- n8n orquestra midias;
- n8n chama LLM;
- n8n controla fluxo conversacional;
- FynxApi fica responsavel por seguranca e regras de negocio.

## 14. Implementacao No FynxApi

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

`whatsapp_message_events` deve ser adicionada somente se a equipe decidir separar idempotencia da auditoria.

### 14.2. Passo 2: Criar middleware do token de servico

Arquivo:

```text
FynxApi/src/domains/integrations/whatsapp/whatsapp-auth.middleware.ts
```

Responsabilidade:

```text
ler Authorization
validar Bearer token
comparar com N8N_SERVICE_TOKEN
retornar 401/403 se invalido
chamar next() se valido
```

### 14.3. Passo 3: Criar OtpService

Responsabilidade:

```text
gerar codigo randomico de 6 digitos
criar hash seguro
validar codigo
calcular expiracao
controlar tentativas
```

Recomendacao:

- usar `crypto.randomInt(100000, 999999)`;
- usar `bcrypt` para hash do OTP, ja presente no projeto;
- TTL padrao: 10 minutos;
- tentativas maximas: 5.

### 14.4. Passo 4: Criar EvolutionApiClient

Responsabilidade:

```text
enviar texto para numero
tratar erro da Evolution API
timeout curto
log seguro
```

Em ambiente local, se a Evolution API nao estiver disponivel, permitir modo mock:

```env
EVOLUTION_API_MOCK=true
```

Nesse modo, o codigo nao e enviado de verdade, mas o backend registra log de desenvolvimento.

### 14.5. Passo 5: Criar WhatsappService

Metodos recomendados:

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

### 14.7. Passo 7: Reaproveitar servicos existentes

A camada WhatsApp nao deve duplicar regra financeira.

Para dashboard:

```text
usar DashboardService.getDashboardData(userId)
```

Para transacoes:

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
usar CustomCategoriesService para categorias do usuario, se aplicavel
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
        +-- unauthorized --> [Send WhatsApp: numero nao autorizado]
        |
        v
[Detect Message Type]
        |
        +-- text  --> [LLM]
        +-- audio --> [Download] -> [Transcribe] -> [LLM]
        +-- image --> [Download] -> [LLM vision]
        +-- video --> [Download] -> [Extract audio/frame] -> [LLM]
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

### 15.2. Workflow de confirmacao

```text
Usuario pede acao sensivel
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
Usuario responde "sim"
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

Para producao, pending actions devem ter expiracao curta.

## 16. Tratamento De Erros

### 16.1. Numero nao autorizado

Resposta:

```text
Este numero ainda nao esta autorizado no Fynx. Acesse sua conta no Fynx Web e cadastre seu WhatsApp.
```

### 16.2. OTP invalido

Resposta no Fynx Web:

```text
Codigo invalido. Verifique o codigo recebido no WhatsApp.
```

### 16.3. OTP expirado

Resposta:

```text
Codigo expirado. Solicite um novo codigo de verificacao.
```

### 16.4. LLM com baixa confianca

Resposta:

```text
Nao consegui identificar todos os dados. Voce pode confirmar o valor, categoria e data?
```

### 16.5. Erro de API financeira

Resposta:

```text
Nao consegui registrar agora. Tente novamente em alguns instantes.
```

Internamente:

- registrar auditoria;
- registrar erro tecnico;
- nao expor stack trace ao usuario.

## 17. Seguranca

### 17.1. Regras obrigatorias

- n8n nunca acessa banco diretamente.
- LLM nunca recebe `user_id`.
- LLM nunca recebe telefone real.
- LLM nunca recebe token.
- OTP nunca e salvo em texto puro.
- Token de servico fica somente no FynxApi e no n8n.
- Todo endpoint interno valida `N8N_SERVICE_TOKEN`.
- Toda action valida `contextRef`.
- Toda action valida permissoes.
- Toda action registra auditoria.
- Acoes destrutivas exigem confirmacao.
- Mensagens repetidas devem ser deduplicadas por `providerMessageId`.

### 17.2. Rate limits

Aplicar limites especificos:

```text
request-verification:
  maximo 3 OTP por telefone por hora
  cooldown de 60 segundos entre envios

confirm-verification:
  maximo 5 tentativas por desafio

resolve:
  maximo por phone_hash por minuto

actions:
  maximo por contextRef por minuto
```

### 17.2.1. Matriz recomendada de rate limit

Os limites abaixo sao valores iniciais para desenvolvimento e homologacao. Em producao, devem ser ajustados com base no uso real e nos custos da Evolution API e da LLM.

```text
Endpoint:
  POST /api/v1/whatsapp/accounts/request-verification

Chave de rate limit:
  user_id + phone_hash

Limite recomendado:
  1 requisicao por 60 segundos
  3 requisicoes por hora por phone_hash
  10 requisicoes por dia por user_id

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
  Evitar brute force do codigo OTP.
```

```text
Endpoint:
  POST /api/v1/integrations/whatsapp/resolve

Chave de rate limit:
  phone_hash + IP/origem do n8n

Limite recomendado:
  20 requisicoes por minuto por phone_hash

Motivo:
  Evitar loop de workflow ou ataque usando o endpoint de resolucao.
```

```text
Endpoint:
  POST /api/v1/integrations/whatsapp/actions/*

Chave de rate limit:
  contextRef ou user_id interno

Limite recomendado:
  30 actions por minuto por usuario
  5 actions de escrita por minuto por usuario

Motivo:
  Evitar criacao acidental em massa e loops da LLM/n8n.
```

```text
Endpoint:
  actions/transactions/create

Chave adicional:
  providerMessageId

Limite recomendado:
  providerMessageId deve ser idempotente

Motivo:
  Retries do webhook nao podem criar transacoes duplicadas.
```

### 17.2.2. Como implementar rate limit no FynxApi

O projeto ja usa `express-rate-limit` globalmente. Para o dominio WhatsApp, criar limitadores especificos em `whatsapp.routes.ts` ou em um middleware dedicado.

Padrao sugerido:

```text
rate limit global da API
  protege tudo de abuso geral

rate limit especifico de OTP
  protege envio de codigo

rate limit especifico de confirmacao OTP
  protege brute force

rate limit especifico de actions
  protege loops e escritas em massa
```

Para limites baseados em `user_id`, `phone_hash` ou `contextRef`, o rate limit precisa de uma key customizada. Em desenvolvimento com SQLite e processo unico, memoria local pode funcionar. Em producao com multiplas instancias, usar Redis ou outro storage compartilhado.

### 17.2.3. Respostas padrao para rate limit

Resposta generica:

```json
{
  "error": "Muitas requisicoes. Tente novamente em alguns instantes.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfterSeconds": 60
}
```

Resposta especifica para OTP:

```json
{
  "error": "Aguarde antes de solicitar um novo codigo.",
  "code": "WHATSAPP_OTP_RATE_LIMITED",
  "retryAfterSeconds": 60
}
```

O n8n deve respeitar `retryAfterSeconds` e nao repetir automaticamente antes desse prazo.

### 17.3. Logs

Nao logar:

- OTP;
- senha;
- token;
- telefone completo em producao;
- payload bruto de midia;
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

Principios:

- coletar somente o telefone necessario;
- permitir revogacao;
- informar finalidade do uso;
- registrar consentimento implicito no cadastro;
- mascarar telefone no frontend;
- evitar persistir conteudo integral de conversas sem necessidade.

## 18. Otimizacao E Resiliencia

### 18.1. Timeouts

Configurar timeout curto para Evolution API e chamadas externas:

```text
Evolution API send: 5s a 10s
LLM: depende do provedor, mas com fallback de erro amigavel
FynxApi internal actions: 10s
```

### 18.2. Idempotencia

Usar `providerMessageId` para evitar duplicidade.

Fluxo:

```text
recebe providerMessageId
  -> verifica provider_message_id em whatsapp_audit_logs no MVP
  -> ou verifica whatsapp_message_events em uma versao mais robusta
  -> se ja processado, ignora ou retorna ultimo resultado
  -> se novo, processa
  -> grava status
```

### 18.3. Fila futura

No MVP, o n8n pode processar direto.

Em producao com volume maior, considerar:

```text
Webhook -> fila -> worker -> LLM -> FynxApi -> resposta
```

Ferramentas possiveis:

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

### 19.2. Producao

```text
FynxApi:       https://api.fynx.com.br
Fynx Web:      https://app.fynx.com.br
n8n:           https://automation.fynx.com.br
Evolution API: https://evolution.fynx.com.br
Banco:         PostgreSQL recomendado
```

### 19.3. Migracao futura de SQLite para PostgreSQL

Preparar desde ja:

- repositorios isolados;
- nao expor SQL no n8n;
- nao acoplar workflow ao schema;
- usar endpoints do FynxApi para tudo;
- manter migrations documentadas.

## 20. Checklist De Implementacao

### Fase 1: Backend base

```text
[ ] Criar dominio domains/integrations/whatsapp
[ ] Adicionar tabelas ao schema.ts
[ ] Criar repository de contas WhatsApp
[ ] Criar repository de OTP
[ ] Criar repository de auditoria
[ ] Decidir se idempotencia fica em whatsapp_audit_logs ou em whatsapp_message_events
[ ] Criar OtpService
[ ] Criar EvolutionApiClient com modo mock
[ ] Criar middleware authenticateWhatsappService
[ ] Criar WhatsappService
[ ] Criar controllers e schemas Zod
[ ] Registrar rotas no roteador central
```

### Fase 2: Fluxo de verificacao

```text
[ ] Endpoint request-verification
[ ] Normalizacao E.164
[ ] Hash do telefone
[ ] Geracao OTP
[ ] Persistencia do desafio
[ ] Envio via Evolution API
[ ] Endpoint confirm-verification
[ ] Controle de expiracao
[ ] Controle de tentativas
[ ] Revogacao de numero
[ ] Listagem mascarada no frontend
```

### Fase 3: Integracao n8n

```text
[ ] Endpoint resolve
[ ] Geracao de contextRef
[ ] Validacao de contextRef
[ ] Endpoint dashboard
[ ] Endpoint create transaction
[ ] Endpoint search transactions
[ ] Endpoint goals
[ ] Endpoint categories
[ ] Auditoria de actions
[ ] Deduplicacao por providerMessageId
```

### Fase 4: LLM e workflow

```text
[ ] Definir schema JSON obrigatorio da LLM
[ ] Criar prompt de extracao de intencao
[ ] Validar JSON no n8n
[ ] Pedir esclarecimento quando faltar campo
[ ] Pedir confirmacao para acoes sensiveis
[ ] Integrar texto
[ ] Integrar audio
[ ] Integrar imagem
[ ] Integrar video
```

### Fase 5: Seguranca e producao

```text
[ ] Rate limit OTP
[ ] Rate limit resolve/actions
[ ] Sanitizacao de logs
[ ] Secrets fortes
[ ] HTTPS
[ ] Monitoramento de erros
[ ] Backup do banco
[ ] Plano de rotacao do N8N_SERVICE_TOKEN
[ ] Documentar politica de privacidade do WhatsApp
```

## 21. Ordem Recomendada De Desenvolvimento

1. Criar tabelas e repositorios.
2. Implementar cadastro de numero com OTP em modo mock.
3. Integrar envio real via Evolution API.
4. Criar tela no Fynx Web para cadastrar e confirmar WhatsApp.
5. Implementar endpoint `/resolve`.
6. Criar workflow n8n simples para texto.
7. Implementar action de dashboard.
8. Implementar action de criar transacao.
9. Adicionar auditoria e idempotencia.
10. Adicionar audio, imagem e video.
11. Adicionar confirmacoes para acoes sensiveis.
12. Preparar deploy em nuvem.

## 22. Criterios De Aceite

### Cadastro e OTP

```text
Dado um usuario logado
Quando ele cadastrar um numero valido
Entao o FynxApi deve gerar OTP e enviar pelo WhatsApp

Dado um OTP valido e nao expirado
Quando o usuario confirmar
Entao o numero deve ficar verified

Dado um OTP expirado
Quando o usuario tentar confirmar
Entao o backend deve rejeitar com erro apropriado
```

### Mensagem autorizada

```text
Dado um numero verified
Quando uma mensagem chegar no n8n
Entao o n8n deve conseguir resolver o contexto no FynxApi
E a LLM deve receber apenas contexto minimo
E a action deve executar no escopo correto do usuario
```

### Mensagem nao autorizada

```text
Dado um numero nao verificado
Quando uma mensagem chegar
Entao o FynxApi deve retornar authorized=false
E o n8n deve responder orientando cadastro no Fynx Web
```

### Criacao de transacao

```text
Dado uma mensagem "gastei 45 no almoco"
Quando a LLM extrair os campos obrigatorios
Entao o n8n deve chamar o endpoint de criacao
E o FynxApi deve criar a transacao para o usuario correto
E o usuario deve receber confirmacao no WhatsApp
```

## 23. Riscos E Mitigacoes

```text
Risco: numero de WhatsApp cadastrado errado
Mitigacao: OTP obrigatorio antes de liberar uso

Risco: LLM inventar dados
Mitigacao: schema JSON, validacao Zod e confirmacao em baixa confianca

Risco: duplicar transacao por retry do webhook
Mitigacao: providerMessageId unico em whatsapp_audit_logs no MVP ou tabela whatsapp_message_events em producao

Risco: vazamento entre usuarios
Mitigacao: resolve por phone_hash no backend, contextRef assinado e actions sempre escopadas por userId interno

Risco: token do n8n vazado
Mitigacao: token forte, rotacao, logs sem token, HTTPS e rate limit

Risco: n8n virar backend paralelo
Mitigacao: n8n so orquestra; toda regra e persistencia passam pelo FynxApi
```

## 24. Conclusao

A implementacao correta e tratar WhatsApp como um dominio de integracao do `FynxApi`.

O Fynx Web permite que o usuario cadastre e verifique seu numero. A Evolution API entrega e recebe mensagens. O n8n orquestra midia, LLM e resposta. O FynxApi permanece como autoridade de autenticacao, autorizacao, regra de negocio, persistencia, auditoria e seguranca.

Esse desenho permite comecar em ambiente local com SQLite e mocks, mas ja deixa o sistema preparado para nuvem, Evolution API hospedada, n8n em producao, HTTPS, segredos rotacionaveis e futura migracao para PostgreSQL.
