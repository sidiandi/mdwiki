'use strict';

var util = require('util');

var REPO_BASE_URI = 'https://api.github.com/repos/%s/%s/contents';
var RAW_BASE_URI = 'https://raw.github.com/%s/%s/master/%s.md';
var SEARCH_BASE_URI = 'https://api.github.com/search/code?q=%s+in:file+extension:md+repo:%s/%s';

var buildPagesUrl = function (user, repository) {
  return util.format(REPO_BASE_URI, user, repository);
};

var buildPageContentUrl = function (user, repository, pageName) {
  return util.format(RAW_BASE_URI, user, repository, pageName);
};

var buildSearchUrl = function (user, repository, searchTerm) {
  return util.format(SEARCH_BASE_URI, user, repository, searchTerm);
};

module.exports.buildPagesUrl = buildPagesUrl;
module.exports.buildPageContentUrl = buildPageContentUrl;
module.exports.buildSearchUrl = buildSearchUrl;
