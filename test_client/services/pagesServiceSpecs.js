(function () {
  'use strict';

  describe('PageService spec', function () {
    var httpMock;
    var pageService;

    beforeEach(function () {
      module('mdwiki');
      module('mdwiki.services');
    });

    beforeEach(inject(function ($injector) {
      httpMock = $injector.get('$httpBackend');
      pageService = $injector.get('PageService');

      var settingsService = $injector.get('SettingsService');
      spyOn(settingsService, 'get').andReturn({ provider: 'github', githubUser: 'janbaer', githubRepository: 'wiki', url: 'janbaer/wiki' });
    }));

    describe('When the page exists and the user dont specifies markdown as format', function () {
      it('should fetch the requested page over the rest api as html', function () {
        var actualHtml,
            expectedHtml = '<h1>Test</h1>';

        httpMock.expectGET('/api/janbaer/wiki/page/index').respond(200, expectedHtml);

        pageService.getPage('index')
          .then(function (data) {
            actualHtml = data;
          }, function (error) {

        });

        httpMock.flush();

        expect(actualHtml).not.toBeUndefined();
        expect(actualHtml).toEqual(expectedHtml);
      });
    });


    describe('When the user needs the page content in markdown format', function () {
      it('should return the requested page as markdown', function () {
        var actual,
            expected = '#1Test';

        httpMock.expectGET('/api/janbaer/wiki/page/index?format=markdown').respond(200, expected);

        pageService.getPage('index', 'markdown')
          .then(function (data) {
            actual = data;
          }, function (error) {

        });

        httpMock.flush();

        expect(expected).not.toBeUndefined();
        expect(expected).toEqual(expected);
      });
    });

    describe('When the user wants to updated the content of the current page', function () {
      it('Should send the markdown to the server and return status code 200 with the new html', function () {
        var actualHtml,
            expectedHtml = '<h1>Test</h1>';

        httpMock.expectPUT('/api/janbaer/wiki/page/index').respond(200, expectedHtml);

        pageService.savePage('index', 'commitMessage', '#Test')
          .then(function (data) {
            actualHtml = data;
          }, function (error) {

        });

        httpMock.flush();

        expect(actualHtml).not.toBeUndefined();
        expect(actualHtml).toEqual(expectedHtml);
      });
    });

    describe('When the page not exists', function () {
      it('should return an error', function () {
        var actualHtml,
            lastError;

        httpMock.expectGET('/api/janbaer/wiki/page/index').respond(404);

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
    });

    describe('When user wants to get all page names', function () {
      it('should return all existing pages', function () {
        var expected = [ { name: 'Page1' }, { name: 'Page2' }],
            actual;

        httpMock.expectGET('/api/janbaer/wiki/pages').respond(200, expected);

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


    describe('FindStartPagesTests', function () {
      describe('When pages contains a index.md', function () {
        it('Should return index', function () {
          var pages = [ { name: 'index'}, {name: 'home'}, {name: 'readme'} ];
          var startPage = pageService.findStartPage(pages);
          expect(startPage).toEqual('index');
        });
      });
      describe('When pages contains a home.md but not the index.md', function () {
        it('Should return home', function () {
          var pages = [ { name: 'home'}, {name: 'readme'} ];
          var startPage = pageService.findStartPage(pages);
          expect(startPage).toEqual('home');
        });
      });
      describe('When pages contains a README.md but not the index.md or home.md', function () {
        it('Should return readme', function () {
          var pages = [ { name: 'README'} ];
          var startPage = pageService.findStartPage(pages);
          expect(startPage).toEqual('README');
        });
      });
      describe('When contains no start page', function () {
        it('Should return an empty string', function () {
          var pages = [{name: 'Page1'}];
          var startPage = pageService.findStartPage(pages);
          expect(startPage).toEqual('');
        });
      });
    });
  });
})();





