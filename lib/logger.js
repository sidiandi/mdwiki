'use strict';

var path = require('path'),
    winston = require('winston');

var MAX_FILE_SIZE = 1 * 1048576; // Max size in bytes of the logfile, if the size is exceeded then a new file is created.

var logfile = path.join(__dirname, '../logs/logfile.log');

var level = 'info';

if (process.env.NODE_ENV === 'production') {
  level = 'warn';
}

module.exports = new winston.Logger({
  transports: [
    new winston.transports.Console({ raw: false, colorize: true, level: 'info' }),
    new winston.transports.File({ filename: logfile, level: level, maxsize: MAX_FILE_SIZE, maxFiles: 10, colorize: true })
  ]
});
