'use strict';

var path = require('path'),
    winston = require('winston');

var logfile = path.join(__dirname, '../logs/logfile.log');

var level = 'info';

if (process.env.NODE_ENV === 'production') {
  level = 'warn';
}

module.exports = new winston.Logger({
  transports: [
    new winston.transports.Console({ raw: false, colorize: true, level: level }),
    new winston.transports.File({ filename: logfile, level: level })
  ]
});
