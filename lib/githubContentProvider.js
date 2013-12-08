'use strict';

var httpRequest = require('request'),
    q = require('q'),
    path = require('path'),
    markdown = require("node-markdown").Markdown,
    logger = require('./logger'),
    errors = require('./errors'),
    urlBuilder = require('./githubUrlBuilder.js');

function getContentFromGithub(url) {
  //logger.info('getContentFromGithub: ' + url);
  var deferred = q.defer();

  httpRequest.get({url: url, headers: { 'user-agent': 'mdwiki' }}, function (error, response, body) {
    if (error) {
      logger.error("Error while request data from github: " + error.message);
      deferred.reject(error);
    }
    else if (response.statusCode !== 200) {
      logger.error("Error while request data from github: " + response.body);
      deferred.reject(new Error(response.statusCode));
    }
    else {
      deferred.resolve(body);
    }
  });

  return deferred.promise;
}

function getObjectsFromGithub(url) {
  return getContentFromGithub(url).then(JSON.parse);
}

function readItems(items) {
  var pages = [];

  items.forEach(function (item) {
    if (path.extname(item.name) !== '.md') {
      return;
    }
    var fileNameWithoutExt = path.basename(item.name, '.md');

    var page = {
      title: fileNameWithoutExt,
      name: fileNameWithoutExt,
      fileName: item.name,
    };
    pages.push(page);
  });

  return pages;
}

function GitHubContentProvider(userName, repositoryName) {
  this.userName = userName;
  this.repositoryName = repositoryName;
}

GitHubContentProvider.prototype.getPageContent = function (pageName) {
  var deferred = q.defer(),
      url = urlBuilder.buildPageContentUrl(this.userName, this.repositoryName, pageName);

  getContentFromGithub(url)
    .then(deferred.resolve)
    .catch(function (error) {
      if (error.message === '404') {
        deferred.reject(new errors.FileNotFoundError('page not found', pageName));
      } else {
        deferred.reject(error);
      }
    });

  return deferred.promise;
};

GitHubContentProvider.prototype.getPageContentAsHtml = function (pageName) {
  var deferred = q.defer();

  this.getPageContent(pageName)
    .then(markdown)
    .then(deferred.resolve)
    .catch(deferred.reject);

  return deferred.promise;
};

GitHubContentProvider.prototype.getPages = function () {
  var that = this;
  var deferred = q.defer(),
      url = urlBuilder.buildPagesUrl(that.userName, that.repositoryName);

  getObjectsFromGithub(url)
    .then(function (items) {
      deferred.resolve(readItems(items));
    })
    .catch(function (error) {
      if (error.message === '404') {
        deferred.reject(new errors.RepositoryNotExistsError('The user or repository could not be found', that.userName, that.repositoryName));
      }
      else {
        deferred.reject(error);
      }
    });

  return deferred.promise;
};

GitHubContentProvider.prototype.search = function (searchTerm) {
  var deferred = q.defer(),
      url = urlBuilder.buildSearchUrl(this.userName, this.repositoryName, searchTerm);

  getObjectsFromGithub(url)
    .then(function (searchResult) {
      deferred.resolve(readItems(searchResult.items));
    })
    .catch(deferred.reject);

  return deferred.promise;
};

GitHubContentProvider.prototype.fetchStaticFile = function (request, resp) {
  var url = urlBuilder.buildStaticFileUrl(this.userName, this.repositoryName, request.path);

  var githubRequest = httpRequest(url);
  request.pipe(githubRequest);
  githubRequest.pipe(resp);
};


GitHubContentProvider.prototype.getName = function () {
  return "github";
};

module.exports = GitHubContentProvider;
