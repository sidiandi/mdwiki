'use strict';

var fs = require('fs'),
    path = require('path'),
    marked = require('marked'),
    Q = require('q'),
    logger = require('./logger'),
    errors = require('./errors');

var getPageContent = function (pageName) {
  var fileName = path.join(__dirname, '../content', pageName + '.md');

  var deferred = Q.defer();

  var readFile = Q.nfbind(fs.readFile);

  var defer = Q.defer();
  fs.exists(fileName, defer.resolve);  // See http://bit.ly/14eZBtb

  defer.promise.then(function (exists) {
    if (!exists) {
      deferred.reject(new errors.FileNotFoundError('page not found', fileName));
    } else {
      readFile(fileName)
        .then(function (data) {
          deferred.resolve(data.toString());
        });
    }
  })
  .catch(function (error) {
    logger.error(error);
    deferred.reject(error);
  });

  return deferred.promise;
};

var getPageContentAsHtml = function (pageName) {
  var deferred = Q.defer();

  getPageContent(pageName)
    .then(function (markdown) {
      try {
        var html = marked(markdown);
        deferred.resolve(html);
      } catch (e) {
        deferred.reject(e);
      }
    });

  return deferred.promise;
};

var getPages = function () {
  var deferred = Q.defer();

  var contentPath = path.join(__dirname, '../content/*.md');

  fs.readdir(contentPath, function (err, files) {
    if (err) {
      deferred.reject(err);
    }

    files = files || []; // readdir return undefined when no pages exists
    var pages = [];

    files.forEach(function (file) {
      var fileWithoutExt = path.basename(file, '.md');

      var page = {
        title: fileWithoutExt,
        name: fileWithoutExt
      };

      pages.push(page);
    });

    deferred.resolve(pages);
  });

  return deferred.promise;
};

exports.getPageContent = getPageContent;
exports.getPageContentAsHtml = getPageContentAsHtml;
exports.getPages = getPages;
