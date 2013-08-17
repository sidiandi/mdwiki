'use strict';

var controllers = angular.module('mdwiki.controllers', []);

controllers.controller('ContentCtrl', function ($scope, $routeParams, $http, $location) {
  var page = 'index';

  if ($routeParams.page) {
    page = $routeParams.page;
  }

  $http({
    method: 'GET',
    url: '/api/page/' + page
  })
  .success(function (data, status, headers, config) {
    $scope.content = data;
  })
  .error(function (data, status, headers, config) {
    if (page === 'index' && status === 404) {
      $location.path('/git/clone');
    } else {
      $scope.content = 'Content not found!';
    }
  });

});

controllers.controller('PagesCtrl', function ($scope, $http) {
  $scope.pages = [];

  $http({
    method: 'GET',
    url: '/api/pages'
  })
  .success(function (data, status, headers, config) {
    $scope.pages = data;
  })
  .error(function (data, status, headers, config) {
    $scope.pages = [];
  });

});

controllers.controller('GitCloneCtrl', function ($scope, $http, $location) {
  $scope.repositoryUrl = '';
  $scope.isBusy = false;
  $scope.message = 'Please enter the git-url of your repository to clone it into the content folder';
  $scope.hasError = false;

  $scope.clone = function () {
    $scope.isBusy = true;
    $scope.message = 'Please wait while cloning your repository...';
    $scope.hasError = false;

    $http({
      method: 'POST',
      url: '/api/git/clone',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { repositoryUrl: $scope.repositoryUrl }
    })
    .success(function (data, status, headers, config) {
      $scope.message = 'The repository was successful cloned...';
      $scope.isBusy = false;
      $location.path('/');
    })
    .error(function (data, status, headers, config) {
      data = data || '';
      $scope.message = 'There is an error occured while cloning the repository: ' + data.toString();
      $scope.isBusy = false;
      $scope.hasError = true;
    });
  };
});

controllers.controller('GitPullCtrl', function ($scope, $http, $location, $route) {
  $scope.isBusy = false;
  $scope.message = '';
  $scope.hasError = false;

  $scope.pull = function () {
    $scope.isBusy = true;
    $scope.message = 'Please wait while pull the latest changes in your repository...';
    $scope.hasError = false;

    $http({
      method: 'POST',
      url: '/api/git/pull',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .success(function (data, status, headers, config) {
      $scope.message = 'The repository was successful update...';
      $scope.isBusy = false;
      $('#pullButton').button('reset');
      $route.reload();
    })
    .error(function (data, status, headers, config) {
      data = data || '';
      $scope.message = 'There is an error occured while updating your repository: ' + data.toString();
      $scope.isBusy = false;
      $scope.hasError = true;
    });
  };
});
