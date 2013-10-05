'use strict';

describe('Page Service tests', function () {
  var httpMock;
  var pageService;

  beforeEach(function () {
    module('mdwiki');
    module('mdwiki.services');
  });

  beforeEach(inject(function ($injector) {
    httpMock = $injector.get('$httpBackend');
    pageService = $injector.get('PageService');
  }));

  it('should fetch the requested page over the reset api', function () {
    var actualHtml,
        expectedHtml = '<h1>Test</h1>';

    httpMock.expectGET('/api/page/index').respond(200, expectedHtml);

    pageService.getPage('index')
      .then(function (data) {
        actualHtml = data;
      }, function (error) {

    });

    httpMock.flush();

    expect(actualHtml).not.toBeUndefined();
    expect(actualHtml).toEqual(expectedHtml);
  });

  it('should return an error when the page doesnt exists', function () {
    var actualHtml,
        lastError;

    httpMock.expectGET('/api/page/index').respond(404);

    pageService.getPage('index')
      .then(function (data) {
        actualHtml = data;
      }, function (error) {
        lastError = error;
      });

    httpMock.flush();

    expect(actualHtml).toBeUndefined();
    expect(lastError).not.toBeUndefined();
    expect(lastError.code).not.toBeUndefined();
    expect(lastError.code).toEqual(404);
  });

  it('should return all existing pages', function () {
    var expected = [ { name: 'Page1' }, { name: 'Page2' }],
        actual;

    httpMock.expectGET('/api/pages').respond(200, expected);

    pageService.getPages()
      .then(function (data) {
        actual = data;
      }, function (error) {

    });

    httpMock.flush();
    expect(actual).not.toBeUndefined();
    expect(actual.length).toEqual(expected.length);
  });

});



