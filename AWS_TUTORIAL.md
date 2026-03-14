# Tutorial: Conectando o Backend à AWS

Este aplicativo foi refatorado para usar um backend Node.js (Express) que se conecta aos serviços da AWS (DynamoDB e S3).

## Pré-requisitos

1.  **Conta AWS:** Você precisa de uma conta ativa na Amazon Web Services.
2.  **Usuário IAM:** Crie um usuário no IAM (Identity and Access Management) com acesso programático (Access Key ID e Secret Access Key).
    *   **Permissões:** Este usuário precisa de permissões para ler/escrever no DynamoDB e no S3. Para testes, você pode anexar as políticas `AmazonDynamoDBFullAccess` e `AmazonS3FullAccess`, mas em produção, crie políticas restritas apenas aos recursos necessários.

## Passo 1: Configurar o S3 (Para Upload de Logos)

1.  Acesse o console do S3 na AWS.
2.  Crie um novo bucket (ex: `meu-app-logos-bucket`).
3.  **Importante (CORS):** Para que o frontend consiga exibir as imagens ou fazer upload direto (se implementado no futuro), configure o CORS do bucket. Vá na aba "Permissions" do bucket, role até "Cross-origin resource sharing (CORS)" e adicione:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST"
        ],
        "AllowedOrigins": [
            "*" 
        ],
        "ExposeHeaders": []
    }
]
```
*(Nota: Em produção, substitua `"*"` em `AllowedOrigins` pelo domínio real do seu app).*

## Passo 2: Configurar o DynamoDB (Banco de Dados)

O código atual está configurado para usar as seguintes tabelas no DynamoDB. Você precisa criá-las manualmente no console do DynamoDB, todas com a chave de partição (Partition Key) chamada `id` do tipo `String`:

*   `users`
*   `orders`
*   `tickets`
*   `hrRequests`
*   `reports`
*   `timeRecords`
*   `inventory`
*   `technicianStock`
*   `auditLogs`
*   `notifications`
*   `invoices`

## Passo 3: Configurar as Variáveis de Ambiente

No painel de configurações do seu ambiente (ou criando um arquivo `.env` na raiz do projeto, baseado no `.env.example`), adicione as seguintes variáveis:

*   `AWS_ACCESS_KEY_ID`: A chave de acesso do seu usuário IAM.
*   `AWS_SECRET_ACCESS_KEY`: A chave secreta do seu usuário IAM.
*   `AWS_REGION`: A região onde você criou seus recursos (ex: `us-east-1`, `sa-east-1`).
*   `AWS_S3_BUCKET_NAME`: O nome do bucket S3 que você criou no Passo 1.

## Passo 4: Autenticação (Cognito - Próximos Passos)

Atualmente, a autenticação no frontend está "mockada" (simulada) para permitir o desenvolvimento da interface. O próximo passo lógico para uma aplicação completa na AWS seria integrar o **Amazon Cognito**.

Para isso, você precisaria:
1.  Criar um User Pool no Cognito.
2.  Configurar um App Client.
3.  Atualizar o `parseService.ts` no frontend e as rotas no backend para validar os tokens JWT gerados pelo Cognito.

## Observação sobre o Ambiente de Desenvolvimento

Se as variáveis de ambiente da AWS não estiverem configuradas, o backend usará um banco de dados em memória (mock) e URLs de imagens falsas para que o aplicativo continue funcionando visualmente durante o desenvolvimento.
