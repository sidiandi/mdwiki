'use strict';

var services = services || angular.module('mdwiki.services', []);

services.factory('SettingsService', ['$angularCacheFactory', function ($angularCacheFactory) {
  var cache = $angularCacheFactory('mdwiki', { storageMode: 'localStorage' });

  var get = function () {
    var settings = cache.get('settings');
    if (settings === undefined) {
      settings = {
        provider: 'git',
        url: ''
      };
    }

    return settings;
  };

  var put = function (settings) {
    cache.put('settings', settings);
  };

  return {
    get: get,
    put: put
  };
}]);
