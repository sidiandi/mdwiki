'use strict';

var fs = require('fs'),
    path = require('path'),
    marked = require('marked'),
    Q = require('q'),
    errors = require('./errors');

var getPageContent = function (pageName) {
  var fileName = path.join(__dirname, '../content', pageName + '.md');

  var deferred = Q.defer();

  if (fs.existsSync(fileName) === false) {
    deferred.reject(new errors.FileNotFoundError('page not found', fileName));
  }

  fs.readFile(fileName, function (error, data) {
    if (error) {
      deferred.reject(error);
    } else {
      deferred.resolve(data.toString());
    }
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
