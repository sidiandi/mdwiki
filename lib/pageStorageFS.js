'use strict';

var fs = require('fs'),
    path = require('path'),
    md = require('node-markdown').Markdown,
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
  var readFile = Q.denodeify(fs.readFile);

  var deferred = Q.defer();

  if (fs.existsSync(fileName)) {
    readFile(fileName)
      .then(function (data) {
        deferred.resolve(data.toString());
      })
      .catch(function (error) {
        logger.error(error);
        deferred.reject(error);
      });
  } else {
    deferred.reject(new errors.FileNotFoundError('page not found', fileName));
  }

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
            name: fileWithoutExt,
            fileName: file
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

var fetchStaticFile = function (request, response) {
  var fileName = path.join(__dirname, '../content/', request.url);

  fs.exists(fileName, function (exists) {
    if (!exists) {
      logger.warn('static file \'%s\' does not exists', fileName);
      response.send(404, 'file not found');
      response.end();
    }
    else {
      response.sendfile(fileName);
    }
  });
};


exports.getPageContent = getPageContent;
exports.getPageContentAsHtml = getPageContentAsHtml;
exports.getPages = getPages;
exports.fetchStaticFile = fetchStaticFile;
