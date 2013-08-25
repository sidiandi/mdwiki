'use strict';

describe('Pages Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When page exists', function () {
    var $scope, pageCtrl, pageService;

    beforeEach(inject(function ($injector, $rootScope, $q) {
      $scope = $rootScope.$new();
      var $controller = $injector.get('$controller');

      pageService = $injector.get('PageService');
      var deferred = $q.defer();
      deferred.resolve([ {name: 'index'}, {name: 'page1'}]);
      spyOn(pageService, 'getPages').andReturn(deferred.promise);

      pageCtrl = $controller('PagesCtrl', {
        $scope: $scope,
        pageService: pageService
      });
    }));

    it('it should call the service the fetch all pages and set it into the content', function () {

      $scope.$apply();

      expect($scope.pages).not.toBeUndefined;
      expect($scope.pages.length).toEqual(2);
    });

    describe('Filter excludeDefaultPage tests', function () {
      it('it should filter the index page', function () {
        expect($scope.excludeDefaultPage({name: 'index'})).toBe(false);
      });

      it('it should filter the home page', function () {
        expect($scope.excludeDefaultPage({name: 'home'})).toBe(false);
      });

      it('it should filter the home page also when it begins with an capital letter', function () {
        expect($scope.excludeDefaultPage({name: 'Home'})).toBe(false);
      });

      it('it should not filter the page1 page', function () {
        expect($scope.excludeDefaultPage({name: 'page1'})).toBe(true);
      });

    });
  });



});
