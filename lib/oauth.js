'use strict';

var everyauth = require('everyauth');

var setup = function (oauthProviders, oauthConfig, debug) {
  everyauth.debug = debug || false;

  oauthProviders.forEach(function (oauthProvider) {
    switch (oauthProvider) {
    case 'github':
      everyauth.github
        .appId(oauthConfig.github.appId)
        .appSecret(oauthConfig.github.appSecret)
        .entryPath('/auth/github')
        .callbackPath('/auth/github/callback')
        .scope('public_repo')
        .findOrCreateUser(function (session, accessToken, accessTokenExtra, ghUser) {
            session.oauth = accessToken;
            session.uid = ghUser.login;
            return session.uid;
          })
        .redirectPath('/');
      break;
    }
  });
};

var hasSession = function (req) {
  return req.session;
};

var getUser = function (req, res) {
  var response = {};

  if (hasSession(req) && req.session.uid !== undefined) {
    response = { user: req.session.uid };
  }

  res.set('Content-Type', 'application/json');
  res.send(200, JSON.stringify(response));
  res.end();
};

var logout = function (req, res) {
  req.session = null;
  res.send(200, 'ok');
  res.end();
};

var ensureAuthentication = function (req, res, next) {
  if (req.session && req.session.uid) {
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


