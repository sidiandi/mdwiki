'use strict';

var Q = require('q'),
  util = require('util'),
  logger = require('./logger'),
  errors = require('./errors'),
  marked = require('marked');

var parseOneLine = function (lineNumber, fileNameSplit, lines) {
    var result = {};
    result.fileName = fileNameSplit[fileNameSplit.length - 1];
    result.fileNameWithoutExtension = result.fileName.split('.')[0];
    var fileIndex = lines[lineNumber].indexOf(result.fileName);
    var fileContext = lines[lineNumber].substr(fileIndex + result.fileName.length + 1);
    result.fileContext = marked.parse(fileContext);

    return result;
  };

var parse = function (textToParse) {
  var deferred = Q.defer();

  var result = [];
  if (textToParse === '') {
    deferred.resolve(result);
  } else {
    var lines = textToParse.split('\n');
    for (var i = 0; i < lines.length - 1; i++) {
      var splitResult = lines[i].split(':'),
          fileNameSplit;
      var isWindowsLine = splitResult[0].trim().length === 1 & lines[0].indexOf(splitResult[0].trim() + ":/") === 0;
      if (isWindowsLine) {
        fileNameSplit = splitResult[1].split('/');
        result[i] = parseOneLine(i, fileNameSplit, lines);
      } else {
        fileNameSplit = splitResult[0].split('/');
        result[i] = parseOneLine(i, fileNameSplit, lines);
      }
    }
    deferred.resolve(result);
  }


  return deferred.promise;
};

module.exports.parse = parse;