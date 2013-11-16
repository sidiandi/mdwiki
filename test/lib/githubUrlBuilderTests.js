'use strict';

var urlBuilder = require('../../lib/githubUrlBuilder');

describe('github UrlBuilder Tests', function () {
  var GITHUB_USER = 'janbaer', GITHUB_REPOSITORY = 'wiki-content';

  describe('When a url for a static file is given', function () {
    it('Should return the raw url for the github request', function () {
      var expectedUrl = 'https://rawgithub.com/janbaer/wiki-content/master/static/pdf/PowerShell_ISE_v3.pdf';
      var givenUrl = '/static/janbaer/wiki-content/pdf/PowerShell_ISE_v3.pdf';

      var actual = urlBuilder.buildStaticFileUrl(GITHUB_USER, GITHUB_REPOSITORY, givenUrl);

      actual.should.be.equal(expectedUrl);
    });
  });

  describe('When a url for the content of the repository is required', function () {
    it('Should return the expected url', function () {
      var expectedUrl = 'https://api.github.com/repos/janbaer/wiki-content/contents';
      var actual = urlBuilder.buildPagesUrl(GITHUB_USER, GITHUB_REPOSITORY);

      actual.should.be.equal(expectedUrl);
    });
  });

  describe('When the url for the content of a page is required', function () {
    it('Should return the expected url', function () {
      var expectedUrl = 'https://raw.github.com/janbaer/wiki-content/master/index.md';
      var actual = urlBuilder.buildPageContentUrl(GITHUB_USER, GITHUB_REPOSITORY, 'index');

      actual.should.be.equal(expectedUrl);
    });
  });

  describe('When the url to search in the repository is required', function () {
    it('Should return the expected url', function () {
      var expectedUrl = 'https://api.github.com/search/code?q=git+in:file+extension:md+repo:janbaer/wiki-content';
      var actual = urlBuilder.buildSearchUrl(GITHUB_USER, GITHUB_REPOSITORY, 'git');

      actual.should.be.equal(expectedUrl);
    });
  });
});
