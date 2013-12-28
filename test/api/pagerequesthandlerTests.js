'use strict';

var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs'),
    Q = require('q'),
    contentProvider = require('../../lib/gitContentProvider'),
    storage = require('../../lib/pageStorageFS'),
    errors = require('../../lib/errors'),
    pageRequestHandler = require('../../api/pagerequesthandler');

describe('pagerequesthandler tests', function () {

  var app;
  var sandbox;

  beforeEach(function () {
    app = express();
    app.use(express.json());

    app.get('/api/page/:page?', pageRequestHandler);

    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('When no parameter is given', function () {
    beforeEach(function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'readFile', function (path, callback) {
        callback(null, '#Test');
      });
    });

    it('should return the index page', function (done) {
      request(app).get('/api/page')
            .expect('Content-Type', "text/html; charset=utf-8")
            .expect(200, '<h1>Test</h1>')
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              done();
            });
    });
  });

  describe('When parameter index is given', function () {
    beforeEach(function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'readFile', function (path, callback) {
        callback(null, '#Test');
      });
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should return the index page', function (done) {
      request(app).get('/api/page/index')
            .expect('Content-Type', "text/html; charset=utf-8")
            .expect(200, '<h1>Test</h1>')
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              done();
            });
    });
  });

  describe('When the user wants to fetch just the markdown', function () {
    beforeEach(function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'readFile', function (path, callback) {
        callback(null, '#Test');
      });
    });

    it('Should return the markdown', function (done) {
      request(app).get('/api/page/index?format=markdown')
            .expect('Content-Type', "text/plain; charset=utf-8")
            .expect(200, '#Test')
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
      request(app).get('/api/page/nonexistingPage')
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

});



