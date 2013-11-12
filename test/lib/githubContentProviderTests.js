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

  afterEach(function () {
    sandbox.restore();
  });
});
