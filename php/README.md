# Tutorial de Instalação: Digital Equipamentos (PHP + MySQL)

Este guia explica como migrar e instalar a plataforma utilizando um servidor web tradicional (Apache/Nginx) com PHP e MySQL.

## Pré-requisitos
- Servidor Web (XAMPP, WAMP, Laragon ou Servidor Linux com LAMP).
- PHP 7.4 ou superior.
- MySQL 5.7 ou superior.
- Node.js (apenas para gerar os arquivos do frontend).

---

## Passo 1: Configurar o Banco de Dados
1. Abra o seu gerenciador de banco de dados (phpMyAdmin, por exemplo).
2. Crie um banco de dados chamado `digital_equipamentos`.
3. Importe o arquivo `/php/database.sql` para criar a tabela necessária.

## Passo 2: Configurar o Backend PHP
1. Copie a pasta `/php` para o diretório raiz do seu servidor web (ex: `C:/xampp/htdocs/digital-equipamentos/`).
2. Edite o arquivo `php/config.php` com as credenciais do seu MySQL:
   ```php
   $user = 'seu_usuario';
   $pass = 'sua_senha';
   ```

## Passo 3: Preparar o Frontend React
Para que o React converse com o seu novo backend PHP, você precisa alterar a URL da API.

1. No arquivo `src/services/apiService.ts`, altere a constante `API_URL`:
   ```typescript
   // De:
   const API_URL = '/api';
   // Para (exemplo local):
   const API_URL = 'http://localhost/digital-equipamentos/php/api.php?path=';
   ```
2. No terminal do projeto, gere os arquivos de produção:
   ```bash
   npm run build
   ```
3. Copie todo o conteúdo da pasta `dist` gerada para a pasta do seu servidor web (onde está a pasta `php`).

## Passo 4: Configurar o .htaccess (Opcional, mas recomendado)
Se você estiver usando Apache, crie um arquivo `.htaccess` na raiz para que as rotas do React funcionem corretamente e para "limpar" a URL da API:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Redireciona chamadas de API para o PHP
  RewriteRule ^api/(.*)$ php/api.php?path=$1 [QSA,L]

  # Garante que o React trate as rotas internas
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Resumo da Estrutura de Pastas no Servidor
```text
/var/www/html/ (ou htdocs)
├── assets/          (Arquivos do React Build)
├── index.html       (Arquivo do React Build)
├── .htaccess        (Configuração de rotas)
└── php/
    ├── api.php      (Handler da API)
    ├── config.php   (Conexão DB)
    ├── database.sql (Backup do Schema)
    └── uploads/     (Pasta onde ficarão os logos)
```

## Notas de Segurança
1. **Validação**: O arquivo `api.php` incluído possui uma lista de coleções permitidas para evitar acesso a tabelas indevidas.
2. **CORS**: Se o frontend e backend estiverem em domínios diferentes, as configurações de `Access-Control-Allow-Origin` no `api.php` já estão prontas para permitir a comunicação.
