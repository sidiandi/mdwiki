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


var ContentFolderExistsError = function (msg, folderPath) {
  ContentFolderExistsError.super_.call(this, msg, this.constructor);
  this.folderPath = folderPath || 'No path specified';
};
util.inherits(ContentFolderExistsError, AbstractError);
ContentFolderExistsError.prototype.name = 'ContentFolderExistsError';



exports.FileNotFoundError = FileNotFoundError;
exports.ContentFolderExistsError = ContentFolderExistsError;



