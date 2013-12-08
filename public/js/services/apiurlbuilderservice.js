'use strict';

var services = services || angular.module('mdwiki.services', []);

services.factory('ApiUrlBuilderService', [ 'SettingsService', function (settingsService) {
  var build = function (urlBefore, urlAfter, settings) {
    settings = settings || settingsService.get();

    if (settings.provider === 'github') {
      return urlBefore + settings.githubUser + '/' + settings.githubRepository + '/' + urlAfter;
    }

    return urlBefore + urlAfter;
  };

  return {
    build: build
  };
}]);
