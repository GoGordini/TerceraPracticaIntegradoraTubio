import { Router } from 'express';
import passport from 'passport';
import {passportStrategiesEnum,accessRolesEnum} from "../config/enums.js";
import { config } from 'dotenv';
import { generateToken,authorization} from '../utils.js';
import {passportCall} from "../config/passport.config.js";
import {getUserCurrent} from "../controllers/users.controller.js";
//import {usersSchema} from "../schemas/users.schema.js";

const router = Router();


router.post("/register",passport.authenticate(passportStrategiesEnum.REGISTER,{failureRedirect: "fail-register"}), async (req, res) => {
    res.status(201).send({ status: 'success', message: 'user registered' })}) //passport.auth es un middleware. Pongo register, primer parámetro, porque en config puse passport.use("register"). Segundo parámetro es el camino como plan B (si falla va a la ruta fail-register).

router.get('/fail-register', async (req, res) => {
    res.status(500).send({ status: 'error', message: 'register fail' });
});

router.post('/login', passport.authenticate(passportStrategiesEnum.LOGIN, { failureRedirect: 'fail-login' }), async (req, res) => {
    if(!req.user) { //user me lo trae passport
        return res.status(401).send({ status: 'error', message: 'invalid credentials' })
    }
    req.user = {
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        email: req.user.email,
        age: req.user.age,
        cart: req.user.cart,
        isAdmin:(req.user.email==config.mailAdmin),
        role: req.user.role,
    }
    const accessToken=generateToken(req.user);
    res.cookie('coderCookieToken', accessToken, { maxAge: 60 * 60 * 1000, httpOnly: true }).send({ status: 'success', message: 'login success' })

    //res.send({ status: 'success', message: 'login success',access_token:accessToken })
});

router.get('/current', passportCall("jwt"), authorization(accessRolesEnum.ADMIN),getUserCurrent);

router.get('/fail-login', async (req, res) => {
    res.status(500).send({ status: 'error', message: 'login fail' });
});

router.get('/logout', (req, res) => {
    res.clearCookie("coderCookieToken").redirect('/login');
     //vuelve al login.
    });

//Redirige para que nos autentiquemos con github.
router.get('/github', passport.authenticate(passportStrategiesEnum.GITHUB, {scope: ['user:email']}), async(req, res) => {
    res.send({ status: 'success', message: 'user registered' }); //dentro del middleware pongo "github" porque en passport.use lo llamé github. El scope tb viene de ahí.
});

//callback para que una vez autenticados con github, nos redireccione a nuestra app.
router.get('/github-callback', passport.authenticate(passportStrategiesEnum.GITHUB, { failureRedirect: '/login' }), async(req, res) => {
  //  req.session.user = req.user; //en la ruta de arriba la parte de api/sessions no hace falta. La parte de session no cambia.
//   req.session.user = {
//     first_name: req.user.first_name,
//     last_name: req.user.last_name,
//     email: req.user.email,
//     age: req.user.age,
//     cart: req.user.cart,
//     isAdmin:(req.user.email=="adminCoder@coder.com")
// }  
    req.newUser=req.user
    req.newUser = {
    first_name: req.user.first_name,
    last_name: req.user.last_name,
    email: req.user.email,
    age: req.user.age,
    cart: req.user.cart,
    isAdmin:(req.user.email=="adminCoder@coder.com"),
    role: req.user.role
}  
    const accessToken=generateToken(req.newUser);
    res.cookie('coderCookieToken', accessToken, { maxAge: 60 * 60 * 1000, httpOnly: true }).redirect('/products');
});

export default router;


// import { Router } from 'express';
// import passport from 'passport';
// import {passportStrategiesEnum,accessRolesEnum} from "../config/enums.js";
// import { config } from 'dotenv';
// import { generateToken,authorization} from '../utils.js';
// import {passportCall} from "../config/passport.config.js";
// import UsersDto from '../DTO/users.dto.js';
// import UsersRepository from '../repositories/users.repository.js';
// //import { getUser, createUser} from '../controllers/users.controller.js';
// //import {usersSchema} from "../schemas/users.schema.js";

// //const usersRepository=new UsersRepository
// const router = Router();


// router.post("/register",passport.authenticate(passportStrategiesEnum.REGISTER,{failureRedirect: "fail-register"}), async (req, res) => {
//     res.status(201).send({ status: 'success', message: 'user registered' })}) //passport.auth es un middleware. Pongo register, primer parámetro, porque en config puse passport.use("register"). Segundo parámetro es el camino como plan B (si falla va a la ruta fail-register).

// router.get('/fail-register', async (req, res) => {
//     res.status(500).send({ status: 'error', message: 'register fail' });
// });

// router.post('/login', passport.authenticate(passportStrategiesEnum.LOGIN, { failureRedirect: 'fail-login' }), async (req, res) => {
//     if(!req.user) { //user me lo trae passport
//         return res.status(401).send({ status: 'error', message: 'invalid credentials' })
//     }
//     req.user = {
//         first_name: req.user.first_name,
//         last_name: req.user.last_name,
//         email: req.user.email,
//         age: req.user.age,
//         cart: req.user.cart,
//         isAdmin:(req.user.email==config.mailAdmin),
//         role: req.user.role,
//     }
//     const accessToken=generateToken(req.user);
//     res.cookie('coderCookieToken', accessToken, { maxAge: 60 * 60 * 1000, httpOnly: true }).send({ status: 'success', message: 'login success' })

//     //res.send({ status: 'success', message: 'login success',access_token:accessToken })
// });

// // router.get('/current', async (req, res) => {
// //     if(!req.user) { //user me lo trae passport
// //         return res.status(400).send({ status: 'error', message: 'no user' })
// //     }
// //     res.status(200).send({ status: 'success', payload: req.user });
// // });

// // router.get('/current', authToken, (req, res) => {
// //     res.send({ status: 'success', payload: req.user });
// // });

// router.get('/current', passportCall("jwt"), authorization(accessRolesEnum.ADMIN),(req, res) => {
//     const data = new UsersDto(req.user);
//     res.send({ status: 'success', payload: data });
// });

// router.get('/fail-login', async (req, res) => {
//     res.status(500).send({ status: 'error', message: 'login fail' });
// });

// router.get('/logout', (req, res) => {
//     res.clearCookie("coderCookieToken").redirect('/login');
//      //vuelve al login.
//     });

// //Redirige para que nos autentiquemos con github.
// router.get('/github', passport.authenticate(passportStrategiesEnum.GITHUB, {scope: ['user:email']}), async(req, res) => {
//     res.send({ status: 'success', message: 'user registered' }); //dentro del middleware pongo "github" porque en passport.use lo llamé github. El scope tb viene de ahí.
// });

// //callback para que una vez autenticados con github, nos redireccione a nuestra app.
// router.get('/github-callback', passport.authenticate(passportStrategiesEnum.GITHUB, { failureRedirect: '/login' }), async(req, res) => {
//   //  req.session.user = req.user; //en la ruta de arriba la parte de api/sessions no hace falta. La parte de session no cambia.
// //   req.session.user = {
// //     first_name: req.user.first_name,
// //     last_name: req.user.last_name,
// //     email: req.user.email,
// //     age: req.user.age,
// //     cart: req.user.cart,
// //     isAdmin:(req.user.email=="adminCoder@coder.com")
// // }  
//     req.newUser=req.user
//     req.newUser = {
//     first_name: req.user.first_name,
//     last_name: req.user.last_name,
//     email: req.user.email,
//     age: req.user.age,
//     cart: req.user.cart,
//     isAdmin:(req.user.email=="adminCoder@coder.com"),
//     role: req.user.role
// }  
//     const accessToken=generateToken(req.newUser);
//     res.cookie('coderCookieToken', accessToken, { maxAge: 60 * 60 * 1000, httpOnly: true }).redirect('/products');
// });

// export default router;