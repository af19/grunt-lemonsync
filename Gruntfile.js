/*
 * grunt-lemonsync
 * https://github.com/ubuntu/workspace
 *
 * Copyright (c) 2016 Amir Farzan
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        'tasks/src/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    
    babel: {
      options: {
        sourceMap: true,
        presets: ['babel-preset-es2015']
      },
      dist: {
        files: {
          'tasks/lemonsync.js': 'tasks/src/lemonsync-src.js'
        }
      }
    },

    // Configuration to be run (and then tested).
    lsToken: grunt.file.readJSON('lemonstand-token.json'),
    
    lemonsync: {
      options: {
        access_token: '<%= lsToken.lsAccessToken %>',
        store_host: 'rdu.lemonstand.com',
        theme_api_code: 'coastal-20161011-1144',
        theme_repository: 'https://github.com/lemonstand/lscloud-theme-coastal',

      },
      src: ['theme/content/**', 'theme/pages/**', 'theme/partials/**', 'theme/resources/**', 'theme/templates/**', 'theme/theme.yaml']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-babel');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'babel', 'lemonsync']);

};
