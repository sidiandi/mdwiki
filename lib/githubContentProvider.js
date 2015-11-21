'use strict';

const httpRequest = require('request');
const util = require('util');
const q = require('q');
const path = require('path');
const marked = require('marked');
const logger = require('./logger');
const errors = require('./errors');
const urlBuilder = require('./githubUrlBuilder.js');
const base64 = require('./base64.js');

class GithubContentProvider  {
  constructor(userName, repositoryName) {
    this.userName = userName;
    this.repositoryName = repositoryName;
  }

  static getContentFromGithub(url) {
    const deferred = q.defer();

    httpRequest.get({url: url, headers: { 'user-agent': 'mdwiki' }}, function (error, response, body) {
      if (error) {
        logger.error('Error while request data from github: ' + error.message);
        deferred.reject(error);
      }
      else if (response.statusCode !== 200) {
        logger.error('Error while request data from github: ' + response.body);
        deferred.reject(new Error(response.statusCode));
      }
      else {
        deferred.resolve(body);
      }
    });

    return deferred.promise;
  }

  static getParsedJsonFromGithub(url) {
    return GithubContentProvider.getContentFromGithub(url).then(JSON.parse);
  }

  static readItem(item) {
    if (path.extname(item.name) !== '.md') {
      return;
    }
    var fileNameWithoutExt = path.basename(item.name, '.md');

    var page = {
      title: fileNameWithoutExt,
      name: fileNameWithoutExt,
      fileName: item.name,
      sha: item.sha,
      content: item.content
    };
    return page;
  }

  static readItems(items) {
    var pages = [];

    items.forEach(function (item) {
      var page = GithubContentProvider.readItem(item);
      if (page !== undefined) {
        pages.push(page);
      }
    });

    return pages;
  }

  getPageContent (pageName) {
    var deferred = q.defer();

    this.getPage(pageName)
      .then(function (page) {
        deferred.resolve(base64.decode(page.content));
      })
      .catch(function (error) {
        if (error.message === '404') {
          logger.error('Error 404 while fetching the content for page %s', pageName);
          deferred.reject(new errors.FileNotFoundError('page not found', pageName));
        } else {
          logger.error('Error while fetching the content for page %s: %s', pageName, error);
          deferred.reject(error);
        }
      });

    return deferred.promise;
  }

  getPageContentAsHtml (pageName) {
    var deferred = q.defer();

    this.getPageContent(pageName)
      .then(marked)
      .then(deferred.resolve)
      .catch(deferred.reject);

    return deferred.promise;
  }

  getPages () {
    var that = this;
    var deferred = q.defer(),
        url = urlBuilder.buildPagesUrl(that.userName, that.repositoryName);

    if (this.oauth !== undefined) {
      url += urlBuilder.withAccessToken(this.oauth);
    }

    GithubContentProvider.getParsedJsonFromGithub(url)
      .then(function (items) {
        deferred.resolve(GithubContentProvider.readItems(items));
      })
      .catch(function (error) {
        if (error.message === '404') {
          deferred.reject(new errors.RepositoryNotExistsError('The user or repository could not be found', that.userName, that.repositoryName));
        }
        else {
          logger.error('Error while fetching the content for user %s in repository %s: %s', that.userName, that.repositoryName, error);
          deferred.reject(error);
        }
      });

    return deferred.promise;
  }

  getPage (pageName) {
    var that = this;
    var deferred = q.defer(),
        url = urlBuilder.buildPageUrl(that.userName, that.repositoryName, pageName);

    if (this.oauth !== undefined) {
      url += urlBuilder.withAccessToken(this.oauth);
    }

    GithubContentProvider.getParsedJsonFromGithub(url)
      .then(function (item) {
        deferred.resolve(GithubContentProvider.readItem(item));
      })
      .catch(function (error) {
        if (error.message === '404') {
          logger.error('Error 404 while fetching the page %s', pageName);
          deferred.reject(new errors.FileNotFoundError('page not found', pageName));
        } else {
          logger.error('Error while fetching the page %s: %s', pageName, error);
          deferred.reject(error);
        }
      });

    return deferred.promise;
  }

  search (searchTerm) {
    var deferred = q.defer(),
        url = urlBuilder.buildSearchUrl(this.userName, this.repositoryName, searchTerm);

    if (this.oauth !== undefined) {
      url += urlBuilder.withAccessToken(url, this.oauth);
    }

    GithubContentProvider.getParsedJsonFromGithub(url)
      .then(function (searchResult) {
        deferred.resolve(GithubContentProvider.readItems(searchResult.items));
      })
      .catch(deferred.reject);

    return deferred.promise;
  }

  fetchStaticFile (request, resp) {
    var url = urlBuilder.buildStaticFileUrl(this.userName, this.repositoryName, request.path);

    if (this.oauth !== undefined) {
      url += urlBuilder.withAccessToken(url, this.oauth);
    }

    var githubRequest = httpRequest(url);
    request.pipe(githubRequest);
    githubRequest.pipe(resp);
  }

  savePage (commitMessage, pageName, pageContent) {
    var deferred = q.defer();

    this.getPage(pageName)
      .then(function (page) {
        this.createOrUpdatePage(commitMessage, pageName, pageContent, page.sha).then(deferred.resolve).catch(deferred.reject);
      }.bind(this))
      .catch(function (error) {
        if (error instanceof errors.FileNotFoundError) {
          this.createOrUpdatePage(commitMessage, pageName, pageContent).then(deferred.resolve).catch(deferred.reject);
        } else {
          deferred.reject(error);
        }
      }.bind(this));

    return deferred.promise;
  }

  createOrUpdatePage (commitMessage, pageName, pageContent, sha) {
    var deferred = q.defer(),
        url = urlBuilder.buildPageUrl(this.userName, this.repositoryName, pageName).concat(urlBuilder.withAccessToken(this.oauth));

    var messageToGithub = {
      message: commitMessage,
      content: base64.encode(pageContent),
      branch: 'master'
    };

    if (sha) {
      messageToGithub.sha = sha;
    }

    httpRequest.put({
      url: url,
      headers: { 'user-agent': 'mdwiki' },
      body: messageToGithub, json: true },
      function (error, response, body) {
        if (error) {
          logger.error('Error while put changes to github: %s', error);
          deferred.reject(error);
          return;
        } else if (response.statusCode !== 200 && response.statusCode !== 201) {
          logger.error('Error while put changes to github: %s', response.body.message);
          error = new Error(util.format('Unexpected response from github: %s', response.body.message));
          error.status = response.statusCode;
          deferred.reject(error);
          return;
        }
        response.body = marked(pageContent);
        deferred.resolve(response);
      }
    );

    return deferred.promise;
  }


  deletePage (pageName) {
    var deferred = q.defer(),
        url = urlBuilder.buildPageUrl(this.userName, this.repositoryName, pageName).concat(urlBuilder.withAccessToken(this.oauth));

    this.getPage(pageName).then(function (page) {
      var messageToGithub = {
        message: 'Delete the page ' + pageName,
        branch: 'master',
        sha: page.sha
      };

      httpRequest.del({ url: url, headers: { 'user-agent': 'mdwiki' }, body: messageToGithub, json: true }, function (error, response, body) {
        if (error) {
          logger.error('Error while put changes to github: %s', error);
          deferred.reject(error);
          return;
        }
        deferred.resolve(response);
      });
    }).catch(deferred.reject);

    return deferred.promise;
  }
}

module.exports = GithubContentProvider;
