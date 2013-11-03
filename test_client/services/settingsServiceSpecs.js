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

    expect(cache).not.toBeUndefined();
  }));

  describe('get tests', function () {
    it('should return a default settings object when no settings are saved', function () {
      spyOn(cache, 'get').andReturn(undefined);

      var settings = settingsService.get();

      expect(settings).not.toBeUndefined();
      expect(settings.provider).toBe('Git');
    });

    it('should return the saved object', function () {
      spyOn(cache, 'get').andReturn({
        provider: 'GitHub',
        url: 'https://github.com/mdwiki/mdwiki.wiki.git'
      });

      var settings = settingsService.get();

      expect(settings).not.toBeUndefined();
      expect(settings.provider).toBe('GitHub');
    });
  });

  describe('put tests', function () {
    it('should save the given settings', function () {
      spyOn(cache, 'put');

      var settings = {
        provider: 'GitHub'
      };
      settingsService.put(settings);

      expect(cache.put).toHaveBeenCalledWith('settings', settings);

    });
  });

});

