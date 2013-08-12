var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs'),
    Q = require('q'),
    storage = require('../lib/pageStorageFS'),
    errors = require('../lib/errors');

var pageRoute = require('../api/index'),
    pagesRoute = require('../api/pages');

describe('API tests', function () {
  'use strict';

  var app;
  var sandbox;

  beforeEach(function (done) {
    app = express();

    app.get('/api/pages', pagesRoute);
    app.get('/api/:page?', pageRoute);

    sandbox = sinon.sandbox.create();

    done();
  });

  describe('When no parameter is given', function () {
    beforeEach(function (done) {
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'readFile', function (path, callback) {
        callback(null, '#Test');
      });
      done();
    });

    afterEach(function (done) {
      sandbox.restore();
      done();
    });

    it('should return the index page', function (done) {
      request(app).get('/api')
            .expect('Content-Type', "text/html")
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              done();
            });
    });
  });
  describe('When parameter index is given', function () {
    beforeEach(function (done) {
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'readFile', function (path, callback) {
        callback(null, '#Test');
      });
      done();
    });

    afterEach(function (done) {
      sandbox.restore();
      done();
    });

    it('should return the index page', function (done) {
      request(app).get('/api/index')
            .expect('Content-Type', "text/html")
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              done();
            });
    });
  });

  describe('When an non existing page is given', function () {
    it('should return an 404 http code', function (done) {
      request(app).get('/api/nonexistingPage')
            .expect('Content-Type', "text/plain")
            .expect(404)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              done();
            });
    });
  });

  describe('When user wants to list all existing pages', function () {
    beforeEach(function (done) {
      sandbox.stub(storage, 'getPages', function () {
        var d = Q.defer();
        d.resolve([ {name: 'page1'}, {name: 'page2'}, {name: 'index'} ]);
        return d.promise;
      });

      done();
    });

    afterEach(function (done) {
      sandbox.restore();
      done();
    });

    it('should return a list of the pages with their titles except the index page', function (done) {
      request(app).get('/api/pages')
        .expect('Content-Type', "application/json")
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          var pages = res.body;

          should.exists(pages);

          pages.length.should.equal(2);

          done();
        });
    });
  });
});



