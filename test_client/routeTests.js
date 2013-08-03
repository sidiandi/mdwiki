describe('Index page', function() {

  beforeEach(function() {
  });


  it('should redirect index.html to http://localhost:3000/#/', function() {
    browser().navigateTo('http://localhost:3000/');

    expect(browser().location().url()).toBe('/#');
  });
 });
