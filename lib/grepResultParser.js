'use strict';

var Q = require('q'),
  util = require('util'),
  logger = require('./logger'),
  errors = require('./errors'),
  marked = require('marked');

var reduceBigHeaders =  function (html) {
    if (html) {
      return html.replace('<h1>', '<h4>')
                 .replace('</h1>', '</h4>')
                 .replace('<h2>', '<h4>')
                 .replace('</h2>', '</h4>')
                 .replace('<h3>', '<h4>')
                 .replace('</h3>', '</h4>');
    }

    return html;
  };

var parseOneLine = function (fileName, line) {
    var result = {};

    var fileIndex = line.indexOf(fileName);

    var fileContext = line.substr(fileIndex + fileName.length + 1);

    fileContext = marked.parse(fileContext);

    result.fileContext = reduceBigHeaders(fileContext);

    result.fileName = fileName;

    result.fileNameWithoutExtension = result.fileName.split('.')[0];

    return result;
  };

var parse = function (textToParse) {
  var deferred = Q.defer(),
      result = [];

  if (textToParse === '') {

    deferred.resolve(result);

  } else {

    var lines = textToParse.split('\n');

    var resultCounter = 0;

    lines.pop();

    lines.forEach(function (line) {
      var fileNameAndContext = '',
          fileName = '';

      fileNameAndContext = line.split(':');

      fileName = fileNameAndContext[0].trim();

      result[resultCounter] = parseOneLine(fileName, line);

      resultCounter = resultCounter + 1;

    });

    deferred.resolve(result);

  }

  return deferred.promise;
};

module.exports.parse = parse;