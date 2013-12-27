'use strict';

var request = require('request'),
    should = require('should'),
    sinon = require('sinon'),
    errors = require('../../lib/errors'),
    GitHubContentProvider = require('../../lib/githubContentProvider.js');

describe('githubContentProvider Tests', function () {
  var GITHUB_USER = 'janbaer';
  var GITHUB_REPO = 'wiki-content';

  var provider = new GitHubContentProvider(GITHUB_USER, GITHUB_REPO);

  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  describe('getPageContent tests', function () {
    describe('When the page exists', function () {
      var pageContent = 'content of index.md';
      beforeEach(function () {
        sandbox.stub(request, 'get').yields(null, { statusCode: 200 }, pageContent);
      });

      it('should return the content of the page', function (done) {
        provider.getPageContent('index')
          .then(function (content) {
            should.exists(content);
            content.should.be.equal(pageContent);
          })
          .done(done);
      });
    });

    describe('When the page not exists', function () {
      beforeEach(function () {
        sandbox.stub(request, 'get').yields(null, { statusCode: 404 }, null);
      });

      it('should reject a filenotfounderror', function (done) {
        var lastError;

        provider.getPageContent('index')
            .catch(function (error) {
              lastError = error;
            })
            .done(function () {
              should.exists(lastError);
              lastError.should.be.an.instanceof(errors.FileNotFoundError);
              done();
            });
      });
    });

    describe('When the github returns a error', function () {
      beforeEach(function () {
        sandbox.stub(request, 'get').yields(new Error('server error'), null, null);
      });

      it('should reject this error', function (done) {
        var lastError;

        provider.getPageContent('index')
            .catch(function (error) {
              lastError = error;
            })
            .done(function () {
              should.exists(lastError);
              lastError.message.should.be.equal('server error');
              done();
            });
      });
    });
  });

  describe('getPageContentAsHtml tests', function () {
    describe('When the page exists', function () {
      beforeEach(function () {
        sandbox.stub(request, 'get').yields(null, { statusCode: 200 }, '# Test');
      });

      it('should return the content of the page as html', function (done) {
        provider.getPageContentAsHtml('index')
          .then(function (content) {
            should.exists(content);
            content.should.be.equal('<h1>Test</h1>');
          })
          .done(done);
      });
    });
  });

  describe('getPages tests', function () {
    describe('When some pages exists', function () {
      beforeEach(function () {
        sandbox.stub(request, 'get').yields(null, { statusCode: 200 }, '[ { "name": "page1.md" } ]');
      });

      it('should return this pages', function (done) {
        provider.getPages()
          .then(function (pages) {
            should.exists(pages);
            pages.should.have.lengthOf(1);
          })
          .done(done);
      });
    });

    describe('When not only pages exists', function () {
      beforeEach(function () {
        sandbox.stub(request, 'get').yields(null, { statusCode: 200 }, '[ { "name": "page2.md" }, { "name": "otherfile.pdf" } ]');
      });

      it('should return only the pages', function (done) {
        provider.getPages()
          .then(function (pages) {
            should.exists(pages);
            pages.should.have.lengthOf(1);
          })
          .done(done);
      });
    });

    describe('When the user or repository not exists', function () {
      beforeEach(function () {
        sandbox.stub(request, 'get').yields(null, { statusCode: 404 }, null);
      });

      it('should reject an RepositoryNotExistsError', function (done) {
        var lastError;

        provider.getPages()
          .catch(function (error) {
            lastError = error;
          })
          .done(function () {
            should.exists(lastError);
            //lastError.should.be.an.instanceof(errors.RepositoryNotExistsError);
            done();
          });
      });
    });

  });

  describe('search tests', function () {
    describe('When git returns items', function () {
      beforeEach(function () {
        sandbox.stub(request, 'get').yields(null, { statusCode: 200 }, '{ "total_count": 1, "items": [ { "name": "page1.md" } ] }');
      });

      it('should parse and return a searchresult', function (done) {
        provider.search('git')
          .then(function (items) {
            should.exists(items);
            items.should.have.lengthOf(1);
          })
          .done(done);
      });
    });
  });

  describe('Update page tests', function () {
    describe('When user is not authenticated', function () {
      var session;

      beforeEach(function () {
        session = sinon.stub({ });
      });

      it('Should return a 401 error', function (done) {
        var lastError;
        var page = { name: 'git', content: 'content of git page' };

        provider.updatePage(session, 'this is a update for git page', page)
          .catch(function (error) {
            lastError = error;
          })
          .done(function () {
            should.exists(lastError);
            lastError.status.should.be.equal(401);
            lastError.message.should.be.equal('not authenticated');
            done();
          });
      });
    });

    describe('When user is authenticated', function () {
      var session;
      var requestStub;

      beforeEach(function () {
        session = sinon.stub({ uid: 'janbaer', oauth: '12345678' });
        requestStub = sandbox.stub(request, 'put').yields(null, { statusCode: 200 }, '{}');
      });

      it('Should send the expected message to github', function (done) {
        var lastError;
        var page = { name: 'git', content: 'content of git page' };
        var expectedUrl = 'https://api.github.com/repos/janbaer/wiki-content/contents/git.md?access_token=12345678';
        var expectedMessage = {
          message: 'this is a update for git page',
          content: 'content of git page',
          sha: '68e5127c246b8430ae7c8d8e96c3e385671f588d'
        };

        provider.updatePage(session, 'this is a update for git page', page)
          .done(function () {
            requestStub.calledWithMatch({ url: expectedUrl, body: expectedMessage}).should.be.true;
            done();
          });
      });
    });
  });

  afterEach(function () {
    sandbox.restore();
  });
});


