'use strict';

var express = require("express"),
    api = require('./api');

var routes = require("./routes"),
    path = require('path');


var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
//  app.set('views', __dirname + '/views');
//  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
};

//app.get('/', routes.index);
//app.get('/partials/:name', routes.partials);
//app.get('/users', user.list);

// JSON API
//app.get('/api/', api.index);
app.get('/api/:page?', api.index);

// redirect all others to the index (HTML5 history)
//app.get('*', routes.index);

var port = app.get('port');

app.listen(port);

console.log('Listening on port %s', port);
