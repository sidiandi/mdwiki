'use strict';

function encode(input) {
  return new Buffer(input).toString('base64');
}

function decode(base64) {
  return new Buffer(base64, 'base64').toString();
}

module.exports.encode = encode;
module.exports.decode = decode;
