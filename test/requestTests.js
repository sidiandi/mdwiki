var should  = require('should'),
    request = require('supertest');

describe('GET/', function () {
  'use strict';

  var server;

  beforeEach(function () {
    server = request('http://localhost:3000');
  });

  it('should return 200 OK', function (done) {
    server.get('/').expect(200)
                    .expect('Content-Type', 'text/plain')
                    .end(function (error, res) {
    });
  });
});