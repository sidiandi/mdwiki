'use strict';

describe('Git Service specs', function () {
    var httpMock;
    var searchService;

    beforeEach(function () {
        module('mdwiki');
        module('mdwiki.services');
      });

    beforeEach(inject(function ($injector) {
        httpMock = $injector.get('$httpBackend');
        searchService = $injector.get('SearchService');
      }));

    it('should call the search function with the given text to search', function () {
        var textToSearch = 'javascript';

        var data = {
          textToSearch: textToSearch,
          settings: { provider: 'Git', url: ''}
        };

        httpMock.expectPOST('/api/search', data).respond(200, '');

        searchService.search(textToSearch);

        httpMock.flush();
      });
  });
