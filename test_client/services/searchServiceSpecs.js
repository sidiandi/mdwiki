'use strict';

describe('SearchService spec', function () {
    var httpMock, searchService;

    beforeEach(function () {
        module('mdwiki');
        module('mdwiki.services');
      });

    beforeEach(inject(function ($injector) {
        httpMock = $injector.get('$httpBackend');
        searchService = $injector.get('SearchService');

        var settingsService = $injector.get('SettingsService');
        spyOn(settingsService, 'get').andReturn({ provider: 'github', githubUser: 'janbaer', githubRepository: 'wiki', url: 'janbaer/wiki' });
      }));

    it('should call the search function with the given text to search', function () {
        var textToSearch = 'javascript';

        var data = { textToSearch: textToSearch };

        httpMock.expectPOST('/api/janbaer/wiki/search', data).respond(200, '');

        searchService.search(textToSearch);

        httpMock.flush();
      });
  });
