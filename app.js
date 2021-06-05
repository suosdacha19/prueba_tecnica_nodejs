//Prueba de git
//Invocamos express
const express = require('express');
const app = express();

//Seteamos urlencoded para capturar datos 
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//Invocamos dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});

//Seteamos directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//Establecemos el motor de plantillas
app.set('view engine', 'ejs');

//Invocamos a bcryptjs para encriptar pass
const bcryptjs = require('bcryptjs');
const session = require('express-session');

//Variable de sesion
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

//Modulo de conexion
const connection = require('./database/db');

//Invocamos metodos crud
const crud = require('./controller/crud');

//Establecemos rutas
app.get('/login', (req, res) => {
    if(req.session.loggedIn){
        res.redirect('/dashboard')
    }else{
        res.render('login')
    }
})

app.get('/register', (req, res) => {
    res.render('register');
})

app.listen(3000,(req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
})

//Registro de Usuarios
app.post('/register', async (req, res) => {
    const user = req.body.user;
    const name = req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO users SET ?',{ user:user, name:name, role:rol, pass:passwordHash }, async (error, results) => {
        if(error){
            if(error.code === "ER_DUP_ENTRY"){
                res.render('register',{
                    alert: true,
                    alertTitle: "Warning",
                    alertMessage: "User not available",
                    alertIcon: 'warning',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'register'
                })
            }else{
                console.log(error)
            }
        }else{
            res.render('register',{
                alert: true,
                alertTitle: "Registration",
                alertMessage: "¡Succesful Registration!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 2000,
                ruta: 'login'
            })
        }
    })
})

//Autenticacion
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const password = req.body.pass;
    let passwordHash = await bcryptjs.hash(password, 8);
    if(user && password){
        connection.query('SELECT * FROM users WHERE user = ?',[user], async (error, results) => {
            if(results.length == 0 || !(await bcryptjs.compare(password, results[0].pass))){
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Incorrect username and/or password",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            }else{
                req.session.loggedIn = true;
                req.session.name = results[0].name;
                req.session.rol = results[0].role;
                res.render('login', {
                    alert: true,
                    alertTitle: "Successful connection",
                    alertMessage: "Login correct",
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: 'dashboard',
                });
            }
        })
    }else{
        res.render('login', {
            alert: true,
            alertTitle: "Warning",
            alertMessage: "Please enter a username and/or password",
            alertIcon: 'warning',
            showConfirmButton: true,
            timer: false,
            ruta: 'login'
        });
    }
})

//Ruta y autenticacion pages, verifica si el usuario esta logueado
app.get('/', (req, res) => {
    if(req.session.loggedIn){
        res.redirect('/dashboard')
    }else{
        res.render('login')
    }
})

app.get('/dashboard', (req, res) => {
    if(req.session.loggedIn){
        req.session.page_name = "dashboard";
        res.render('dashboard', {
            name: req.session.name,
            rol: req.session.rol,
            page_name: req.session.page_name
        })
    }else{
        res.redirect('login')
    }
})

app.get('/users', (req, res) => {
    if(req.session.loggedIn){
        if(req.session.rol === "administrator"){
            req.session.page_name = "users";
            connection.query('select * from users', (error, results) => {
                if(error){
                    console.log(error);
                }else{
                    res.render('users', {
                        name: req.session.name,
                        rol: req.session.rol,
                        page_name: req.session.page_name,
                        results: results
                    })
                }
            })
        }else{
            res.render('dashboard', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "You do not have the necessary permissions",
                alertIcon: 'error',
                showConfirmButton: true,
                timer: false,
                ruta: 'dashboard',
                name: req.session.name,
                rol: req.session.rol,
                page_name: req.session.page_name
            });
        }
    }else{
        res.redirect('login')
    }
})

app.get('/clients', (req, res) => {
    if(req.session.loggedIn){
        req.session.page_name = "clients";
            connection.query('select * from clients', (error, results) => {
                if(error){
                    console.log(error);
                }else{
                    res.render('clients', {
                        name: req.session.name,
                        rol: req.session.rol,
                        page_name: req.session.page_name,
                        results: results
                    })
                }
            })
    }else{
        res.redirect('login')
    }
})

app.get('/reports', (req, res) => {
    if(req.session.loggedIn){
        req.session.page_name = "reports";
        res.render('reports', {
            name: req.session.name,
            rol: req.session.rol,
            page_name: req.session.page_name
        })
    }else{
        res.redirect('/login')
    }
})

app.post('/save/:type', crud.save)
app.post('/update/:type', crud.update)

app.get('/create/:type', crud.create)
app.get('/edit/:id', crud.edit)
app.get('/delete/:id', crud.delete)




//Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    })
})