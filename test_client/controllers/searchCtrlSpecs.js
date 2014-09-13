(function () {
  'use strict';

  describe('SearchCtrl Spec', function () {
    beforeEach(function () {
        module('mdwiki');
        module('mdwiki.controllers');
      });

    describe('When the user enters a text to be searched', function () {
        var $scope, $location, $route,
            createController, searchService;

        beforeEach(inject(function ($injector, $controller, $rootScope, $q) {
          $scope = $rootScope.$new();

          $location = $injector.get('$location');
          $route = $injector.get('$route');

          searchService = $injector.get('SearchService');
          spyOn(searchService, 'search').andReturn($q.when([{fileNameWithoutExtension: 'name', fileContext: 'context'}]));

          var $http = $injector.get('$httpBackend');
          $http.expectGET('./views/searchResult.html').respond(200, '</h1>');

          createController = function () {
            return $controller('SearchCtrl', {
              $scope: $scope,
              $location: $location,
              $route: $route,
              searchService: searchService
            });
          };
        }));

        describe('When the user is not on the search page', function () {
          it('Should call the search service and navigates to the search page', function () {
            // ARRANGE
            spyOn($location, 'path');
            createController();
            var textToSearch = 'textToSearch';
            $scope.textToSearch = textToSearch;

            // ACT
            $scope.search();
            $scope.$digest();

            // ASSERT
            expect($location.path).toHaveBeenCalledWith('/search');
            expect(searchService.search).toHaveBeenCalledWith(textToSearch);
          });
        });

        describe('When the user is on the search page', function () {
          it('Should call the search service and reload the search page', function () {
            // ARRANGE
            spyOn($location, 'path').andReturn('/search');
            spyOn($route, 'reload');

            createController();
            var textToSearch = 'textToSearch';
            $scope.textToSearch = textToSearch;

            // ACT
            $scope.search();
            $scope.$digest();

            // ASSERT
            expect($location.path).not.toHaveBeenCalledWith('/search');
            expect($route.reload).toHaveBeenCalled();
            expect(searchService.search).toHaveBeenCalledWith(textToSearch);
          });
        });
      });
  });
})();


