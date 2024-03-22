SEQUENCIA PARA CRIAR O PROJETO
Criar o arquivo package

### npm init

Instalar as dependências do projeto
### npm install express

Rodar o  projeto
### node app.js

Acessar o projeto no navegador
### http://localhost:8080

Instalar o módulo para reiniciar o servidor sempre que houver alteração no código
fonte, g significa globalmente

### npm install -g nodemon

Comandos básicos de MySQL
Criar o banco:

### create database iago character set utf8mb4 collate utf8mb4_unicode_ci;

Criar a tabela no banco de dados:
### CREATE TABLE `users`(
	`id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(220) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email` varchar(220) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
users

Inserir dados na tabela:
### INSERT INTO `users`(name, email) VALUES ('Carlos', 'carlos@gmail.com');

Visualizar os dados da tabela:
### SELECT id, name, email FROM users;

Acrescentar condição na busca de registros:
### SELECT id, name, email FROM users WHERE email='iago@gmail;.com' LIMIT 1;

Acrescentar mais condições na busca de registros:
### SELECT id, name, email FROM users WHERE email='iago@gmail;.com' AND name='Iago' LIMIT 1;
### SELECT id, name, email FROM users WHERE email='iago@gmail;.com' OR name='Iago' LIMIT 1;

Ordenar dados da tabela:
### SELECT id, name, email FROM users ORDER BY id DESC; 
Ordernar do mais recente primeiro

### SELECT id, name, email FROM users ORDER BY id ASC; 
Ordernar do mais antigo primeiro

Editar registro:
### UPDATE users SET name = 'Leandro', email='leandro@gmail.com' WHERE id = 5;

Excluir registro:
### DELETE FROM users WHERE id = 4;



Sequelize é uma biblioteca Javascript que facilita o gerenciamento de um banco de dados SQL:
### npm install --save sequelize

Instalar o drive do banco de dados:
### npm install --save mysql2

Instalar o módulo para criptografar a senha
### npm install --save bcryptjs

Instalar a dependência para JWT
### npm install --save jsonwebtoken

Gerenciar variáveis de ambiente
### npm install --save dotenv

Permitir acesso a API, headers
### npm install --save cors

Validar dados (Alternativa para a validação comum com JS)
### npm install --save yup

Enviar e-mail com Node
### npm install --save nodemailer

Multer é um middleware node js para manipulação multipart/form-data, usado para o upload de arquivos.
### npm install --save multer