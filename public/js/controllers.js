'use strict';

/* Controllers */

var controllers = angular.module('mdwiki.controllers', []);

controllers.controller('ContentCtrl', function ($scope, $routeParams, $http) {
  var page = 'index';

  if ($routeParams.page) {
    page = $routeParams.page;
  }

  $http({
    method: 'GET',
    url: '/api/' + page
  }).success(function (data, status, headers, config) {
    $scope.content = data;
  }).error(function (data, status, headers, config) {
    $scope.content = 'Content not found!';
  });

  }).controller('SearchCtrl', function ($scope) {
    // write Ctrl here

  }).controller('MyCtrl2', function ($scope) {
    // write Ctrl here

  });
