'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('SearchCtrl', ['$scope', '$routeParams', '$http', '$location', '$route', 'SearchService', function ($scope, $routeParams, $http, $location, $route, searchService) {
    $scope.textToSearch = '';
    $scope.searchResult = searchService.searchResult;

    $scope.search = function () {
        console.log('searching ' + $scope.textToSearch);
        $http({
            method: 'POST',
            url: '/api/search',
            headers: {
                'Content-Type': 'application/json'
              },
              data: { textToSearch: $scope.textToSearch }
            })
            .success(function (data, status, headers, config) {
              $scope.message = 'Search successfully finished';
              searchService.searchResult = data;
              $location.path('/search');
              $route.reload();
            })
            .error(function (data, status, headers, config) {
                data = data || '';
                $scope.message = 'There is an error occured while searching for the text: ' + data.toString();
              });
      };
  }]);
