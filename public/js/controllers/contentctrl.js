'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('ContentCtrl', ['$scope', '$routeParams', '$location', 'PageService', 'SettingsService', function ($scope, $routeParams, $location, pageService, settingsService) {
  var page = 'index';
  $scope.content = '';
  $scope.errorMessage = '';
  $scope.hasError = false;

  var settings = settingsService.get();

  if ($routeParams.page) {
    page = $routeParams.page;
  }

  pageService.getPage(page)
    .then(function (page) {
      $scope.content = prepareLinks(page, settings);
    }, function (error) {
      if (page === 'index' && error.code === 404) {
        $location.path('/git/connect');
      } else {
        $scope.errorMessage = 'Content not found!';
        $scope.hasError = true;
      }
    });

  var prepareLinks = function (html, settings) {
    var $dom = $('<div>' + html + '</div>');


    $dom.find('a[href^="wiki/"]').each(function () {
      var $link = $(this);
      $link.attr('href', $link.attr('href').substring(4));
    });

    if (settings.provider === 'github') {
      $dom.find('a[href^="/static/"]').each(function () {
        var $link = $(this);
        var newLink = '/static/'.concat(settings.githubUser, '/', settings.githubRepository, '/', $link.attr('href').substring('/static/'.length));
        $link.attr('href', newLink);
        $link.attr('target', '_blank');
      });
    } else {
      $dom.find('a[href^="/static/"]').attr('target', '_blank');
    }

    return $dom.html();
  };

}]);
