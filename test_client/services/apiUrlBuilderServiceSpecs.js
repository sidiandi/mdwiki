'use strict';

describe('ApiUrlBuilder Service specs', function () {
  var service;

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.services');
  });

  beforeEach(inject(function ($injector) {
    service = $injector.get('ApiUrlBuilderService');
  }));

  describe('When the provider is github', function () {
    it('should set the github user and repository between the both urls', function () {
      var settings = {
        provider: 'github',
        githubUser: 'janbaer',
        githubRepository: 'wiki'
      };

      var result = service.build('/api/', 'pages', settings);
      expect(result).toEqual('/api/janbaer/wiki/pages');
    });
  });

  describe('When the provider is git', function () {
    it('should just concatenate the both urls', function () {
      var settings = {
        provider: 'git'
      };

      var result = service.build('/api/', 'pages', settings);
      expect(result).toEqual('/api/pages');
    });
  });
});
