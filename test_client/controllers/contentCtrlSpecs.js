'use strict';

describe('Content Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When the page exists', function () {
    var $scope, $controller, pageService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');

      pageService = $injector.get('pageService');
      var deferred = $q.defer();
      deferred.resolve('<h1>Test</h1>');
      spyOn(pageService, 'getPage').andReturn(deferred.promise);
    }));

    it('should set the html in the content of the scope', function () {
      var controller = $controller('ContentCtrl', {
        $scope: $scope,
        $routeParams: { page: 'index'},
        $location: {},
        pageService: pageService
      });

      // This is important to resolve the promises => it must called after the function
      // that is using the promise, in this case the constructor function of the controller
      $scope.$apply();

      expect($scope.content).toEqual('<h1>Test</h1>');
    });
  });

  describe('When Page not exists and the page name is index', function () {
    var $scope, $controller, $location, pageService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');
      $location = $injector.get('$location');

      pageService = $injector.get('pageService');
      var deferred = $q.defer();

      var error = new Error();
      error.code = 404;
      deferred.reject(error);
      spyOn(pageService, 'getPage').andReturn(deferred.promise);

      spyOn($location, 'path');
    }));

    it('should redirect the user to the git clone page', function () {
      var controller = $controller('ContentCtrl', {
        $scope: $scope,
        $routeParams: { page: 'index'},
        $location: $location,
        pageService: pageService
      });

      $scope.$apply();

      expect($scope.content).toBeUndefined();
      expect($location.path).toHaveBeenCalledWith('/git/clone');
    });
  });

  describe('When Page not exists and the page name is not index', function () {
    var $scope, $controller, $location, pageService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');
      $location = $injector.get('$location');

      pageService = $injector.get('pageService');
      var deferred = $q.defer();

      var error = new Error();
      error.code = 404;
      deferred.reject(error);
      spyOn(pageService, 'getPage').andReturn(deferred.promise);

      spyOn($location, 'path');
    }));

    it('should redirect the user show that the content was not found', function () {
      var controller = $controller('ContentCtrl', {
        $scope: $scope,
        $routeParams: { page: 'page1'},
        $location: $location,
        pageService: pageService
      });

      $scope.$apply();

      expect($scope.content).toEqual('Content not found!');
      expect($location.path).not.toHaveBeenCalled();
    });
  });

});
