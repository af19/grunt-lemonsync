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
  var download = require('download-git-repo');
  var clone = require('git-clone');


  grunt.registerMultiTask('lemonsync', 'A grunt plugin for working on LemonStand themes locally.', function() {
    
    var done = this.async();
    
    var lsTask = this;
    
    var userOptions = this.options({
      access_token: '',
      store_host: '',
      theme_api_code: '',
      download_repository: '',
      clone_repository: false
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
    
    // clone(userOptions.theme_repository, process.cwd(), function(err) {
    //   if (err) {
    //     throw err;
    //   }


    var awsKey;
    var awsSecret;
    var awsToken;
    var bucket;
    var store;
    

    var request = https.request(httpsOptions, (res) => {

      res.on('data', (d) => {

        awsKey = JSON.parse(d).data.key;
        awsSecret = JSON.parse(d).data.secret;
        awsToken = JSON.parse(d).data.token;
        bucket = JSON.parse(d).data.bucket;
        store = JSON.parse(d).data.store;
    
        aws.config.update({accessKeyId: awsKey, secretAccessKey: awsSecret, sessionToken: awsToken});
        
        listObjects(bucket + '/' + store + '/themes/' + userOptions.theme_api_code + '/theme.yaml');

      });
    });

    request.on('error', (e) => {
      console.error(e);
    });

    
    request.end();
    
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
        var uploadBucket = bucket + '/' + store + '/themes/' + userOptions.theme_api_code;
        var s3PathUpload = normalizePath(file);
        
        s3.putObject({
          Bucket: uploadBucket,
          Key: s3PathUpload,
          Body: fileStream,
          CacheControl: 'no-cache',
          ContentType: mime.lookup(file) || 'application/octet-stream',
        }, function (err, data) {
          
          function s3Copy(file) {
            var s3CopyObject = new aws.S3();
      
            s3CopyObject.copyObject({
              Bucket: bucket + '/' + store + '/themes/' + userOptions.theme_api_code,
              CopySource: bucket + '/' + store + '/themes/' + userOptions.theme_api_code + '/' + file,
              Key: file,
              CacheControl: 'no-cache',
              ContentType: mime.lookup(file),
              MetadataDirective: 'REPLACE'
            });
          }
          
          if (err) { 
            throw new Error('Error in s3Upload function -> ' + err);
          } else {
            grunt.log.oklns('Uploaded... '+file);
            // s3Copy(file);
            // done();
          }
        });
      });
    }
        
    function s3Head(file) {
      var getObjectHead = new aws.S3();
      var s3PathCheck = normalizePath(file);
      
      getObjectHead.headObject({
        Bucket: bucket + '/' + store + '/themes/' + userOptions.theme_api_code,
        Key: s3PathCheck
      }, function (err, data) {
        if (err) {
          s3Upload(file);
        } else {
          var lastModifiedRemote = new Date(data.LastModified);
          var statLocal = fs.statSync(file);
          var lastModifiedLocal = new Date(statLocal.mtime);

          if (lastModifiedLocal.getTime() > lastModifiedRemote.getTime()) {
            s3Upload(file);
            
          }
        }
      });
    }
        
    function downloadRepo(repo) {
      download(repo, process.cwd() + '/theme', function(err) {
        if (err) {
          throw err;
        } else {
          checkFiles();
        }
      });
    }
    
    function checkFiles() {
      lsTask.files.forEach(function(file) {
        for (var i = 0; i < file.src.length; i++) {
          if (grunt.file.isFile(file.src[i])) {
            s3Head(file.src[i]);
          }
        }
      });
    }
    
    function listObjects(repo) {
      var s3List = new aws.S3();
      s3List.listObjectsV2({
        Bucket: repo
      }, function(err, data) {
        if (err.statusCode !== 200) {
          grunt.log.oklns('Downloading theme repository...');
          downloadRepo(userOptions.theme_repository);
        } else {
          checkFiles();
        }
      });
    }
    
    function normalizePath(file) {
      return file.replace('theme/', '');
    }
    
    
    
  });

};
