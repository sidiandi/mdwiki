'use strict';

var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon');

var oauth = require('../../lib/oauth.js');

describe('oauth Tests', function () {
  var app;
  var sandbox;

  beforeEach(function () {
    app = express();
    app.use(express.json());

    app.get('/auth/user', oauth.user);
    app.post('/auth/logout', oauth.logout);

    sandbox = sinon.sandbox.create();
  });

  describe('Get user', function () {
    describe('When user is authenticated', function () {
      it('Should return the name of the user', function (done) {
        app.request.session = { uid: 'janbaer' };

        request(app)
          .get('/auth/user')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            res.body.should.have.property('user');
            res.body.user.should.be.equal('janbaer');
            done();
          });
      });
    });

    describe('When user is not authenticated', function () {
      it('Should return a empty response object ', function (done) {
        app.request.session = null;

        request(app)
          .get('/auth/user')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            res.body.should.not.have.property('user');
            done();
          });
      });
    });
  });

});
