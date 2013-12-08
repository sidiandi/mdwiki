'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('SearchCtrl', ['$scope', '$location', '$route', 'SearchService', function ($scope, $location, $route, searchService) {
    $scope.textToSearch = '';
    $scope.searchResult = searchService.searchResult;
    $scope.message = '';

    $scope.search = function () {
        searchService.search($scope.textToSearch)
            .then(function (data) {
                $scope.message = 'Search successfully finished';
                searchService.searchResult = data;
                $location.path('/search');
              }, function (error) {
                var searchedText = error || '';
                $scope.message = 'An error occurred while searching for the text: ' + searchedText.toString();
              });
      };
  }]);
