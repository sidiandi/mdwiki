var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs'),
    Q = require('q'),
    storage = require('../../lib/pageStorageFS'),
    git = require('../../lib/git'),
    errors = require('../../lib/errors');

var pageRoute = require('../../api/index'),
    pagesRoute = require('../../api/pages'),
    cloneRoute = require('../../api/gitroutes').clone,
    pullRoute = require('../../api/gitroutes').pull;

describe('API tests', function () {
  'use strict';

  var app;
  var sandbox;

  beforeEach(function () {
    app = express();
    app.use(express.bodyParser());

    app.get('/api/pages', pagesRoute);
    app.get('/api/:page?', pageRoute);
    app.post('/api/git/clone', cloneRoute);
    app.post('/api/git/pull', pullRoute);

    sandbox = sinon.sandbox.create();
  });

  describe('When no parameter is given', function () {
    beforeEach(function () {
      sandbox.stub(fs, 'exists', function (path, callback) {
        callback(true);
      });
      sandbox.stub(fs, 'readFile', function (path, callback) {
        callback(null, '#Test');
      });
    });

    afterEach(function () {
      sandbox.restore();
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
    beforeEach(function () {
      sandbox.stub(fs, 'exists', function (path, callback) {
        callback(true);
      });
      sandbox.stub(fs, 'readFile', function (path, callback) {
        callback(null, '#Test');
      });
    });

    afterEach(function () {
      sandbox.restore();
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

    afterEach(function () {
      sandbox.restore();
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

  describe('When user wants to clone a repository', function () {
    beforeEach(function () {
    });

    it('should clone the repository from the give url in the content folder and return 200', function (done) {
      var stub = sandbox.stub(git, 'clone').returns(Q.resolve());

      request(app)
        .post('/api/git/clone')
        .send({ repositoryUrl: 'https://github.com/janbaer/mdwiki.wiki.git'})
        .expect(200, 'ok')
        .end(function (err, res) {
          stub.calledOnce.should.be.true;
          done();
        });
    });

    afterEach(function () {
      sandbox.restore();
    });
  });

  describe('When user wants to clone a repository and an error has occured', function () {
    beforeEach(function () {
      sandbox.stub(git, 'clone').returns(Q.reject(new Error('a fatal error')));
    });

    it('should return an server error code', function (done) {
      request(app)
        .post('/api/git/clone')
        .send({ repositoryUrl: 'https://github.com/janbaer/mdwiki.wiki.git'})
        .expect(500, done);
    });

    afterEach(function () {
      sandbox.restore();
    });
  });

  describe('When user wants to pull the latest changes', function () {
    beforeEach(function () {
    });

    it('calls the pull function and return 200', function (done) {
      var stub = sandbox.stub(git, 'pull').returns(Q.resolve());
      request(app)
        .post('/api/git/pull')
        .send()
        .expect(200, 'ok')
        .end(function (err, res) {
          stub.calledOnce.should.be.true;
          done();
        });
    });

    afterEach(function () {
      sandbox.restore();
    });
  });
});



