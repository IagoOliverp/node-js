const express = require("express"); //Fazer a requisição da dependência EXPRESS do node

var cors = require('cors');

const yup = require('yup'); //Ferramenta para criar condição dos campos do usuário (Neste caso no back-end)

const nodemailer = require('nodemailer');

const { Op, EagerLoadingError } = require('sequelize');//Fazer a rejeição do id na condição de editar usuário ao manter o mesmo email em sua edição

const bcrypt = require('bcryptjs');//Fazer a requisição da dependência bcryptjs para criptografia de senhas

const jwt = require("jsonwebtoken");

require('dotenv').config()

const fs = require('fs');
const path = require('path');

const {eAdmin} = require('./middlewares/auth')

const upload = require('./middlewares/uploadImgProfile');

const User = require('./models/User'); //Fazer a requisição da tabela "users" do banco de dados
const Chamados = require('./models/Chamados');//Fazer a requisição da tabela "chamados" do banco de dados

const auth = require("./middlewares/auth");

const app = express(); //Atribuir à uma variável (app) a dependência (express)

app.use(express.json()); //Definir que o projeto utilize arquivos em formato JSON, no caso as "req" e "res"

app.use('/files', express.static(path.resolve(__dirname, "public", "upload")));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization")
    app.use(cors());
    next();

});

app.get("/users/:page", eAdmin, async (req, res) => { //Rota para listar os dados do banco em formato JSON
    const {page = 1} = req.params;
    const limit = 40;
    var lastPage = 1;

    const countUser = await User.count();
    if (countUser === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: nenhum usuário encontrado!"
        });
    }else {
        lastPage = Math.ceil(countUser / limit);
    }
    
    await User.findAll({
        attributes: ['id', 'name', 'email', 'password'],
        order: [['id', 'DESC']],
        offset: Number((page * limit) - limit),
        limit: limit
    })
        .then((users) => {
            return res.json({
                erro: false,
                users,
                countUser,
                lastPage
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Nenhum usuário encontrado!"
            });
        });
});

app.get("/user/:id", eAdmin, async (req, res) => { //Rota para listar o usuário do banco pelo ID no parâmetro HTTP
    const {id} = req.params;

    await User.findByPk(id)
        .then((user) => {
            
            if (user.image){
                var endImage = process.env.URL_IMG + "/files/users/" + user.image;
            }else{
                var endImage = process.env.URL_IMG + "/files/users/imagem_usuario.png";
            }

            return res.json({
                erro: false,
                user,
                endImage
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Nenhum usuário encontrado!"
            });
        });
});

app.post("/user", eAdmin, async (req, res) => { //Rota para cadastrar usuário no banco de dados com senha criptografada utilizando a dependência (bcrypt)
    var dados = req.body;

    const schema = yup.object().shape({

        password: yup.string("Erro necessário preencher o campo senha!")
        .required("Erro necessário preencher o campo senha!").min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
        email: yup.string("Erro necessário preencher o campo e-mail!").email("Erro necessário preencher o campo e-mail!")
        .required("Erro necessário preencher o campo e-mail"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
        .required("Erro: Necessário preencher o campo nome!"),
        
    });

    try{
        await schema.validate(dados);
    }catch(err){
        return res.status(400).json({
            erro: true,
            mensagem: err.errors
        })
    }

    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    })

    if(user){
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Este email já está cadastrado"
        })
    }

    dados.password = await bcrypt.hash(dados.password, 8);

    await User.create(dados)
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário cadastrado com sucesso!"
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não cadastrado com sucesso!"
            });
        });
});


app.put("/user", eAdmin, async (req, res) => { //Rota para editar atributos do usuário do banco através do ID
    const {id} = req.body;

    const schema = yup.object().shape({

        /*password: yup.string("Erro necessário preencher o campo senha!")
        .required("Erro necessário preencher o campo senha!"),*/
        email: yup.string("Erro necessário preencher o campo e-mail!").email("Erro necessário preencher o campo e-mail!")
        .required("Erro necessário preencher o campo e-mail"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
        .required("Erro: Necessário preencher o campo nome!"),
        
    });

    try{
        await schema.validate(req.body);
    }catch(err){
        return res.status(400).json({
            erro: true,
            mensagem: err.errors
        })
    }

    const user = await User.findOne({
        where: {
            email: req.body.email,
            id: {
                [Op.ne]: id
            }
        }
    })

    if(user){
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Este email já está cadastrado"
        })
    }

    await User.update(req.body, {where: {id}})
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário editado com sucesso!"
            });
        }).catch (() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não editado com sucesso!"
            });
        });
});

app.put("/user-senha", eAdmin, async (req, res) => { //Rota para editar a senha do usuário do banco já criptografada
    const {id, password} = req.body;

    /*const schema = yup.object().shape({
        password: yup.string("Erro necessário preencher o campo senha!")
        .required("Erro necessário preencher o campo senha!")
        .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
    });

    try{
        await schema.validate(dados);
    }catch(err){
        return res.status(400).json({
            erro: true,
            mensagem: err.errors
        })
    }*/

    var senhaCrypt = await bcrypt.hash(password, 8);

    await User.update({password: senhaCrypt}, {where: {id}})
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Senha editada com sucesso!"
            });
        }).catch (() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Senha não editada com sucesso!"
            });
        });
});

app.delete("/user/:id", eAdmin, async (req, res) => { //Rota para deletar o usuário do banco através do ID
    const {id} = req.params;

    await User.destroy({ where: {id}})

    .then(() => { 
        return res.json({
            erro: false,
            mensagem: "Usuário excluido com sucesso!"
        });
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Usuário não excluído com sucesso!"
        });
    });
});

app.post("/login", async (req, res) => { //Rota para logar pelo email e senha do usuário do banco com condições

    /*await sleep(3000);

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    };*/

    const user = await User.findOne({
        attributes: ['id', 'name', 'email', 'password', 'image'],
        where: {
            email: req.body.email
        }
    });

    if (user === null){
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Usuário ou senha incorreta!"
        });
    };

    if (!(await bcrypt.compare(req.body.password, user.password))){
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Usuário ou senha incorreta!"
        });
    };

    var token = jwt.sign({id: user.id}, process.env.SECRET,{
        expiresIn: '7d', //7 dias
    });

    const { name,  image } = user;

    if (image) {
        var endImage = process.env.URL_IMG + "/files/users/" + image;

    }else{
        var endImage = process.env.URL_IMG + "/files/users/imagem_usuario.png";
    }

    return res.json({
        erro: false,
        mensagem: "Login Realizado com Sucesso!",
        user: {name, image: endImage},
        token
    });
});

app.get("/val-token", eAdmin, async (req, res) => {
    await User.findByPk(req.userId, {attributes: ['id', 'name', 'email']})
        .then((user) => {
            return res.json({
                erro: false,
                user
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Necessário realizar o login para acessar a página"
            });
        });
});

app.post("/add-user-login", async (req, res) => { //Rota para cadastrar usuário no banco de dados com senha criptografada utilizando a dependência (bcrypt)
    var dados = req.body;

    const schema = yup.object().shape({

        password: yup.string("Erro necessário preencher o campo senha!")
        .required("Erro necessário preencher o campo senha!").min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
        email: yup.string("Erro necessário preencher o campo e-mail!").email("Erro necessário preencher o campo e-mail!")
        .required("Erro necessário preencher o campo e-mail"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
        .required("Erro: Necessário preencher o campo nome!"),
        
    });

    try{
        await schema.validate(dados);
    }catch(err){
        return res.status(400).json({
            erro: true,
            mensagem: err.errors
        })
    }

    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    })

    if(user){
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Este email já está cadastrado"
        })
    }

    dados.password = await bcrypt.hash(dados.password, 8);

    await User.create(dados)
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário cadastrado com sucesso!"
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não cadastrado com sucesso!"
            });
        });
});

app.get("/view-profile", eAdmin, async (req, res) => { //Rota para listar o usuário do banco pelo ID no parâmetro HTTP
    const id = req.userId;

    await User.findByPk(id)
        .then((user) => {
            if (user.image){
                var endImage = process.env.URL_IMG + "/files/users/" + user.image;
            }else{
                var endImage = process.env.URL_IMG + "/files/users/imagem_usuario.png";
            }
            
            return res.json({
                erro: false,
                user,
                endImage
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Perfil de usuário não encontrado!"
            });
        });
});

app.put("/edit-profile", eAdmin, async (req, res) => { //Rota para editar atributos do usuário do banco através do ID
    const id = req.userId;

    const schema = yup.object().shape({

        /*password: yup.string("Erro necessário preencher o campo senha!")
        .required("Erro necessário preencher o campo senha!"),*/
        email: yup.string("Erro necessário preencher o campo e-mail!").email("Erro necessário preencher o campo e-mail!")
        .required("Erro necessário preencher o campo e-mail"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
        .required("Erro: Necessário preencher o campo nome!"),
        
    });

    try{
        await schema.validate(req.body);
    }catch(err){
        return res.status(400).json({
            erro: true,
            mensagem: err.errors
        })
    }

    const user = await User.findOne({
        where: {
            email: req.body.email,
            id: {
                [Op.ne]: id
            }
        }
    })

    if(user){
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Este email já está cadastrado"
        })
    }

    await User.update(req.body, {where: {id}})
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Perfil editado com sucesso!"
            });
        }).catch (() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Perfil não editado com sucesso!"
            });
        });
});

app.put("/edit-profile-password", eAdmin, async (req, res) => { //Rota para editar a senha do usuário do banco já criptografada
    const id = req.userId;
    const {password} = req.body;

    var senhaCrypt = await bcrypt.hash(password, 8);

    await User.update({password: senhaCrypt}, {where: {id}})
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Senha editada com sucesso!"
            });
        }).catch (() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Senha não editada com sucesso!"
            });
        });
});

app.post("/recover-password", async (req, res) => { //Rota para logar pelo email e senha do usuário do banco com condições

    var dados = req.body

    const user = await User.findOne({ //Verificar se existe o email no banco
        attributes: ['id', 'name', 'email'],
        where: {
            email: dados.email
        }
    });
    if (user === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Usuário não encontrado!"
        });
    };

    dados.recover_password = (await bcrypt.hash(user.id + user.name + user.email, 8)).replace(/\./g, "").replace(/\//g, "")

    await User.update(dados, {where: {id: user.id}})
        .then(() => {
            var transport = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        
            var message = {
                from: process.env.EMAIL_FROM_PASS,
                to: dados.email,
                subject: "Guia para recuperar a senha",
                text: "Prezado(a) colaborador(a).\n\nVocê solicitou alteração de senha.\n\nPara continuar o processo de recuperação de senha, clique no link abaixo ou cole o endereço no seu navegador: " + dados.url + dados.recover_password + " \n\nSe você não solicitou essa alteração, nenhuma ação é necessária. Sua senha permanecerá a mesma até que você ative este código.\n\n",
                html: "Prezado(a) colaborador(a).<br><br>Você solicitou alteração de senha.<br><br>Para continuar o processo de recuperação de senha, clique no link abaixo ou cole o endereço no seu navegador: <a href='" + dados.url + dados.recover_password + "'>" + dados.url + dados.recover_password + "</a> <br><br>Se você não solicitou essa alteração, nenhuma ação é necessária. Sua senha permanecerá a mesma até que você ative este código.<br><br>"
            };
        
            transport.sendMail(message, function(err){
                if (err) return res.status(400).json({
                    erro: true,
                    mensagem: "Erro: E-mail com as instruções para recuperar a senha não enviado, tente novamente!"
                });
                return res.json({
                    erro: false,
                    mensagem: "E-mail enviado com instruções para recuperar a senha. Acesse a sua caixa de email para recuperar a senha!"
                })
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: E-mail com as instruções para recuperar a senha não enviado, tente novamente!"
            });
        });
        
});

app.get("/val-key-recover-pass/:key", async (req, res) => {

    const { key } = req.params;

    const user = await User.findOne({
        attributes: ['id'],
        where: {
            recover_password: key
        }
    });
    
    if (user === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Link inválido!"
        });
    };

    return res.json({
        erro: false,
        mensagem: "Chave válida"
    });

})

app.put('/update-password/:key', async (req, res) => {
    const {key} = req.params;
    const {password} = req.body;

    var senhaCrypt = await bcrypt.hash(password, 8)

    await User.update({password: senhaCrypt, recover_password: null}, {where: {recover_password: key} })
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Senha editada com sucesso!" 
            })
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Senha não editada com sucesso!"
            })
        }); 
})

app.put("/edit-profile-image", eAdmin, upload.single('image'), async (req, res) => {

    if(req.file){

        await User.findByPk(req.userId)
        .then(user => {
            const imgOld = "./public/upload/users/" + user.dataValues.image;
            fs.access(imgOld, (err) => {
                if(!err){
                    fs.unlink(imgOld, () => {});
                }
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Perfil não encontrado!"
            });
        })

        await User.update({image: req.file.filename}, {where: { id: req.userId }})
        .then(() => {
            return res.json({
                erro: false,
                mensagem:" Imagem do perfil editada com sucesso!",
                image: process.env.URL_IMG + "/files/users/" + req.file.filename
            });
        }).catch (() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Imagem do perfil não editada com sucesso!"
            });
        });

    } else{
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Selecione uma imagem válida JPEG ou PNG!"
        });
    }
});

app.put("/edit-user-image/:id", eAdmin, upload.single('image'), async (req, res) => {

    const { id } = req.params;

    if (req.file) {

        await User.findByPk(id)
        .then(user => {
            const imgOld = "./public/upload/users/" + user.dataValues.image;
            fs.access(imgOld, (err) => {
                if(!err){
                    fs.unlink(imgOld, () => {});
                }
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não encontrado"
            });
        });

        await User.update({image: req.file.filename}, {where: {id}})
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Imagem do perfil editada com sucesso!",
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Imagem não editada com sucesso!"
            });
        });
    } else {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Selecione uma imagem válida JPEG ou PNG!"
        })
    }

});

app.get("/dashboard", eAdmin, async (req, res) => {
    
    await User.count()
    .then((count) => {
        return res.status(200).json({
            erro: false,
            count
        })
    }).catch((err) => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Nenhum usuário encontrado"
        })
    })

})

app.post("/add-ticket", eAdmin, async (req, res) => {

    const dados_chamado = req.body;

    await Chamados.create(dados_chamado)
    .then(() => {
        return res.status(200).json({
            erro: false,
            mensagem: "Chamado aberto com sucesso!"
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: não foi possível abrir o chamado"
        })
    })
})

app.get("/get-user-profile-name", eAdmin, async (req, res) => {

    var id = req.userId;

    await User.findByPk(id)
    .then((user) => {
        return res.json({
            erro: false,
            id,
            mensagem: user.name
        })
    }).catch(() => {
        return res.json({
            erro: true,
            mensagem: "Erro: usuário não encontrado"
        })
    })

})

app.get("/list-tickets/:page", eAdmin, async (req, res) => {

    const {page = 1} = req.params;
    const limit = 40;
    var lastPage = 1;

    const countTicket = await Chamados.count();
    if (countTicket === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: nenhum chamado encontrado!"
        });
    }else {
        lastPage = Math.ceil(countTicket / limit);
    }

    await Chamados.findAll({
        attributes: ['id', 'nome_usuario', 'localizacao', 'tipo', 'categoria', 'titulo_chamado', 'prioridade', 'status_chamado', 'createdAt'],
        order: [['id', 'DESC']],
        offset: Number((page * limit) - limit),
        limit: limit
    })
    .then((chamado) => {
        return res.json({
            erro: false,
            chamado
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: não foi possível retornar os valores"
        })
    })
})

app.get("/list-new-tickets/:page", async (req, res) => {

    const {page = 1} = req.params;
    const limit = 40;
    var lastPage = 1;

    const countTicket = await Chamados.count({where: {status_chamado: 'Novo'}});
    if (countTicket === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: nenhum chamado novo encontrado!",
        });
    }else {
        lastPage = Math.ceil(countTicket / limit);
    }

    await Chamados.findAll({
        where: {
            status_chamado: 'Novo'
        },
        attributes: ['id', 'nome_usuario', 'localizacao', 'tipo', 'categoria', 'titulo_chamado', 'prioridade', 'status_chamado', 'createdAt'],
        order: [['id', 'DESC']],
        offset: Number((page * limit) - limit),
        limit: limit
    })
    .then((chamado) => {
        return res.json({
            erro: false,
            chamado
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: não foi possível retornar os chamados novos!"
        })
    })
})

app.get("/list-pgs-tickets/:page", async (req, res) => {

    const {page = 1} = req.params;
    const limit = 40;
    var lastPage = 1;

    const countTicket = await Chamados.count({where: {status_chamado: 'Em andamento'}});
    if (countTicket === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: nenhum chamado em andamento encontrado!"
        });
    }else {
        lastPage = Math.ceil(countTicket / limit);
    }

    await Chamados.findAll({
        where: {
            status_chamado: 'Em andamento'
        },
        attributes: ['id', 'nome_usuario', 'localizacao', 'tipo', 'categoria', 'titulo_chamado', 'prioridade', 'status_chamado', 'createdAt'],
        order: [['id', 'DESC']],
        offset: Number((page * limit) - limit),
        limit: limit
    })
    .then((chamado) => {
        return res.json({
            erro: false,
            chamado
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: não foi possível retornar os chamados em andamento!"
        })
    })
})

app.get("/list-end-tickets/:page", async (req, res) => {

    const {page = 1} = req.params;
    const limit = 40;
    var lastPage = 1;

    const countTicket = await Chamados.count({where: {status_chamado: 'Atendido'}});
    if (countTicket === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: nenhum chamado atendido encontrado!"
        });
    }else {
        lastPage = Math.ceil(countTicket / limit);
    }

    await Chamados.findAll({
        where: {
            status_chamado: 'Atendido'
        },
        attributes: ['id', 'nome_usuario', 'localizacao', 'tipo', 'categoria', 'titulo_chamado', 'prioridade', 'status_chamado', 'createdAt'],
        order: [['id', 'DESC']],
        offset: Number((page * limit) - limit),
        limit: limit
    })
    .then((chamado) => {
        return res.json({
            erro: false,
            chamado
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: não foi possível retornar os chamados atendidos!"
        })
    })
})

app.get("/view-ticket/:id", eAdmin, async (req, res) => {

    const { id } = req.params;

    await Chamados.findByPk(id)
    .then((chamado) => {
        return res.json({
            erro: false,
            chamado
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Chamado não encontrado!"
        })
    })

})

app.put("/edit-ticket-status/:id", async (req, res) => {

    const { id } = req.params;

    const { status_chamado } = req.body;

    await Chamados.update({status_chamado}, {where: {id}})
    .then(() => {
        return res.json({
            erro: false,
            mensagem: "Chamado editado com sucesso!"
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: não foi possível editar o chamado!"
        })
    })
})

app.delete("/ticket/:id", eAdmin, async (req, res) => {

    const { id } = req.params;

    await Chamados.destroy({ where: {id} })
    .then(() => {
        return res.json({
            erro: false,
            mensagem: "Chamado apagado com sucesso!"
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: chamado não excluído"
        })
    })
})

app.get("/dashboard-new-tickets", eAdmin, async (req, res) => {

    await Chamados.count({where: {status_chamado: 'Novo'}})
    .then((count) => {
        return res.json({
            erro: false,
            count
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: 'Nenhum chamado Novo encontrado!'
        })
    })
})

app.get("/dashboard-pgs-tickets", eAdmin, async (req, res) => {

    await Chamados.count({where: {status_chamado: 'Em andamento'}})
    .then((count) => {
        return res.json({
            erro: false,
            count
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: 'Nenhum chamado em andamento encontrado!'
        })
    })
})

app.get("/dashboard-end-tickets", eAdmin, async (req, res) => {

    await Chamados.count({where: {status_chamado: 'Atendido'}})
    .then((count) => {
        return res.json({
            erro: false,
            count
        })
    }).catch(() => {
        return res.status(400).json({
            erro: true,
            mensagem: 'Nenhum chamado atendido encontrado!'
        })
    })
})



app.listen(8080, () => {console.log("Servidor iniciado na porta 8080: http://localhost:8080");
});       
    


