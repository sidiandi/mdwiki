'use strict';

var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs'),
    Q = require('q'),
    storage = require('../../lib/pageStorageFS'),
    errors = require('../../lib/errors'),
    paramHandler = require('../../lib/requestParamHandler.js'),
    pageRequestHandler = require('../../api/pagerequesthandler');

describe('pagerequesthandler tests', function () {

  var app;
  var sandbox;

  beforeEach(function () {
    app = express();
    app.use(express.json());

    app.get('/api/page/:page?', pageRequestHandler.get);
    app.put('/api/page/:page', pageRequestHandler.put);
    app.put('/api/:githubUser/:githubRepository/page/:page', pageRequestHandler.put);

    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('Page get', function () {
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

  describe('Page put', function () {
    describe('When is not authenticated', function () {
      it('Should return an 401 error', function (done) {
        request(app).put('/api/page/index')
          .expect('Content-Type', "text/plain")
          .expect(401)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    describe('When the user forget to send the markdown in the body', function () {
      it('Should return an 400 error', function (done) {
        app.request.session = { oauth: '123456789' };

        request(app).put('/api/page/index')
          .set('Content-Type', 'application/json')
          .send({ commitMessage: 'this is the update'})
          .expect('Content-Type', "text/plain")
          .expect(400)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    describe('When the user wants to update a page', function () {
      var providerStub,
          expectedResponse = '<h1>This is the content of the page</h1>';

      beforeEach(function () {
        var provider = { updatePage: function (oauth, commitMessage, pageName, markdown) {}};
        providerStub = sinon.stub(provider, 'updatePage').returns(Q.resolve({ statusCode: 200, body: expectedResponse }));

        sinon.stub(paramHandler, 'createProviderFromRequest').returns(provider);
      });

      it('Should send the content to the provider and return 200', function (done) {
        var commitMessage = 'this is the update',
            markdown = '#This is the content of the page',
            oauth = '123456789';

        app.request.session = { oauth: oauth };

        request(app).put('/api/janbaer/wiki-content/page/index')
          .set('Content-Type', 'application/json')
          .send({ commitMessage: commitMessage, markdown: markdown})
          .expect('Content-Type', 'text/html; charset=utf-8')
          .expect(200, expectedResponse)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }
            done();
          });

        providerStub.calledWithMatch(oauth, commitMessage, 'index', markdown).should.be.trues;
      });

      afterEach(function () {
        paramHandler.createProviderFromRequest.restore();
      });
    });
  });

});



