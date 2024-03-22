const Sequelize = require('sequelize'); //Fazendo a requisição do sequelize

const db = require('./db'); //Fazendo a requisição do arquivo ./db

const User = db.define('users',{ //Definindo as propriedades dos atributos da tabela "users" do banco de dados
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    password: {
        type: Sequelize.STRING
    },
    recover_password: {
        type: Sequelize.STRING
    },
    image: {
        type: Sequelize.STRING
    }
});

//Criar a tabela
//User.sync({alter: true});
//Verificar se houve alteração na tabela
//User.sync( {alter: true} );

module.exports = User;