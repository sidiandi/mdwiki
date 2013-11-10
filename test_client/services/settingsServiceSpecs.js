'use strict';

describe('SettingsService tests', function () {
  var $cacheFactory,
      settingsService,
      cache;

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.services');
  });

  beforeEach(inject(function ($injector) {
    $cacheFactory = $injector.get('$angularCacheFactory');
    settingsService = $injector.get('SettingsService');

    cache = $cacheFactory.get('mdwiki');

    expect(cache).toBeDefined();
  }));

  describe('get tests', function () {
    it('should return a default settings object when no settings are saved', function () {
      spyOn(cache, 'get').andReturn(undefined);

      var settings = settingsService.get();

      expect(settings).not.toBeUndefined();
      expect(settings.provider).toBe('git');
    });

    it('should return the saved object', function () {
      spyOn(cache, 'get').andReturn({
        provider: 'github',
        url: 'mdwiki/mdwiki.wiki.git'
      });

      var settings = settingsService.get();

      expect(settings).toBeDefined();
      expect(settings.provider).toBe('github');
    });
  });

  describe('put tests', function () {
    it('should save the given settings', function () {
      spyOn(cache, 'put');

      var settings = {
        provider: 'github'
      };
      settingsService.put(settings);

      expect(cache.put).toHaveBeenCalledWith('settings', settings);

    });
  });

});

