'use strict';

describe('Git Controller Tests', function () {

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  describe('When the user enters a valid git url', function () {
    var $scope, $location, gitCtrl, gitService;

    beforeEach(inject(function ($injector, $controller, $rootScope, $q) {
      $scope = $rootScope.$new();

      $location = $injector.get('$location');

      gitService = $injector.get('gitService');
      var deferred = $q.defer();
      deferred.resolve();
      spyOn(gitService, 'clone').andReturn(deferred.promise);

      spyOn($location, 'path');

      gitCtrl = $controller('GitCloneCtrl', {
        $scope: $scope,
        $location: $location,
        gitService: gitService
      });
    }));

    it('should clone the method', function () {
      $scope.clone();

      $scope.$apply();

      expect($location.path).toHaveBeenCalledWith('/');
    });
  });

});