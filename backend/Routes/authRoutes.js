const express = require('express');

const authRoutes = express.Router();
const authController = require('../Controller/authController');


authRoutes.post('/login', authController.login);
authRoutes.post('/register',authController.register);

// public event listing for registration dropdown
const eventController = require('../Controller/eventController');
authRoutes.get('/events', eventController.getEvents);

module.exports=authRoutes;