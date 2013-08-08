'use strict';

var fs = require('fs'),
path = require('path'),
marked = require('marked'),
Q = require('q');

exports.getPageContent = function (pageName) {
  var fileName = path.join(__dirname, '../content', pageName + '.md');

  var deferred = Q.defer();

  if (fs.existsSync(fileName) === false) {
    deferred.reject(new Error('page not found'));
  }

  fs.readFile(fileName, function (error, data) {
    if (error) {
      deferred.reject(error);
    } else {
      try {
        var html = marked(data.toString());
        deferred.resolve(html);
      } catch (e) {
        console.error(e);
        deferred.reject(e);
      }
    }
  });

  return deferred.promise;
};