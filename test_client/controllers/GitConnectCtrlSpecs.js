'use strict';

describe('Git Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When the user enters a valid git url', function () {
    var $scope, $location, gitCtrl,
        gitService, pageService, settingsService,
        gitCloneDeferred, pagesDeferred;

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

      settingsService = $injector.get('SettingsService');
      spyOn(settingsService, 'put');

      gitCtrl = $controller('GitConnectCtrl', {
        $scope: $scope,
        $location: $location,
        gitService: gitService,
        settingsService: settingsService
      });
    }));

    describe('And the users chooses git as provider', function () {
      it('should call the clone method, getpages, saves the settings when successful', function () {
        $scope.provider = 'Git';
        $scope.repositoryUrl = 'https://github.com/mdwiki/mdwiki.wiki.git';
        $scope.clone();

        $scope.$apply(function () {
          gitCloneDeferred.resolve();
          pagesDeferred.resolve([]);
        });

        expect($location.path).toHaveBeenCalledWith('/');
        expect(gitService.clone).toHaveBeenCalled();
        expect(pageService.getPages).toHaveBeenCalled();
        expect(settingsService.put).toHaveBeenCalled();
      });
    });

    describe('And the users chooses github as provider', function () {
      it('should call just getpages and saves the settings when successful', function () {
        $scope.provider = 'github';
        $scope.repositoryUrl = 'janbaer/wiki';
        $scope.connect();

        $scope.$apply(function () {
          pagesDeferred.resolve([]);
        });

        expect($location.path).toHaveBeenCalledWith('/');
        expect(pageService.getPages).toHaveBeenCalled();
        expect(settingsService.put).toHaveBeenCalledWith({ provider: 'github', url: 'janbaer/wiki', githubUser: 'janbaer', githubRepository: 'wiki' });
      });
    });

  });


});
