'use strict';

describe('Git Pull Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When the user has clicked on the pull button', function () {
    var $scope, $route, $http, gitCtrl, gitService, pageService;

    beforeEach(inject(function ($injector, $controller, $rootScope, $q) {
      $scope = $rootScope.$new();

      $route = $injector.get('$route');
      spyOn($route, 'reload');

      $http = $injector.get('$httpBackend');
      $http.expectGET('./views/content.html').respond(200, '<h1/>');

      gitService = $injector.get('GitService');
      var deferred = $q.defer();
      deferred.resolve();
      spyOn(gitService, 'pull').andReturn(deferred.promise);

      pageService = $injector.get('PageService');
      var deferredPageService = $q.defer();
      deferredPageService.resolve([]);
      spyOn(pageService, 'getPages').andReturn(deferred.promise);

      gitCtrl = $controller('GitPullCtrl', {
        $scope: $scope,
        $route: $route,
        gitService: gitService
      });
    }));

    it('it should pull the latest content changes', function () {
      $scope.pull();

      $scope.$apply();

      expect(gitService.pull).toHaveBeenCalled();
      expect(pageService.getPages).toHaveBeenCalled();
      expect($route.reload).toHaveBeenCalled();
    });
  });

});
