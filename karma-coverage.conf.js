'use strict';

var sharedConfig = require('./karma.conf.js');

module.exports = function (config) {
  sharedConfig(config);

  config.set({

    preprocessors: {
      'public/js/controllers/*.js': ['coverage'],
      'public/js/services/*.js': ['coverage'],
      'public/js/directives.js': ['coverage'],
      'public/js/app.js': ['coverage'],
    },

    reporters: ['dots', 'coverage'],

    coverageReporter: {
      type : 'html',
      dir : 'docs/generated'
    },
    browsers: ['PhantomJS'],
    autoWatch: false,
    singleRun: true
  });
};
