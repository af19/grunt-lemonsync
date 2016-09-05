/*
 * grunt-lemonsync
 * https://github.com/ubuntu/workspace
 *
 * Copyright (c) 2016 Amir Farzan
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  
  var aws = require('aws-sdk');
  var fs = require('fs');
  var https = require('https');
  var mime = require('mime-types');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('lemonsync', 'A grunt plugin for working on LemonStand themes locally.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var done = this.async();
    
    // Merge task-specific and/or target-specific options with these defaults.
    var userOptions = this.options({
      access_token: '',
      store_host: '',
      theme_api_code: ''
    });
    
    var httpsOptions = {
      headers: {
        'Authorization': 'Bearer ' + userOptions.access_token,
        'Content-Type': 'application/json'
      },
      hostname: userOptions.store_host,
      path: '/api/v2/identity/s3',
      method: 'POST'
    };

    var request = https.request(httpsOptions, (res) => {

      res.on('data', (d) => {

        var awsKey = JSON.parse(d).data.key;
        var awsSecret = JSON.parse(d).data.secret;
        var awsToken = JSON.parse(d).data.token;
        var bucket = JSON.parse(d).data.bucket;
        var store = JSON.parse(d).data.store;
    
        aws.config.update({accessKeyId: awsKey, secretAccessKey: awsSecret, sessionToken: awsToken});
      
        // Uploads theme files to S3.
        function s3Upload(file) {
          var fileStream = fs.createReadStream(file);
      
          fileStream.on('error', function (err) {
            
            if (err) { 
              throw err; 
            }
          });  

          fileStream.on('open', function () {
            var s3 = new aws.S3();
            
            s3.putObject({
              Bucket: bucket + '/' + store + '/themes/' + userOptions.theme_api_code,
              ContentType: mime.contentType(file),
              CacheControl: 'max-age=86400',
              Key: file,
              Body: fileStream
            }, function (err, data) {
              if (err) { 
                throw err; 
              } else {
                grunt.log.oklns('Uploaded... '+file);
                // done();
              }
            });
          });
        }
        
        // For each file, if doesn't exist in .ls-temp directory, write file name to .ls-temp directory and call S3 upload function.
        // If file exists, compare modification dates of current file to temp file, if current file is newer, repeat above.
        this.files.forEach(function(file) {
         
          for (var i = 0; i < file.src.length; i++) {
            if (grunt.file.isFile(file.src[i])) {

              if ( !grunt.file.exists(".ls-temp/"+file.src[i]) ) {
                grunt.file.write(".ls-temp/"+file.src[i], '');
                s3Upload(file.src[i]);
              } else {
                var tempStat = fs.statSync(".ls-temp/"+file.src[i]);
                var currentStat = fs.statSync(file.src[i]);
                var tempTime = new Date(tempStat.mtime);
                var currentTime = new Date(currentStat.mtime);
                if (currentTime > tempTime) {
                  grunt.file.write(".ls-temp/"+file.src[i], '');
                  s3Upload(file.src[i]);
                }
              }
            }
          }
        });
      });
    });

    request.on('error', (e) => {
      console.error(e);
    });

    request.end();
    
  });

};
