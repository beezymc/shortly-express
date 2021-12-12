const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  Promise.resolve(req.cookies.shortlyid)
    .then(hash => {
      if (!hash) {
        throw Error ('No hash');
      }
      return models.Sessions.get({ hash });
    })
    .tap(session => {
      if (!session) {
        throw Error('No session found');
      }
    })
    .catch(err => {
      return models.Sessions.create()
        .then((query) => {
          let sessionId = query.insertId;
          return models.Sessions.get( {id: sessionId} );
        })
        .tap((session) => {
          res.cookie('shortlyid', session.hash);
        });
    })
    .then(session => {
      req.session = session;
      next();
    });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.validateSession = (req, res, next) => {


};

