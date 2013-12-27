'use strict';

describe('AuthCtrl tests', function () {
  var $scope,
      authService,
      createController,
      isAuthenticatedDeferred;

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.controllers');
  });

  beforeEach(inject(function ($injector, $rootScope, $controller, $q) {
    $scope = $rootScope.$new();

    authService = $injector.get('AuthService');

    isAuthenticatedDeferred = $q.defer();
    spyOn(authService, 'isAuthenticated').andReturn(isAuthenticatedDeferred.promise);

    createController = function () {
      return $controller('AuthCtrl', {
        $scope: $scope,
        authService: authService
      });
    };
  }));

  describe('When user is authenticated', function () {
    it('Should set the user and that user isAuthenticated', function () {
      createController();

      $scope.$apply(function () {
        isAuthenticatedDeferred.resolve('janbaer');
      });

      expect($scope.isAuthenticated).toEqual(true);
      expect($scope.user).toEqual('janbaer');
    });
  });
  describe('When user is not authenticated', function () {
    it('Should set the user to null and that user is not authenticated', function () {
      createController();

      $scope.$apply(function () {
        isAuthenticatedDeferred.resolve();
      });

      expect($scope.isAuthenticated).toEqual(false);
      expect($scope.user).toEqual(null);
    });
  });
});
