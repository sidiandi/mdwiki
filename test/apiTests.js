var request = require('supertest');

describe('API tests', function () {
  'use strict';

  var server;

  beforeEach(function () {
    server = request('http://localhost:3000');
  });

  describe('When no parameter is given', function () {
    it('should return the index page', function (done) {
      server.get('/api')
            .expect('Content-Type', "text/html")
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err);
              done();
            });
    });
  });
  describe('When parameter index is given', function () {
    it('should return the index page', function (done) {
      server.get('/api/index')
            .expect('Content-Type', "text/html")
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err);
              done();
            });
    });
  });

  describe('When an non existing page is given', function () {
    it('should return an 404 http code', function (done) {
      server.get('/api/nonexistingPage')
            .expect('Content-Type', "text/plain")
            .expect(404)
            .end(function (err, res) {
              if (err) return done(err);
              done();
            });
    });
  });


});



