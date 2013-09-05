'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('ContentCtrl', ['$scope', '$routeParams', '$location', 'PageService', function ($scope, $routeParams, $location, pageService) {
  var page = 'index';
  $scope.content = '';
  $scope.errorMessage = '';
  $scope.hasError = false;

  if ($routeParams.page) {
    page = $routeParams.page;
  }

  pageService.getPage(page)
    .then(function (page) {
      $scope.content = prepareLinks(page);
    }, function (error) {
      if (page === 'index' && error.code === 404) {
        $location.path('/git/clone');
      } else {
        $scope.errorMessage = 'Content not found!';
        $scope.hasError = true;
      }
    });

  var prepareLinks = function (html) {
    var $dom = $('<div>' + html + '</div>');

    $dom.find('a[href^="/static/"]').attr('target', '_blank');

    $dom.find('a[href^="wiki/"]').each(function () {
      var $link = $(this);
      $link.attr('href', $link.attr('href').substring(4));
    });

    return $dom.html();
  };

}]);
