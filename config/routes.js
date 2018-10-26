const axios = require('axios');
const bcrypt = require('bcryptjs');
const db = require('../database/dbConfig');
const jwt = require('jsonwebtoken');

const { authenticate } = require('./middlewares');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  // implement user registration
  const creds = req.body;
  const hash = bcrypt.hashSync(creds.password, 14);

    db('users')
    .insert(creds)
        .then(ids => {
            if(ids) {
                const id = ids[0];
                db('users')
                    .where({ id })
                    .first()
                        .then(user => {
                            const token = generateToken(user);
                            res.status(200).json({ registrationMessage: user.username, token })
                        });
            } else {
                res.status(400).json(err);
            };
        })
        .catch(err => {
            res.status(500).json(err);
        });
}

function login(req, res) {
  // implement user login
  const creds = req.body;
    db('users')
      .where({ username: creds.username })
      .first()
        .then(user => {
            if (user && bcrypt.compareSync(creds.password, user.password)) {
          const token = generateToken(user);
          res.status(200).json({ welcome: user.username, token});
            } else {
          res.status(401).json({ message: 'you shall not pass!' });
            }
        })
        .catch(err => {
            res.status(500).json({ err });
        });
}

function getJokes(req, res) {
  axios
    .get(
      'https://08ad1pao69.execute-api.us-east-1.amazonaws.com/dev/random_ten'
    )
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}

const jwtSecret = 'nobody$tosses)a!dwarf!';
function generateToken(user) {
    const jwtPayload = {
	...user,
	userType: 'admin'
    };
    const jwtOptions = {
	expiresIn: '5m'
    };    
    return jwt.sign(jwtPayload, jwtSecret, jwtOptions);
}