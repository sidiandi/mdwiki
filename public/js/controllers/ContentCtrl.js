'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('ContentCtrl', ['$scope', '$routeParams', '$location', 'PageService', function ($scope, $routeParams, $location, pageService) {
  var page = 'index';

  if ($routeParams.page) {
    page = $routeParams.page;
  }

  pageService.getPage(page)
    .then(function (page) {
      $scope.content = addTargetToStaticLinks(page);
    }, function (error) {
      if (page === 'index' && error.code === 404) {
        $location.path('/git/clone');
      } else {
        $scope.content = 'Content not found!';
      }
    });

  var addTargetToStaticLinks = function (html) {
    var dom = $('<div>' + html + '</div>');
    dom.find('a[href^="/static/"]').attr('target', '_blank');
    return dom.html();
  };

}]);
