'use strict';

describe('Content Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When the page exists', function () {
    var $scope, $controller, deferred, pageService, settingsService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');

      pageService = $injector.get('PageService');
      deferred = $q.defer();
      spyOn(pageService, 'getPage').andReturn(deferred.promise);

      settingsService = $injector.get('SettingsService');
      spyOn(settingsService, 'get').andReturn({ provider: 'git' });
    }));

    it('should set the html in the content of the scope', function () {
      var controller = $controller('ContentCtrl', {
        $scope: $scope,
        $routeParams: { page: 'index'},
        $location: {},
        pageService: pageService,
        settingsService: settingsService
      });

      // This is important to resolve the promises => it must called after the function
      // that is using the promise, in this case the constructor function of the controller
      $scope.$apply(function () {
        deferred.resolve('<h1>Test</h1>');
      });

      expect($scope.content).toEqual('<h1>Test</h1>');
    });
  });

  describe('When Page not exists and the page name is index', function () {
    var $scope, $controller, $location, pageService, settingsService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');
      $location = $injector.get('$location');

      pageService = $injector.get('PageService');
      var deferred = $q.defer();

      var error = new Error();
      error.code = 404;
      deferred.reject(error);
      spyOn(pageService, 'getPage').andReturn(deferred.promise);

      settingsService = $injector.get('SettingsService');
      spyOn(settingsService, 'get').andReturn({ provider: 'git' });

      spyOn($location, 'path');
    }));

    it('should redirect the user to the git clone page', function () {
      var controller = $controller('ContentCtrl', {
        $scope: $scope,
        $routeParams: { page: 'index'},
        $location: $location,
        pageService: pageService,
        settingsService: settingsService
      });

      $scope.$apply();

      expect($scope.content).toEqual('');
      expect($location.path).toHaveBeenCalledWith('/git/connect');
    });
  });

  describe('When Page not exists and the page name is not index', function () {
    var $scope, $controller, $location, pageService, settingsService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');
      $location = $injector.get('$location');

      pageService = $injector.get('PageService');
      var deferred = $q.defer();

      var error = new Error();
      error.code = 404;
      deferred.reject(error);
      spyOn(pageService, 'getPage').andReturn(deferred.promise);

      settingsService = $injector.get('SettingsService');
      spyOn(settingsService, 'get').andReturn({ provider: 'git' });

      spyOn($location, 'path');
    }));

    it('should redirect the user show that the content was not found', function () {
      var controller = $controller('ContentCtrl', {
        $scope: $scope,
        $routeParams: { page: 'page1'},
        $location: $location,
        pageService: pageService,
        settingsService: settingsService
      });

      $scope.$apply();

      expect($scope.errorMessage).toEqual('Content not found!');
      expect($location.path).not.toHaveBeenCalled();
    });
  });

  describe('When the user navigates to a page', function () {
    var createController, rootScope;

    beforeEach(inject(function ($injector, $q) {
      rootScope = $injector.get('$rootScope');
      var $controller = $injector.get('$controller');
      var $location = $injector.get('$location');

      var $scope = rootScope.$new();

      var pageService = $injector.get('PageService');

      spyOn(pageService, 'getPage').andReturn($q.when('<h1>Test</h1>'));

      spyOn(rootScope, '$broadcast').andCallThrough();

      var settingsService = $injector.get('SettingsService');
      spyOn(settingsService, 'get').andReturn({ provider: 'git' });

      createController = function () {
        return $controller('ContentCtrl', {
          $rootScope: rootScope,
          $scope: $scope,
          $routeParams: { page: 'page1'},
          $location: $location,
          pageService: pageService,
          settingsService: settingsService
        });
      };
    }));

    it('Should send a message on the global scope, that the editor is hidden', function () {
      var isEditorVisible = true;

      rootScope.$on('isEditorVisible', function (event, data) {
        isEditorVisible = data.isEditorVisible;
      });

      var controller = createController();

      rootScope.$digest();

      expect(rootScope.$broadcast).toHaveBeenCalledWith('isEditorVisible', { isEditorVisible: false });
      expect(isEditorVisible).toEqual(false);
    });
  });

  describe('When html contains some anchors to static files', function () {
    var $scope, $controller, deferred, pageService, settingsService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope;
      $controller = $injector.get('$controller');

      pageService = $injector.get('PageService');
      deferred = $q.defer();
      spyOn(pageService, 'getPage').andReturn(deferred.promise);

      settingsService = $injector.get('SettingsService');
    }));

    it('should add a target attribute to the anchors', function () {
      spyOn(settingsService, 'get').andReturn({ provider: 'git' });

      var controller = $controller('ContentCtrl', {
        $scope: $scope,
        $routeParams: { page: 'index'},
        $location: {},
        pageService: pageService,
        settingsService: settingsService
      });

      // This is important to resolve the promises => it must called after the function
      // that is using the promise, in this case the constructor function of the controller
      $scope.$apply(function () {
        deferred.resolve('<a href="/static/staticfile.pdf">Test</a>');
      });

      expect($scope.content).toEqual('<a href="/static/staticfile.pdf" target="_blank">Test</a>');
    });

    describe('and the current provider is github', function () {
      it('Should add the github username and repository to the url', function () {
        spyOn(settingsService, 'get').andReturn({ provider: 'github', githubUser: 'janbaer', githubRepository: 'wiki' });

        var controller = $controller('ContentCtrl', {
          $scope: $scope,
          $routeParams: { page: 'index'},
          $location: {},
          pageService: pageService,
          settingsService: settingsService,
        });

        $scope.$apply(function () {
          deferred.resolve('<a href="/static/staticfile.pdf">Test</a>');
        });

        expect($scope.content).toEqual('<a href="/static/janbaer/wiki/staticfile.pdf" target="_blank">Test</a>');
      });
    });

    afterEach(function () {
      settingsService.get.reset();
    });

  });

  describe('When we host a github wiki it should remove the wiki at the begin of the link', function () {
    var $scope, $controller, deferred, pageService, settingsService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');

      pageService = $injector.get('PageService');
      deferred = $q.defer();
      spyOn(pageService, 'getPage').andReturn(deferred.promise);

      settingsService = $injector.get('SettingsService');
      spyOn(settingsService, 'get').andReturn({ provider: 'git' });
    }));

    it('should add a target attribut to the anchors', function () {
      var controller = $controller('ContentCtrl', {
        $scope: $scope,
        $routeParams: { page: 'index'},
        $location: {},
        pageService: pageService,
        settingsService: settingsService
      });

      $scope.$apply(function () {
        deferred.resolve('<a href="wiki/page1">Page1</a>');
      });

      expect($scope.content).toEqual('<a href="/page1">Page1</a>');
    });
  });


});
