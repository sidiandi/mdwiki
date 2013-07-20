var request = require('supertest');

describe('GET/', function () {
  'use strict';

  var server;

  beforeEach(function () {
    server = request('http://localhost:3000');
  });

  it('should return 200 OK', function (done) {
    server.get('/')
          .expect('Content-Type', /text/)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            done();
          });
  });
});



