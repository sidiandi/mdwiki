'use strict';

describe('Search Controller Tests', function () {

    beforeEach(function () {
        module('mdwiki');
        module('mdwiki.controllers');
      });

    describe('When the user enters a text to be searched', function () {
        var $scope, $location, $route, searchCtrl, searchService, searchServiceDeferred;

        beforeEach(inject(function ($injector, $controller, $rootScope, $q) {
            $scope = $rootScope.$new();

            $location = $injector.get('$location');

            spyOn($location, 'path');

            $route = $injector.get('$route');

            // spyOn($route, 'reload');

            searchService = $injector.get('SearchService');
            searchServiceDeferred = $q.defer();
            spyOn(searchService, 'search').andReturn(searchServiceDeferred.promise);

            var $http = $injector.get('$httpBackend');
            $http.expectGET('./views/searchResult.html').respond(200, '</h1>');

            searchCtrl = $controller('SearchCtrl', {
                $scope: $scope,
                $location: $location,
                $route: $route,
                searchService: searchService
              });
          }));

        it('should call the search method and search location successfully', function () {
            $scope.textToSearch = 'textToSearch';
            $scope.search();

            searchServiceDeferred.resolve([{fileNameWithoutExtension: 'name', fileContext: 'context'}]);
            $scope.$digest();

            expect($location.path).toHaveBeenCalledWith('/search');
            expect(searchService.search).toHaveBeenCalled();
          });
      });
  });
