'use strict';

// Declare app level module which depends on filters, and services

angular.module('mdWiki', [
  'mdWiki.controllers',
  'mdWiki.filters',
  'mdWiki.services',
  'mdWiki.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/:page', {
      templateUrl: '/content.html',
      controller: 'ContentCtrl'
    }).
    when('/view2', {
      templateUrl: 'partials/partial2',
      controller: 'MyCtrl2'
    }).
    otherwise({
      redirectTo: '/index'
    });

  $locationProvider.html5Mode(true);
});
