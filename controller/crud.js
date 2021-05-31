const connection = require('../database/db');

//Invocamos a bcryptjs para encriptar pass
const bcryptjs = require('bcryptjs');
const session = require('express-session');

exports.save = async (req, res) => {
    const type = req.params.type;
    if(type === "users"){
        const user = req.body.user;
        const name = req.body.name;
        const rol = req.body.rol;
        const pass = req.body.pass;
        let passwordHash = await bcryptjs.hash(pass, 8);
        connection.query('insert into users set ?', { user:user, name:name, role:rol, pass:passwordHash}, (error, results) => {
            if(error){
                console.log(error);
            }else{
                res.redirect('/users');
            }
        })
    }else{
        const name = req.body.name;
        const id_document = req.body.id_document;
        const email = req.body.email;
        const address = req.body.address;
        connection.query('insert into clients set ?', { name:name, id_document:id_document, email:email, address:address}, (error, results) => {
            if(error){
                console.log(error);
            }else{
                res.redirect('/clients');
            }
        })
    }
};

exports.create = (req, res) => {
    const type = req.params.type;
    if(req.session.loggedIn){
        req.session.page_name = type;
            connection.query('select * from users', (error, results) => {
                if(error){
                    console.log(error);
                }else{
                    res.render('create', {
                        name: req.session.name,
                        rol: req.session.rol,
                        page_name: req.session.page_name,
                        results: results,
                        type: type
                    })
                }
            })
    }else{
        res.redirect('login')
    }
}

exports.update = async (req, res) => {
    const type = req.session.page_name;
    const id = req.body.id;
    if(type === "users"){
        const user = req.body.user;
        const name = req.body.name;
        const rol = req.body.rol;
        const pass = req.body.pass;
        let passwordHash = await bcryptjs.hash(pass, 8);
        connection.query('update users set ? where id = ?', [{ user:user, name:name, role:rol, pass:passwordHash}, id], (error, results) => {
            if(error){
                console.log(error);
            }else{
                res.redirect('/users');
            }
        })
    }else{
        const name = req.body.name;
        const id_document = req.body.id_document;
        const email = req.body.email;
        const address = req.body.address;
        connection.query('update clients set ? where id = ?', [{ name:name, id_document:id_document, email:email, address:address}, id], (error, results) => {
            if(error){
                console.log(error);
            }else{
                res.redirect('/clients');
            }
        })
    }
}

exports.edit = (req, res) => {
    const id = req.params.id;
    const type = req.session.page_name;
    if(req.session.loggedIn){
        req.session.page_name = type;
        const sql = "select * from "+ type +" where id="+id;
        connection.query(sql, (error, results) => {
            if(error){
                console.log(error);
            }else{
                res.render('edit', {
                    name: req.session.name,
                    rol: req.session.rol,
                    page_name: req.session.page_name,
                    data: results[0],
                    type: type
                })
            }
        })
    }else{
        res.redirect('/login')
    }
}

exports.delete = (req, res) => {
    const id = req.params.id;
    const type = req.session.page_name;
    if(req.session.loggedIn){
        const sql = "delete from "+type+" where id ="+id;
        connection.query(sql, (error, results) => {
            if(error){
                console.log(error);
            }else{
                res.redirect('/'+type)
            }
        })
    }else{
        res.redirect('/'+type);
    }
}
