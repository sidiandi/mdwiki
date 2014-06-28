'use strict';

var passport = require('passport'),
    GitHubStrategy = require('passport-github').Strategy;

var setup = function (app, oauthProviders, oauthConfig, debug) {
  oauthProviders.forEach(function (oauthProvider) {
    switch (oauthProvider) {
    case 'github':
      passport.use(new GitHubStrategy({
          clientID: oauthConfig.github.appId,
          clientSecret: oauthConfig.github.appSecret,
          callbackURL: '/auth/github/callback',
          scope: ['public_repo']
        },
        function(accessToken, refreshToken, profile, done) {
          var user = { id: profile.id, name: profile.username, accessToken: accessToken };
          return done(null, user);
        }
      ));

      app.use(passport.initialize());
      app.use(passport.session());

      app.get('/auth/github', passport.authenticate('github'), function(req, res) {
          // The request will be redirected to GitHub for authentication, so this
          // function will not be called.
        });

      app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }),
        function(req, res) {
          res.redirect('/');
        });

      break;
    }

    passport.serializeUser(function(user, done) {
      done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
      done(null, obj);
    });
  });

};

var hasSession = function (req) {
  return req.user !== undefined && req.user !== null;
};

var getOAuthToken = function (req) {
  return req.user ? req.user.accessToken : null;
};

var getUser = function (req, res) {
  var response = {};

  if (hasSession(req)) {
    response = { user: req.user.name };
  }

  res.set('Content-Type', 'application/json');
  res.send(200, JSON.stringify(response));
  res.end();
};

var logout = function (req, res) {
  req.logout();
  res.send(200, 'ok');
  res.end();
};

var ensureAuthentication = function (req, res, next) {
  if (hasSession(req)) {
    return next();
  }

  res.setHeader('Content-Type', 'text/plain');
  res.send(401, 'Not authenticated');
  res.end();
};

module.exports.user = getUser;
module.exports.setup = setup;
module.exports.logout = logout;
module.exports.hasSession = hasSession;
module.exports.ensureAuthentication = ensureAuthentication;
module.exports.getOAuthToken = getOAuthToken;


