const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Introdueix tots els camps' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'Usuari ja existent' });
        }

        user = new User({
            name,
            email,
            password
        });

        await user.save();

        res.status(201).json({
            msg: 'Usuari registrat correctament',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;
