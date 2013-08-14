'use strict';

var util = require('util');

var AbstractError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Error';
};

util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'Abstract Error';

var FileNotFoundError = function (msg, fileName) {
  FileNotFoundError.super_.call(this, msg, this.constructor);
  this.FileName = fileName || 'No filename specified';
};

util.inherits(FileNotFoundError, AbstractError);

FileNotFoundError.prototype.name = 'FileNotFoundError';

exports.FileNotFoundError = FileNotFoundError;



