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
        githubUser: 'janbaer',
        githubRepository: 'wiki'
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
        provider: 'git'
      };
      settingsService.put(settings);

      expect(cache.put).toHaveBeenCalledWith('settings', settings);
    });
  });

  describe('isDefaultSettings ', function () {
    describe('When Settings are equal to default settings', function () {
      it('Should return true', function () {
        var settings = settingsService.getDefaultSettings();
        expect(settingsService.isDefaultSettings(settings)).toEqual(true);
      });
    });
    describe('When Settings are not equal to default settings', function () {
      it('Should return false', function () {
        var settings = settingsService.getDefaultSettings();
        settings.url = 'http://....';
        expect(settingsService.isDefaultSettings(settings)).toEqual(false);
      });
    });
  });

});

