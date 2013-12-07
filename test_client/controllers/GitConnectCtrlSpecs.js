'use strict';

describe('Git Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When the user enters a valid git url', function () {
    var $scope, $location, gitCtrl,
        gitService, pageService, settingsService,
        gitCloneDeferred, pagesDeferred, serverConfigDeferred;

    beforeEach(inject(function ($injector, $controller, $rootScope, $q) {
      $scope = $rootScope.$new();


      $location = $injector.get('$location');

      spyOn($location, 'path');

      gitService = $injector.get('GitService');

      gitCloneDeferred = $q.defer();
      spyOn(gitService, 'clone').andReturn(gitCloneDeferred.promise);

      var $http = $injector.get('$httpBackend');
      $http.expectGET('/api/serverconfig').respond(200, '{"providers": ["github"]}');
      $http.expectGET('./views/content.html').respond(200, '<h1/>');

      pageService = $injector.get('PageService');
      pagesDeferred = $q.defer();
      pagesDeferred.resolve([{name: 'index'}]);
      spyOn(pageService, 'getPages').andReturn(pagesDeferred.promise);

      settingsService = $injector.get('SettingsService');
      spyOn(settingsService, 'put');

      var serverConfigService = $injector.get('ServerConfigService');
      serverConfigDeferred = $q.defer();
      spyOn(serverConfigService, 'getConfig').andReturn(serverConfigDeferred.promise);

      gitCtrl = $controller('GitConnectCtrl', {
        $scope: $scope,
        $location: $location,
        gitService: gitService,
        settingsService: settingsService,
        serverConfigService: serverConfigService
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
        expect(settingsService.put).toHaveBeenCalledWith({ provider: 'github', url: 'janbaer/wiki', githubUser: 'janbaer', githubRepository: 'wiki', startPage: 'index' });
      });
    });

    describe('When the ServiceConfigService returns github as supported provider', function () {
      it('Should set isGithubIsSupported and isGitSupported to the expected value', function () {
        $scope.$apply(function () {
          serverConfigDeferred.resolve({providers: ['github']});
        });
        expect($scope.isGithubSupported).toEqual(true);
        expect($scope.isGitSupported).toEqual(false);
      });
    });

    describe('When the ServiceConfigService returns git as supported provider', function () {
      it('Should set isGitHubSupported and isGitsupported to the expected value', function () {
        $scope.$apply(function () {
          serverConfigDeferred.resolve({providers: ['git']});
        });
        expect($scope.isGitSupported).toEqual(true);
        expect($scope.isGithubSupported).toEqual(false);
      });
    });
  });


});
