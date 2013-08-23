'use strict';

var Q = require('q'),
  util = require('util'),
  logger = require('./logger'),
  errors = require('./errors'),
  marked = require('marked');

var parse = function (textToParse) {
  var deferred = Q.defer();

  var result = [];
  if (textToParse === '') {
    deferred.resolve(result);
  } else {
    var lines = textToParse.split('\n');
    for (var i = 0; i < lines.length - 1; i++) {
      var splitResult = lines[i].split(':'),
          fileNameSplit, fileIndex, fileContext;
      var isWindowsLine = splitResult[0].trim().length === 1 & lines[0].indexOf(splitResult[0].trim() + ":/") === 0;
      if (isWindowsLine) {
        fileNameSplit = splitResult[1].split('/');
        result[i] = {};
        result[i].fileName = fileNameSplit[fileNameSplit.length - 1];
        result[i].fileNameWithoutExtension = result[i].fileName.split('.')[0];
        fileIndex = lines[i].indexOf(result[i].fileName);
        fileContext = lines[i].substr(fileIndex + result[i].fileName.length + 1);
        result[i].fileContext = marked.parse(fileContext);
      } else {
        fileNameSplit = splitResult[0].split('/');
        result[i] = {};
        result[i].fileName = fileNameSplit[fileNameSplit.length - 1];
        result[i].fileNameWithoutExtension = result[i].fileName.split('.')[0];
        fileIndex = lines[i].indexOf(result[i].fileName);
        fileContext = lines[i].substr(fileIndex + result[i].fileName.length + 1);
        result[i].fileContext = marked.parse(fileContext);
      }
    }
    deferred.resolve(result);
  }


  return deferred.promise;
};

module.exports.parse = parse;