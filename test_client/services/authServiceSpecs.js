(function () {
  'use strict';

  describe('AuthService Spec', function () {
    var httpMock;
    var authService;

    beforeEach(function () {
      module('mdwiki');
      module('mdwiki.services');
    });

    beforeEach(inject(function ($injector) {
      httpMock = $injector.get('$httpBackend');
      authService = $injector.get('AuthService');
    }));

    describe('isAuthenticated', function () {
      describe('When User is authenticated', function () {
        it('Should return the name of the user', function () {
          var user;
          var response = { user: 'janbaer' };

          httpMock.expectGET('/auth/user').respond(200, JSON.stringify(response));

          authService.getAuthenticatedUser()
            .then(function (data) {
              user = data;
            });

          httpMock.flush();

          expect(user).not.toBeUndefined();
          expect(user).toEqual('janbaer');
        });
      });

      describe('When User is not authenticated', function () {
        it('Should return the name of the user', function () {
          var user;
          var response = {};

          httpMock.expectGET('/auth/user').respond(200, JSON.stringify(response));

          authService.getAuthenticatedUser()
            .then(function (data) {
              user = data;
            });

          httpMock.flush();

          expect(user).toBeUndefined();
        });
      });
    });


    describe('logout', function () {
      describe('When user is authenticated', function () {
        it('Should return ok', function () {
          var answer;

          httpMock.expectDELETE('/auth/user').respond(200, 'Ok');

          authService.logout()
            .then(function (data) {
              answer = data;
            });

          httpMock.flush();

          expect(answer).toEqual('Ok');
        });
      });
      describe('When user is not authenticated', function () {
        it('Should return also ok', function () {
          var answer;

          httpMock.expectDELETE('/auth/user').respond(200, 'Ok');

          authService.logout()
            .then(function (data) {
              answer = data;
            });

          httpMock.flush();

          expect(answer).toEqual('Ok');
        });
      });
    });
  });
})();


