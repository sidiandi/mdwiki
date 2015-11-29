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

    const request = {
      url: url,
      headers: { 'user-agent': 'mdwiki' }
    };

    httpRequest.get(request, (error, response, body) => {
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
    const fileNameWithoutExt = path.basename(item.name, '.md');

    let page = {
      title: fileNameWithoutExt,
      name: fileNameWithoutExt,
      fileName: item.name,
      sha: item.sha
    };

    if (item.content) {
      page.content = item.content;
    }

    return page;
  }

  static readItems(items) {
    const pages = [];

    items.forEach(item => {
      const page = GithubContentProvider.readItem(item);
      if (page !== undefined) {
        pages.push(page);
      }
    });

    return pages;
  }

  getPageContent(pageName) {
    return this.getPage(pageName)
      .then(page => {
        return base64.decode(page.content);
      })
      .catch(error => {
        if (error.message === '404') {
          logger.error('Error 404 while fetching the content for page %s', pageName);
          throw new errors.FileNotFoundError('page not found', pageName);
        } else {
          logger.error('Error while fetching the content for page %s: %s', pageName, error);
          throw error;
        }
      });
  }

  getPageContentAsHtml(pageName) {
    return this.getPageContent(pageName).then(marked);
  }

  getPages() {
    let url = urlBuilder.buildPagesUrl(this.userName, this.repositoryName);
    if (this.oauth !== undefined) {
      url += urlBuilder.withAccessToken(this.oauth);
    }

    return GithubContentProvider.getParsedJsonFromGithub(url)
      .then(items => {
        return GithubContentProvider.readItems(items);
      })
      .catch(error => {
        if (error.message === '404') {
          throw new errors.RepositoryNotExistsError('The user or repository could not be found', this.userName, this.repositoryName);
        }
        else {
          logger.error('Error while fetching the content for user %s in repository %s: %s', this.userName, this.repositoryName, error);
          throw error;
        }
      });
  }

  getPage(pageName) {
    let url = urlBuilder.buildPageUrl(this.userName, this.repositoryName, pageName);
    if (this.oauth !== undefined) {
      url += urlBuilder.withAccessToken(this.oauth);
    }

    return GithubContentProvider.getParsedJsonFromGithub(url)
      .then(item => {
        return GithubContentProvider.readItem(item);
      })
      .catch(error => {
        if (error.message === '404') {
          logger.error('Error 404 while fetching the page %s', pageName);
          throw new errors.FileNotFoundError('page not found', pageName);
        } else {
          logger.error('Error while fetching the page %s: %s', pageName, error);
          throw error;
        }
      });
  }

  search(searchTerm) {
    let url = urlBuilder.buildSearchUrl(this.userName, this.repositoryName, searchTerm);
    if (this.oauth !== undefined) {
      url += urlBuilder.withAccessToken(url, this.oauth);
    }

    return GithubContentProvider.getParsedJsonFromGithub(url)
      .then(searchResult => {
        return GithubContentProvider.readItems(searchResult.items);
      });
  }

  fetchStaticFile(request, resp) {
    let url = urlBuilder.buildStaticFileUrl(this.userName, this.repositoryName, request.path);
    if (this.oauth !== undefined) {
      url += urlBuilder.withAccessToken(url, this.oauth);
    }

    const githubRequest = httpRequest(url);
    request.pipe(githubRequest);
    githubRequest.pipe(resp);
  }

  savePage(commitMessage, pageName, pageContent) {
    const deferred = q.defer();

    this.getPage(pageName)
      .then(page => {
        this.createOrUpdatePage(commitMessage, pageName, pageContent, page.sha).then(deferred.resolve).catch(deferred.reject);
      })
      .catch(error => {
        if (error instanceof errors.FileNotFoundError) {
          this.createOrUpdatePage(commitMessage, pageName, pageContent).then(deferred.resolve).catch(deferred.reject);
        } else {
          deferred.reject(error);
        }
      });

    return deferred.promise;
  }

  createOrUpdatePage(commitMessage, pageName, pageContent, sha) {
    const deferred = q.defer();
    const url = urlBuilder.buildPageUrl(this.userName, this.repositoryName, pageName).concat(urlBuilder.withAccessToken(this.oauth));

    let request = {
      url: url,
      headers: { 'user-agent': 'mdwiki' },
      body: {
        message: commitMessage,
        content: base64.encode(pageContent),
        branch: 'master'
      },
      json: true
    };

    if (sha) {
      request.body.sha = sha;
    }

    httpRequest.put(request, (error, response, body) => {
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
    });

    return deferred.promise;
  }

  deletePage(pageName) {
      const deferred = q.defer();
      const url = urlBuilder.buildPageUrl(this.userName, this.repositoryName, pageName).concat(urlBuilder.withAccessToken(this.oauth));

      this.getPage(pageName)
        .then(page => {
          const request = {
            url: url,
            headers: { 'user-agent': 'mdwiki' },
            body: {
              message: 'Delete the page ' + pageName,
              branch: 'master',
              sha: page.sha
            },
            json: true
          };

          httpRequest.del(request, (error, response, body) => {
              if (error) {
                logger.error('Error while put changes to github: %s', error);
                deferred.reject(error);
                return;
              }
              deferred.resolve(response);
          });
      })
      .catch(deferred.reject);

      return deferred.promise;
  }
}

module.exports = GithubContentProvider;
