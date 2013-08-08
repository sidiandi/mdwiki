'use strict';

var fs = require('fs'),
path = require('path'),
marked = require('marked'),
Q = require('q');

var getPageContent = function (pageName) {
  var fileName = path.join(__dirname, '../content', pageName + '.md');

  var deferred = Q.defer();

  if (fs.existsSync(fileName) === false) {
    deferred.reject(new Error('page not found'));
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
        console.error(e);
        deferred.reject(e);
      }
    });

  return deferred.promise;
};

exports.getPageContent = getPageContent;
exports.getPageContentAsHtml = getPageContentAsHtml;