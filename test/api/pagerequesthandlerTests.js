'use strict';

var request = require('supertest'),
    express = require('express'),
    sinon = require('sinon'),
    Q = require('q'),
    errors = require('../../lib/errors'),
    GithubProvider = require('../../lib/githubContentProvider.js'),
    paramHandler = require('../../lib/requestParamHandler.js'),
    pageRequestHandler = require('../../api/pagerequesthandler');

describe('pagerequesthandler tests', function () {
  var app;
  var sandbox;
  var provider;

  beforeEach(function () {
    app = express();
    app.use(require('body-parser')());

    app.get('/api/:githubUser/:githubRepository/page/:page?', pageRequestHandler.get);
    app.put('/api/:githubUser/:githubRepository/page/:page', pageRequestHandler.put);
    app.delete('/api/:githubUser/:githubRepository/page/:page', pageRequestHandler.delete);

    sandbox = sinon.sandbox.create();

    provider = new GithubProvider('janbaer', 'wiki');
    sandbox.stub(paramHandler, 'createProviderFromRequest').returns(provider);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('Page get', function () {
    describe('When no parameter is given', function () {
      beforeEach(function () {
        sandbox.stub(provider, 'getPageContentAsHtml').returns(new Q('<h1>Test</h1>'));
      });

      it('should return the index page', function (done) {
        request(app).get('/api/janbaer/wiki/page')
              .expect('Content-Type', 'text/html; charset=utf-8')
              .expect(200, '<h1>Test</h1>')
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                done();
              });
      });
    });

    describe('When parameter index is given', function () {
      beforeEach(function () {
        sandbox.stub(provider, 'getPageContentAsHtml').returns(new Q('<h1>Test</h1>'));
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('should return the index page', function (done) {
        request(app).get('/api/janbaer/wiki/page/index')
          .expect('Content-Type', 'text/html; charset=utf-8')
          .expect(200, '<h1>Test</h1>')
          .end(function (err) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    describe('When the user wants to fetch just the markdown', function () {
      beforeEach(function () {
        sandbox.stub(provider, 'getPageContent').returns(new Q('#Test'));
      });

      it('Should return the markdown', function (done) {
        request(app).get('/api/janbaer/wiki/page/index?format=markdown')
              .expect('Content-Type', 'text/plain; charset=utf-8')
              .expect(200, '#Test')
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                done();
              });
      });
      afterEach(function () {
        provider.getPageContent.restore();
      });
    });

    describe('When a non existing page is given', function () {
      beforeEach(function () {
        sandbox.stub(provider, 'getPageContentAsHtml').returns(Q.reject(new errors.FileNotFoundError('page not found', 'nonexistingPage')));
      });

      it('should return an 404 http code', function (done) {
        request(app).get('/api/janbaer/wiki/page/nonexistingPage')
          .expect('Content-Type', /^text\/plain/)
          .expect(404)
          .end(function (err) {
            if (err) {
              return done(err);
            }
            done();
          });
      });

      afterEach(function () {
        provider.getPageContentAsHtml.restore();
      });
    });
  });

  describe('Page put', function () {
    describe('When the user forget to send the markdown in the body', function () {
      it('Should return an 400 error', function (done) {
        app.request.session = { oauth: '123456789' };

        request(app).put('/api/janbaer/wiki/page/index')
          .set('Content-Type', 'application/json')
          .send({ commitMessage: 'this is the update'})
          .expect('Content-Type', /^text\/plain/)
          .expect(400)
          .end(function (err) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    describe('When the user wants to update or create a page', function () {
      var providerStub,
          expectedResponse = '<h1>This is the content of the page</h1>';

      beforeEach(function () {
        sandbox.stub(provider, 'getPage').returns(new Q({ name: 'git', sha: '123456'}));
        providerStub = sandbox.stub(provider, 'savePage').returns(new Q({ statusCode: 200, body: expectedResponse }));
      });

      it('Should send the content to the provider and return 200', function (done) {
        var commitMessage = 'this is the update',
            content = '#This is the content of the page',
            oauth = '123456789';

        app.request.session = { oauth: oauth };

        request(app).put('/api/janbaer/wiki/page/git')
          .set('Content-Type', 'application/json')
          .send({ commitMessage: commitMessage, markdown: content})
          .expect('Content-Type', 'text/html; charset=utf-8')
          .expect(200, expectedResponse)
          .end(function (err) {
            if (err) {
              return done(err);
            }
            done();
          });

        providerStub.calledWithMatch(commitMessage, 'git', content).should.be.trues;
      });

      afterEach(function () {
        paramHandler.createProviderFromRequest.restore();
      });
    });

    describe('When the user wants to delete a page', function () {
      var providerStub;

      beforeEach(function () {
        sandbox.stub(provider, 'getPage').returns(new Q({ name: 'git', sha: '123456'}));
        providerStub = sandbox.stub(provider, 'deletePage').returns(new Q({ statusCode: 200 }));
      });

      it('Should send the content to the provider and return 200', function (done) {
        var commitMessage = 'Delete the page',
            oauth = '123456789';

        app.request.session = { oauth: oauth };

        request(app).del('/api/janbaer/wiki/page/git')
          .set('Content-Type', 'application/json')
          .send({ commitMessage: commitMessage })
          .expect(200)
          .end(function (err) {
            if (err) {
              return done(err);
            }
            done();
          });

        providerStub.calledWithMatch('git').should.be.trues;
      });

      afterEach(function () {
        paramHandler.createProviderFromRequest.restore();
      });
    });
  });
});



