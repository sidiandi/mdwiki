'use strict';

var services = services || angular.module('mdwiki.services', []);

services.factory('HttpHeaderBuilderService', [ 'SettingsService', function (settingsService) {
  var build = function (contentType, settings) {
    contentType = contentType || 'application/json';
    settings = settings || settingsService.get();

    return {
      'Content-Type': 'application/json',
      'X-MDWiki-Provider': settings.provider,
      'X-MDWiki-Url': settings.url
    };
  };

  return {
    build: build
  };
}]);
