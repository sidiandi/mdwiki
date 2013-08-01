'use strict';

/* Controllers */

angular.module('mdWiki.controllers', []).
  controller('ContentCtrl', function ($scope, $routeParams, $http) {
    $http({
      method: 'GET',
      url: '/api/' + $routeParams.page;
    }).
    success(function (data, status, headers, config) {
      $scope.content = data;
    }).
    error(function (data, status, headers, config) {
      $scope.content = 'Content not found!';
    });

  }).
  controller('SearchCtrl', function ($scope) {
    // write Ctrl here

  }).
  controller('MyCtrl2', function ($scope) {
    // write Ctrl here

  });
