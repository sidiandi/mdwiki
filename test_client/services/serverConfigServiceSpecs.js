'use strict';

describe('ServerConfigService spec', function () {
  var httpMock;
  var service;

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.services');
  });

  beforeEach(inject(function ($injector) {
    httpMock = $injector.get('$httpBackend');
    service = $injector.get('ServerConfigService');
  }));

  it('should fetch the requested page over the reset api', function () {
    var actual,
        expected = {providers: ['github']};

    httpMock.expectGET('/api/serverconfig').respond(200, '{"providers": ["github"]}');

    service.getConfig()
      .then(function (data) {
        actual = data;
      }, function (error) {

    });

    httpMock.flush();

    expect(actual).not.toBeUndefined();
    expect(actual).toEqual(expected);
  });
});
