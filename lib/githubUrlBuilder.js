'use strict';

var util = require('util');

var REPO_BASE_URI = 'https://api.github.com/repos/%s/%s/contents';
var RAW_BASE_URI = 'https://raw.github.com/%s/%s/master/%s.md';
var SEARCH_BASE_URI = 'https://api.github.com/search/code?q=%s+in:file+extension:md+repo:%s/%s';
var STATICFILE_BASE_URI = 'https://github.com/%s/%s/raw/master/static/%s';
var STATICFILE_BASE_URI = 'https://rawgithub.com/%s/%s/master/static/%s';
var PAGE_UPDATE_URI = 'https://api.github.com/repos/%s/%s/contents/%s.md?access_token=%s';

var buildPagesUrl = function (user, repository) {
  return util.format(REPO_BASE_URI, user, repository);
};

var buildPageContentUrl = function (user, repository, pageName) {
  return util.format(RAW_BASE_URI, user, repository, pageName);
};

var buildSearchUrl = function (user, repository, searchTerm) {
  return util.format(SEARCH_BASE_URI, searchTerm, user, repository);
};

var buildStaticFileUrl = function (user, repository, requestedUrl) {
  var partialString = util.format('/static/%s/%s/', user, repository);
  return util.format(STATICFILE_BASE_URI, user, repository, requestedUrl.substring(partialString.length));
};

var buildPageUpdateUrl = function (user, repository, pageName, accessToken) {
  return util.format(PAGE_UPDATE_URI, user, repository, pageName, accessToken);
};

module.exports.buildPagesUrl = buildPagesUrl;
module.exports.buildPageContentUrl = buildPageContentUrl;
module.exports.buildSearchUrl = buildSearchUrl;
module.exports.buildStaticFileUrl = buildStaticFileUrl;
module.exports.buildPageUpdateUrl = buildPageUpdateUrl;
