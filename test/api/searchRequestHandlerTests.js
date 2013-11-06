'use strict';
var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs'),
    Q = require('q'),
    textSearcher = require('../../lib/textSearcher'),
    errors = require('../../lib/errors');

var searchRequestHandler = require('../../api/searchrequesthandler.js');

describe('searchrequesthandler tests', function () {

  var app;
  var sandbox;

  beforeEach(function () {
    app = express();
    app.use(express.bodyParser());

    app.post('/api/search', searchRequestHandler.search);

    sandbox = sinon.sandbox.create();
  });

  describe('When user searches for a text', function () {
    beforeEach(function () {
    });

    it('should return the search result and return 200', function (done) {
      var stub = sandbox.stub(textSearcher, 'search').returns(Q.resolve('Result'));

      request(app)
        .post('/api/search')
        .send({ textToSearch: 'searchingThisText'})
        .end(function (err, res) {
          stub.calledOnce.should.be.true;
          res.body.should.equal('Result');
          res.status.should.equal(200);
          res.type.should.equal('application/json');
          done();
        });
    });

    afterEach(function () {
      sandbox.restore();
    });
  });

});
