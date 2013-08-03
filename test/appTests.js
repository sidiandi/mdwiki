'use strict';

var request = require('supertest'),
    express = require('express');

var routes = require("../routes");

describe('Route tests', function () {
  var app;

  beforeEach(function () {
    app = express();
    app.get('/', routes.index);
  });

  it('should answer with an 200 response', function (done) {
    request(app)
      .get('/')
      .expect('Content-Type', /text/)
      .expect(200, done);
  });

  it('should answer with an 404 message when the requestet md file not exists', function (done) {
    request(app)
      .get('/notexists')
      .expect(404, done);
  });

});
