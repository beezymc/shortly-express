const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser);
//validate session;
app.use(Auth.createSession);

app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
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
// Login Routes
/************************************************************/

app.get('/login',
  (req, res) => {
    res.render('login');
  });

app.post('/login',
  (req, res) => {
    const { username, password } = req.body;
    console.log('POST received to /login');
    console.log('req.body: ', req.body);
    return models.Users.get( {username} )
      .then ((userInfo) => {
        if (!userInfo) {
          console.log('no userInfo db row returned');
          res.status(400);
          res.redirect('/login');
          res.send();
          return;
        }
        if (utils.compareHash(req.body.password, userInfo.password, userInfo.salt)) {
          // get the userId from the users table
          // inserting the userId into the sessions table
          return models.Users.get( { username })
            .then ((userInfo) => {
              res.status(201);
              res.redirect('/');
              res.send();
              return models.Sessions.update(req.sessions.hash, userInfo.id);
            });
        } else {
          console.log('hash didn\'t match');
          res.status(400);
          res.redirect('/login');
          res.send();
          return;
        }
      })
      .catch(() => {
        res.status(501);
        res.redirect('/');
        res.send();
        return;
      });
  });

/************************************************************/
// Signup Routes
/************************************************************/

app.get('/signup',
  (req, res) => {
    res.render('signup');
  });

app.post('/signup',
  (req, res) => {
    console.log('POST received to /signup');
    console.log('req.body: ', req.body);
    const { username, password } = req.body;
    return models.Users.get({ username })
      // check if username exists, if not create user
      .then ((userInfo) => {
        if (userInfo) {
          throw Error('username already exists');
        }
        return models.Users.create({ username, password });
      })
      .then(() => {
        console.log('in response block');
        res.status(201);
        res.redirect('/');
        res.send();
        return;
      })
      .catch((error) => {
        console.log(error);
        res.status(501);
        res.redirect('/signup');
        res.send();
        return;
      });
  }
);

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
