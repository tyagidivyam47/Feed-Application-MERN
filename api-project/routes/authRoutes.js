const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controller/auth');


const route = express.Router();

route.put('/signup',
    [
        body('email')
            .trim()
            .isEmail()
            .withMessage("Please Enter a Valid Email")
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(userDoc => {
                        if (userDoc) {
                            return Promise.reject("Email already exists!")
                        }
                    })
            })
            .normalizeEmail()
        ,
        body('password').trim().isLength({ min: 5 })
    ],
    authController.signup
)

route.post('/login', authController.login);

module.exports = route;