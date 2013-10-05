'use strict';

describe('Git Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When the user enters a valid git url', function () {
    var $scope, $location, gitCtrl, gitService, pageService, gitCloneDeferred, pagesDeferred;

    beforeEach(inject(function ($injector, $controller, $rootScope, $q) {
      $scope = $rootScope.$new();

      $location = $injector.get('$location');

      spyOn($location, 'path');

      gitService = $injector.get('GitService');
      gitCloneDeferred = $q.defer();
      spyOn(gitService, 'clone').andReturn(gitCloneDeferred.promise);

      var $http = $injector.get('$httpBackend');
      $http.expectGET('./views/content.html').respond(200, '<h1/>');

      pageService = $injector.get('PageService');
      pagesDeferred = $q.defer();
      spyOn(pageService, 'getPages').andReturn(pagesDeferred.promise);

      gitCtrl = $controller('GitCloneCtrl', {
        $scope: $scope,
        $location: $location,
        gitService: gitService
      });
    }));

    it('should call the clone method and getpages when clone was successful', function () {
      $scope.clone();

      $scope.$apply(function () {
        gitCloneDeferred.resolve();
        pagesDeferred.resolve([]);
      });

      expect($location.path).toHaveBeenCalledWith('/');
      expect(gitService.clone).toHaveBeenCalled();
      expect(pageService.getPages).toHaveBeenCalled();
    });
  });

});
