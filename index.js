const cors = require('cors'); 

const express = require('express');
const morgan = require("morgan");
const bodyParser = require('body-parser');
// const uuid = require('uuid');

const { check, validationResult } = require('express-validator');

const app = express();
app.use(cors());
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Directors;

//conntecting database with connection URI
// mongoose.connect('mongodb://localhost:27017/myFlixDB', 
mongoose.connect( process.env.CONNECTION_URI, 
  { useNewUrlParser: true, useUnifiedTopology: true });
   
//activating body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//calling passport and authorization 
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

//calling express
app.use(express.json());

let myLogger = (req, res, next) => {
  console.log(req.url);
  next();
};

app.use(myLogger);
app.use(morgan('common'));

  // Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix!');
});

  //get list of all movies
  app.get('/movies', passport.authenticate('jwt', { session: false }),(req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  // GET requests for a specific movie by title
  app.get('/movies/:Title', (req, res) => {
    Movies.findOne({Title: req.params.Title})
    .then((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ', err);
    });
  });

  //Get a list of all genres
  app.get('/genre', (req, res) => {
      Genre.find()
        .then(genre => {
          res.status(201).json(genre);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
        });
    });

  //get a specific genre by name
  app.get('/genre/:Name', (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.Name})
    .then((genre) => {
      res.json(genre.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });

  //get list of all directors
  app.get('/directors', (req, res) => {
    Movies.find()
      .then((director) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  //get director info by name
  app.get('/director/:Name', (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name})
    .then((director) => {
      res.json(director.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });

  //get all users
  app.get('/users', function (req, res) {
    Users.find()
    .then(function (users) {
      res.status(201).json(users);
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send('Error:' + err);
    });
  });

//adding a new user
app.post('/users', [
  check('Username', 'Username is required').isLength({min: 5}),
  // check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors:errors.array() });
    }

    let hashedPassword = Users.hashedPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
  // search to see if a user with the requested username already exists
    .then((user) => {
      if (user) {
  // if the user is found, send a response that it already exists
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
              }
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        });

  // Update user info by username
  app.put('/users/:Username', (req, res) => {
    Users.findOneAndUpdate(
      {Username: req.params.Username}, 
      {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      },
    },
    { new: true },
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
  });

// Add a movie to a user's list of favorites
    app.post('/users/:Username/movies/:MovieID', (req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username}, 
    {
      $push: {FavoriteMovies: req.params.MovieID}
    },
    {new: true},
    (err, updatedUser) => {
      console.log (updatedUser)
      if(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
  });

  // Delete a user by their username
  app.delete('/users/:Username', (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username})
    .then((user) => {
      if(!user) {
        res.status(400).send(req.params.Username + ' was not found.');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });

  // Delete a movie from the favorite list of an user
app.delete('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({Username: req.params.Username}, {
    $pull: {FavoriteMovies: req.params.MovieID}
  },
  {new: true},
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

  // Error handler
  app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Something went wrong. Please try again.');
  });

  // listen for requests
  const port = process.env.PORT || 8080;
  app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port' + port);
  });