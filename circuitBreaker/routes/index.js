var express = require('express');
var fetch = require('node-fetch');
var router = express.Router();
const CircuitBreaker = require('opossum');

const circuitBreakerOptions = {
  timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 30000 // After 30 seconds, try again.
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

const mainRequest = () => {
  let defaultResponse = [
    { _id: 'circuitBreaker', serviceName: 'Circuit Breaker', alive: true, message: 'Circuit Breaker is live' },
    { _id: 'service1', serviceName: 'Service 1', alive: false, message: 'Service 1 is not alive' },
  ];

  return new Promise(async (resolve, reject) => {
    try {
      await fetch('http://service1:3002/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(resp => resp.json())
        .then(resp => {
          const index = defaultResponse.findIndex(r => r._id === 'service1');
          defaultResponse[index] = resp;
        })
        .catch(err => {
          return reject(err.message)
        });
    } catch (err) {
      return reject(err.message);
    }
    return resolve(defaultResponse);
  });
};

const service1CircuitBreaker = new CircuitBreaker(mainRequest, circuitBreakerOptions);

service1CircuitBreaker.fallback(() => {
  return [
    { _id: 'circuitBreaker', serviceName: 'Circuit Breaker', alive: true, message: 'Circuit Breaker is live' },
    { _id: 'service1', serviceName: 'Service 1', alive: false, message: 'Service 1 is not alive' },
  ];
});

router.get('/health', async (req, res) => {
  const response = await service1CircuitBreaker.fire();
  if (response && response.length > 0) {
    return res.status(200).json(response);
  }
  return res.status(200).json([
    { _id: 'circuitBreaker', serviceName: 'Circuit Breaker', alive: true, message: 'Circuit Breaker is live' },
    { _id: 'service1', serviceName: 'Service 1', alive: false, message: 'Service 1 is not alive' },
  ]);
});

module.exports = router;
