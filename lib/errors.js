'use strict';

var util = require('util');

var AppError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Error';
};
util.inherits(AppError, Error);
AppError.prototype.name = 'Abstract Error';

var FileNotFoundError = function (msg, fileName) {
  FileNotFoundError.super_.call(this, msg, this.constructor);
  this.fileName = fileName || 'No filename specified';
};
util.inherits(FileNotFoundError, AppError);
FileNotFoundError.prototype.name = 'FileNotFoundError';


var ContentFolderExistsError = function (msg, folderPath) {
  ContentFolderExistsError.super_.call(this, msg, this.constructor);
  this.folderPath = folderPath || 'No path specified';
};
util.inherits(ContentFolderExistsError, AppError);
ContentFolderExistsError.prototype.name = 'ContentFolderExistsError';

var ContentFolderNotExistsError = function (msg, folderPath) {
  ContentFolderNotExistsError.super_.call(this, msg, this.constructor);
  this.folderPath = folderPath || 'No path specified';
};
util.inherits(ContentFolderNotExistsError, AppError);
ContentFolderNotExistsError.prototype.name = 'ContentFolderNotExistsError';



exports.FileNotFoundError = FileNotFoundError;
exports.ContentFolderExistsError = ContentFolderExistsError;
exports.ContentFolderNotExistsError = ContentFolderNotExistsError;



