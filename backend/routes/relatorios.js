const express = require('express');
const router = express.Router();
const controller = require('../controllers/relatoriosController');

router.get('/desperdicio', controller.desperdicio);
router.get('/historico', controller.historico);

module.exports = router;
