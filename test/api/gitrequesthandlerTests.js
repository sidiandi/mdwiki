'use strict';
var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs'),
    Q = require('q'),
    git = require('../../lib/git'),
    errors = require('../../lib/errors');

var gitRequestHandler = require('../../api/gitrequesthandler');

describe('gitrequesthandler tests', function () {

  var app;
  var sandbox;

  beforeEach(function () {
    app = express();
    app.use(express.bodyParser());

    app.post('/api/git/clone', gitRequestHandler.clone);
    app.post('/api/git/pull', gitRequestHandler.pull);

    sandbox = sinon.sandbox.create();
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



