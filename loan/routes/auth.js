const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/auth');


router.route('/login')
    .get(authController.login_get)

// GOOGLE AUTH:
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'] // here 'profile' is not must, but needed if we want 'displayName' and some others.
}));

// REDIRECT URL:
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    req.flash('primary', `Welcome ${req.user.name}`)
    res.redirect('/home');
});

router.get('/logout', authController.logout);
module.exports = router;
