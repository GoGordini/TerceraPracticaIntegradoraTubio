import express from "express";
import nodemailer from "nodemailer";
import twilio from "twilio";
import handlebars from "express-handlebars";
import {__dirname,chatPath,productPath} from "./utils.js";
import viewsRouter from "./routes/views.router.js";
import productsRouter from './routes/products.router.js';
import cartsRouter from "./routes/carts.router.js";
import { Server } from "socket.io";
import mongoose from "mongoose";
// import ProductManager from "./dao/dbManager/products.db.js";
// import ChatManager from "./dao/dbManager/chat.db.js";
import { ProductManager,ChatManager } from './dao/factory.js';
const chatManager= new ChatManager(chatPath);
const productManager= new ProductManager(productPath);
// import ChatManager from "./dao/fileManager/chat.file.js";
// const chatManager= new ChatManager(chatPath);
import usersRouter from './routes/users.router.js';
import MongoStore from 'connect-mongo';
import session from 'express-session';
import {initializePassport} from "./config/passport.config.js"
import passport from "passport";
import configs from "./config.js";
import SessionsRouter from './routes/sessions.test.router.js';
import TestsRouter from './routes/tests.router.js';
import cookieParser from "cookie-parser";
import errorHandler from './middlewares/errors/index.js';
import { addLogger } from './loggers.js';

const testsRouter = new TestsRouter();
const sessionTestsRouter = new SessionsRouter();

const app = express ();

try{
    await mongoose.connect(configs.mongoUrl);
   // await mongoose.connect("mongodb+srv://eleonoratubio:jT0Z0SKpSILu6qvz@cluster0.4gfsjbp.mongodb.net/clase21?retryWrites=true&w=majority");
    console.log("Connected to DB");
}
catch(error){console.log(error.message)};

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.engine("handlebars",handlebars.engine()); //qué motor de plantillas uso//
app.use(cookieParser());
app.use(addLogger);

app.set('views', `${__dirname}/views`); //donde están las vistas, con path abs//
app.set("view engine", "handlebars"); 
app.use(express.static(`${__dirname}/public`));    

app.use(session({ //esto debe ir antes de setear las rutas
    store: MongoStore.create({
        client: mongoose.connection.getClient(), //reutilizo la conexión a mongoose de arriba.
        ttl: 3600
    }),
    secret: 'Coder5575Secret',
    resave: true, //nos sirve para poder refrescar o actualizar la sesión luego de un de inactivadad. En true no da problemas cuando aún no inicié sesión.
    saveUninitialized: true, //nos sirve para desactivar el almacenamiento de la session si el usuario aún no se ha identificado o aún no a iniciado sesión
    // cookie: {
    //     maxAge: 30000
    // }
}));

//Passport config
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

// const transporter=nodemailer.createTransport({
// 	service:"gmail",
// 	port: 587, //lo indica gmail
// 	auth:{
//     user:configs.userNodemailer,
//     pass:configs.passwordNodemailer} //sin espacios
// })

// app.get("/mail",async(req,res)=>{
// await transporter.sendMail({
//     from:"GordiniApp",
//     to:"eleonora.tubio@gmail.com",
//     subject:"Importante",
//    html:`<div><h1>Puto el que lee</h1></div>`,
// //   html:`<div><h1>Puto el que lee</h1><img src="cid:dog"/></div>`,
//     // attachments:[{
//     //     filename:"dog.jpeg",
//     //     path:"src/dog.jpeg",
//     //     cid:"dog"
//     // }]
//     attachments:[]
// })
// res.send("Correo enviado");
// })

// const TWILIO_ACCOUNT_SID=configs.twilio_account_SID;
// const TWLIO_AUTH_TOKEN=configs.twilio_auth_token;
// const TWILIO_NUMBER=configs.twilio_number;

// const client = twilio(
// TWILIO_ACCOUNT_SID,
// TWLIO_AUTH_TOKEN,
// TWILIO_NUMBER
// )

app.get("/sms", async(req,res)=>{
await client.messages.create({
from: TWILIO_NUMBER,
to: "+5491160520881",
body:"Prueba Twilio"
});
res.send("SMS enviado");
})


app.use("/", viewsRouter);
app.use('/api/tests', testsRouter.getRouter());
app.use('/api/sessiontests', sessionTestsRouter.getRouter());
app.use("/api/products",productsRouter);
app.use("/api/carts",cartsRouter);
app.use('/api/sessions', usersRouter);
app.use((req, res) => {
    res.status(404).send('Error 404: Page Not Found');
  });

  //middleware global para trabajar los errores de joi. Si viene de joi tiene un flag isJoi.
  app.use((err, req, res, next) => {
    if(err && err.error && err.error.isJoi) {
        res.status(422).json({
            type: err.type,
            message: err.error.toString()
        })
    } else {
        next(err);
    }
})

app.use(errorHandler);

const server= app.listen(8080, ()=>console.log("Server running"));
//const socketServer = new Server(server);
const io = new Server(server);
app.set("socketio",io);

//const messages = [];

io.on("connection",async(socket) =>{
    const messages = await chatManager.getAll();
    console.log("Nuevo cliente conectado");
//lee el evento authenticated; el frontend es index.js. Leemos la data (lo que envío desde index.js)
    socket.on("authenticated",data=>{
    socket.emit("messageLogs",messages); //Enviamos todos los mensajes hasta el momento, únicamnete a quien se acaba de conectar.
    socket.broadcast.emit("newUserConnected",data);
});
//lee el evento message
    socket.on("message",async(data)=>{
    //messages.push(data);
    await chatManager.save(data);
    const newMessage = await chatManager.getAll();
    io.emit("messageLogs",newMessage) //envío a todos lo que hay almacenado.
})

})