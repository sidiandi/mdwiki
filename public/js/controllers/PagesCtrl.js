'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('PagesCtrl', ['$scope', 'PageService', function ($scope, pageService) {
  $scope.pages = [];

  pageService.getPages()
    .then(function (pages) {
      $scope.pages = pages;
    });

}]);