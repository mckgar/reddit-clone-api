const router = require('express').Router();
const userController = require('../controllers/userController');

router.post('/', userController.create_user);

module.exports = router;
