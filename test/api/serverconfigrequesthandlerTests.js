'use strict';

var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    serverconfigRequesthandler = require('../../api/serverconfigrequesthandler');

describe('ServerConfigRequesthandler Tests', function () {
  var app;

  beforeEach(function () {
    app = express();
    app.use(require('body-parser')());

    app.get('/api/serverconfig', serverconfigRequesthandler);
  });

  it('should return the server config with providers', function (done) {
    request(app).get('/api/serverconfig')
      .expect('Content-Type', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        var serverConfig = res.body;

        should.exists(serverConfig);
        should.exists(serverConfig.providers);
        serverConfig.providers.length.should.not.equal(0);

        done();
      });
  });
});
