const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');


exports.signup = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    const hashedPassword = bcrypt.hashSync(password, 12);

    const user = new User({
        email: email,
        name: name,
        password: hashedPassword
    })

    user.save()
        .then((result) => {
            res.status(201).json({ message: "User Created", userId: result._id })
        })
        .catch((err) => {
            if (!err, statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;

    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                const error = new Error("A user with this email not found");
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;

            const isEqual = bcrypt.compareSync(password, user.password);

            if (!isEqual) {
                const error = new Error("Password is incorrect");
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign(
                {
                    email: user.email,
                    userId: user._id.toString()
                },
                'secret',
                { expiresIn: "1hr" }
            )
            res.status(200).json({ token: token, userId: user._id });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}