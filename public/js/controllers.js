'use strict';

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

});

controllers.controller('PagesCtrl', function ($scope, $http) {
  $scope.pages = [];

  $http({
    method: 'GET',
    url: '/api/pages'
  }).success(function (data, status, headers, config) {
    $scope.pages = data;
  }).error(function (data, status, headers, config) {
    $scope.pages = [];
  });

});
