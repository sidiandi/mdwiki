'use strict';

var fs = require('fs'),
    path = require('path'),
    md = require("node-markdown").Markdown,
    Q = require('q'),
    logger = require('./logger'),
    errors = require('./errors');

var checkFileName = function (contentDir, pageName) {
  var fileName = path.join(contentDir, pageName + '.md');

  if (pageName === 'index') {
    if (!fs.existsSync(fileName)) {
      var alternateFileName = path.join(contentDir, 'home.md');
      if (fs.existsSync(alternateFileName)) {
        return alternateFileName;
      }
    }
  }

  return fileName;
};

var getPageContent = function (pageName) {
  var contentDirPath = path.join(__dirname, '../content');
  var fileName = checkFileName(contentDirPath, pageName);

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
        var html = md(markdown);
        deferred.resolve(html);
      } catch (e) {
        logger.error('parsing of markdown for page $s: $s', pageName, e);
        deferred.reject(e);
      }
    })
    .catch(deferred.reject);

  return deferred.promise;
};

var getPages = function () {
  var deferred = Q.defer();

  var contentPath = path.join(__dirname, '../content/');

  fs.exists(contentPath, function (exists) {
    var pages = [];

    if (exists) {
      fs.readdir(contentPath, function (err, files) {
        if (err) {
          deferred.reject(err);
        }

        files = files || []; // readdir return undefined when no pages exists

        files.forEach(function (file) {
          if (path.extname(file) !== '.md') {
            return;
          }
          var fileWithoutExt = path.basename(file, '.md');

          var page = {
            title: fileWithoutExt,
            name: fileWithoutExt
          };

          pages.push(page);
        });
        deferred.resolve(pages);
      });
    } else {
      deferred.resolve(pages);
    }

  });

  return deferred.promise;
};


exports.getPageContent = getPageContent;
exports.getPageContentAsHtml = getPageContentAsHtml;
exports.getPages = getPages;
