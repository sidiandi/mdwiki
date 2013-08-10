'use strict';

var path = require('path'),
    winston = require('winston');

var logfile = path.join(__dirname, '../logs/logfile.log');

exports.logger = new winston.Logger({
  transports: [
    new winston.transports.Console({ raw: false, colorize: true, level: 'info' }),
    new winston.transports.File({ filename: logfile, level: "warn" })
  ]
});
