const express = require('express');

const authRoutes = express.Router();
const authController = require('../Controller/authController');


authRoutes.post('/login', authController.login);
authRoutes.post('/register',authController.register);

module.exports=authRoutes;