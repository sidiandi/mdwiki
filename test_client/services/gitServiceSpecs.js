'use strict';

describe('Git Service specs', function () {
  var httpMock;
  var gitService;

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.services');
  });

  beforeEach(inject(function ($injector) {
    httpMock = $injector.get('$httpBackend');
    gitService = $injector.get('GitService');
  }));

  it('should call the clone function with the given repository url', function () {
    var repositoryUrl = 'https://github.com/janbaer/mdwiki.wiki.git';

    httpMock.expectPOST('/api/git/clone', { repositoryUrl: repositoryUrl }).respond(200, '');

    gitService.clone(repositoryUrl);

    httpMock.flush();
  });

  it('should call the pull function for the current repository', function () {
    var repositoryUrl = 'https://github.com/janbaer/mdwiki.wiki.git';

    httpMock.expectPOST('/api/git/pull').respond(200);

    gitService.pull(repositoryUrl);

    httpMock.flush();
  });
});
