'use strict';

var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs'),
    Q = require('q'),
    storage = require('../../lib/pageStorageFS'),
    errors = require('../../lib/errors'),
    pagesRequestHandler = require('../../api/pagesrequesthandler');

describe('pagesrequesthandler tests', function () {

  var app;
  var sandbox;

  beforeEach(function () {
    app = express();
    app.use(express.bodyParser());

    app.get('/api/pages', pagesRequestHandler);

    sandbox = sinon.sandbox.create();
  });

  describe('When user wants to list all existing pages', function () {
    beforeEach(function () {
      sandbox.stub(storage, 'getPages', function () {
        var d = Q.defer();
        d.resolve([ {name: 'page1'}, {name: 'page2'}, {name: 'index'}, {name: 'home'}, {name: 'readme'}]);
        return d.promise;
      });
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should return a list of the pages', function (done) {
      request(app).get('/api/pages')
        .set('X-MDWiki-Provider', 'git')
        .expect('Content-Type', "application/json")
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          var pages = res.body;

          should.exists(pages);

          pages.length.should.equal(5);

          done();
        });
    });
  });

});



