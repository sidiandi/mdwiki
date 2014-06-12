'use strict';

var services = services || angular.module('mdwiki.services', []);

services.factory('SettingsService', ['$angularCacheFactory', function ($angularCacheFactory) {
  var cache = $angularCacheFactory('mdwiki', { storageMode: 'localStorage' });

  var getDefaultSettings = function () {
    return {
      provider: 'github',
      githubUser: 'mdwiki',
      githubRepository: 'wiki',
      url: 'mdwiki/wiki',
      startPage: 'index'
    };
  };

  var isDefaultSettings = function (settings) {
    return angular.equals(settings, this.getDefaultSettings());
  };

  var get = function () {
    var settings = cache.get('settings');
    if (settings === undefined) {
      settings = this.getDefaultSettings();
    }
    return settings;
  };

  var put = function (settings) {
    cache.put('settings', settings);
  };

  return {
    get: get,
    put: put,
    getDefaultSettings: getDefaultSettings,
    isDefaultSettings: isDefaultSettings
  };
}]);
