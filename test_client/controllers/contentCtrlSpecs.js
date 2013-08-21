'use strict';

describe('Content Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When the page exists', function () {
    var scope, service, $controllerConstructor;

    beforeEach(inject(function ($injector, $controller, $rootScope, $q) {
      scope = $rootScope.$new();
      $controllerConstructor = $controller;
      service = $injector.get('pageService');
      var deferred = $q.defer();
      deferred.resolve('<h1>Test</h1>');
      spyOn(service, 'getPage').andReturn(deferred.promise);
      $rootScope.$apply();
    }));

    it('should set the html in the content of the scope', function () {
      var controller = $controllerConstructor('ContentCtrl', {$scope: scope, $routeParams: { page: 'index'}, $location: {}, pageService: service });

      expect(scope.content).toEqual('<h1>Test</h1>');
    });

    afterEach(function () {
    });
  });



});
