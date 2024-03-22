const Sequelize = require('sequelize');

const db = require('./db');

const Chamados = db.define('chamados', {

    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    nome_usuario: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    contato_celular: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
    },
    localizacao: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    tipo: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    categoria: {
        type: Sequelize.STRING,
        allowNull: false,
    },  
    titulo_chamado: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    descricao_problema: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    prioridade: {
        type: Sequelize.TEXT,
    },
    status_chamado: {
        type: Sequelize.STRING,
    },
    
});

module.exports = Chamados;

//Chamados.sync({force: true});