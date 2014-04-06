'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('PagesCtrl', ['$rootScope', '$scope', 'PageService', function ($rootScope, $scope, pageService) {
  $scope.pages = [];
  $rootScope.pages = $scope.pages;

  var updatePages = function (pages) {
    $scope.pages = pages || [];
    $rootScope.pages = $scope.pages;
  };

  pageService.getPages()
    .then(function (pages) {
      updatePages(pages);
      pageService.registerObserver(updatePages);
    });


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
