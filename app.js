'use strict';

var express = require("express"),
    path = require('path');

var routes = require("./routes");


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

app.get('/', routes.index);
//app.get('/users', user.list);


var port = app.get('port');

app.listen(port);

console.log('Listening on port %s', port);