const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));



app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create', (req, res) => {
  res.render('index');
});

app.get('/links', (req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  //check if username is in our db, if so, send failure status.
  return models.Users.get( {username} )
    .then((user) => {
      if (user && user.username.toLowerCase() === username.toLowerCase()) {
        res.status(400).send();
      } else {
        //check password quality. If password isn't good, send failure status.
        let regex = /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/;
        let found = password.match(regex);
        if (!password.match(regex)) {
          res.status(400).send();
        } else {
          //if username and password are good, use the create user method in our model
          // to create a new user and send back a 201 status code + redirect the user to the home page.
          //TODO also create a cookie for the user and send it in the response.
          return models.Users.create({ username, password })
            .then(() => {
              res.status(201).redirect('/');
            })
            .error(error => {
              res.status(500).send(error);
            });
        }
      }
    });
});

app.post('/login', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  //TODO first step: check if user has a cookie: if so, validate cookie. if user has valid cookie, redirect.
  // If invalid or no cookie, execute steps below.
  //if the username isn't in the DB, return an error.
  return models.Users.get( {username} )
    .then((user) => {
      //check if the username is in the DB; if not, return status 400.
      if (!user) {
        res.status(400).send();
      } else {
        // check if the password matches. If no match, return an error.
        if (!utils.compareHash(password, user.password, user.salt)) {
          res.status(400).send();
        } else {
          //if username and password are good, send back a 201 status code + redirect the user to the home page,
          //TODO also create a cookie for the user and send it in the response.
          res.status(201).redirect('/');
        }
      }
    })
    .error(error => {
      res.status(500).send(error);
    });
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
