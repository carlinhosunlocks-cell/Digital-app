# Tutorial de Instalação: Digital Equipamentos (PHP Nativo + MySQL)

Esta é a versão **100% PHP Nativa**, sem dependências de Node.js ou React para rodar. Tudo é processado no servidor.

## Estrutura do Projeto
- `index.php`: Tela de login.
- `dashboard.php`: Visão geral do sistema.
- `orders.php`: Gestão de Ordens de Serviço.
- `inventory.php`: Controle de estoque e peças.
- `tickets.php`: Central de suporte ao cliente.
- `users.php`: Gestão de equipe e usuários (apenas Admin).
- `config.php`: Configuração central e conexão com banco de dados.
- `database.sql`: Schema completo do banco de dados.

---

## Como baixar os arquivos:
Para baixar todos os arquivos novos em um único arquivo ZIP:
1. No menu superior do **AI Studio**, clique no ícone de engrenagem (**Settings**).
2. Selecione a opção **"Export to ZIP"**.
3. Todos os arquivos da pasta `/php_version` estarão incluídos no download.


## Passo 1: Configurar o Banco de Dados
1. Acesse o seu gerenciador MySQL (phpMyAdmin ou similar).
2. Crie um banco de dados chamado `digital_equipamentos`.
3. Importe o arquivo `php_version/database.sql`.
   - *Nota: O sistema possui um sistema de auto-configuração. Se o banco estiver vazio, o primeiro login com o e-mail abaixo definirá a senha automaticamente:*
     - **E-mail:** `admin@admin.com`
     - **Senha Padrão:** `admin` (ou qualquer senha que você digitar no primeiro acesso)

## Passo 2: Configurar a Conexão
1. Abra o arquivo `php_version/config.php`.
2. Ajuste as constantes `DB_USER` e `DB_PASS` de acordo com o seu servidor local (XAMPP costuma ser `root` e senha vazia).

## Passo 3: Publicação
1. Copie todo o conteúdo da pasta `php_version` para a pasta pública do seu servidor web (ex: `htdocs/digital/`).
2. Acesse via navegador: `http://localhost/digital/index.php`.

## Funcionalidades Implementadas nesta Versão:
1. **Autenticação Segura**: Uso de `password_hash` e `password_verify` com sessões PHP.
2. **Dashboard Dinâmico**: Estatísticas reais vindas do banco de dados.
3. **Gestão de Ordens (CRUD)**: Listagem e criação de novas ordens com atribuição de técnicos.
4. **Interface Moderna**: Estilização via Tailwind CSS (CDN) para manter o visual premium sem precisar compilar nada.
5. **Banco Relacional**: Tabelas normalizadas para Usuários, Ordens, Inventário, Tickets e RH.

---

## Próximos Passos Recomendados:
- Implementar as páginas `inventory.php`, `tickets.php` e `users.php` seguindo o mesmo padrão de `orders.php`.
- Adicionar validações de formulário no lado do servidor.
- Configurar um arquivo `.htaccess` para URLs amigáveis.
