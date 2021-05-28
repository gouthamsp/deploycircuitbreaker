var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET basic health check */
router.get('/health', (req, res) => {
  return res.status(200).json({ _id: 'service1', serviceName: 'Service 1', alive: true, message: 'Service 1 is live' });
});

module.exports = router;
