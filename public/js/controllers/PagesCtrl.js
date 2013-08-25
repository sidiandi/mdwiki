'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('PagesCtrl', ['$scope', 'PageService', function ($scope, pageService) {
  $scope.pages = [];

  pageService.getPages()
    .then(function (pages) {
      $scope.pages = pages;

      pageService.registerObserver(updatePages);
    });

  var updatePages = function (pages) {
    $scope.pages = pages || [];
  };

  $scope.excludeDefaultPage = function (page) {
    var excludes = ['index', 'home', 'readme'];
    var excludePage = false;

    angular.forEach(excludes, function (exclude) {
      if (page.name.toLowerCase() === exclude) {
        excludePage = true;
      }
    });

    return !excludePage;
  };

}]);
