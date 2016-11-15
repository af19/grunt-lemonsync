/*
 * grunt-lemonsync
 * https://github.com/ubuntu/workspace
 *
 * Copyright (c) 2016 Amir Farzan
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  var aws = require('aws-sdk');
  var fs = require('fs-extra');
  var https = require('https');
  var mime = require('mime-types');
  var clone = require('git-clone');
  var emoji = require('node-emoji');

  grunt.registerMultiTask('lemonsync', 'A grunt plugin for working on LemonStand themes locally.', function () {

    var done = this.async();

    var lsTask = this;

    var userOptions = this.options({
      access_token: '',
      store_host: '',
      theme_api_code: '',
      theme_repository: '',
      clean: false,
      region: 'us-east-1'
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

    var s3;
    var awsKey;
    var awsSecret;
    var awsToken;
    var bucket;
    var store;

    function normalizePath(file) {
      return file.replace('theme/', '');
    }

    // Uploads theme files to S3.
    function s3Upload(file) {
      var fileStream = fs.createReadStream(file);

      fileStream.on('error', function (err) {
        if (err) {
          throw new Error('fileStream() => \n' + err);
        }
      });

      fileStream.on('open', function () {

        var uploadBucket = bucket + '/' + store + '/themes/' + userOptions.theme_api_code;
        var s3ThemePath = normalizePath(file);

        s3.putObject({
          Bucket: bucket,
          Key: store + '/themes/' + userOptions.theme_api_code + '/' + s3ThemePath,
          Body: fileStream,
          CacheControl: 'no-cache',
          ContentType: mime.lookup(file) || 'application/octet-stream'
        }, function (err, data) {

          if (err) {
            throw new Error('s3.putObject() => \n' + err);
          } else {
            grunt.log.oklns(emoji.emojify(':arrow_up:  Uploaded... ' + file));
            // done();
          }
        });
      });
    }

    function checkFiles() {
      lsTask.files.forEach(function (file) {
        for (var i = 0; i < file.src.length; i++) {

          if (grunt.file.isFile(file.src[i])) {

            if (!grunt.file.exists(".ls-temp/" + file.src[i])) {
              grunt.file.write(".ls-temp/" + file.src[i], '');
              s3Upload(file.src[i]);
            } else {
              var tempStat = fs.statSync(".ls-temp/" + file.src[i]);
              var currentStat = fs.statSync(file.src[i]);
              var tempTime = new Date(tempStat.mtime);
              var currentTime = new Date(currentStat.mtime);
              if (currentTime.getTime() > tempTime.getTime()) {
                grunt.file.write(".ls-temp/" + file.src[i], '');
                s3Upload(file.src[i]);
              }
            }
          }
        }
      });
    }

    function cloneRepo(repo) {
      fs.removeSync('theme');
      clone(repo, process.cwd() + '/theme', function (err) {
        if (err) {
          throw new Error('cloneRepo() => \n' + err);
        } else {
          checkFiles();
        }
      });
    }

    function getAllObjects(key, save) {
      s3.getObject({
        Bucket: bucket,
        Key: key
      }, function (err, data) {
        if (err) {
          throw new Error('getAllObjects() => \n' + err);
        } else {
          fs.outputFile(save, data.Body, function (err) {
            if (err) {
              throw new Error('outputFile() => \n' + err);
            } else {
              grunt.log.oklns(emoji.emojify(':arrow_down:  ' + save));
            }
          });
        }
      });
    }

    function deleteObject(path, key) {
      s3.deleteObject({
        Bucket: bucket,
        Key: key
      }, function (err, data) {
        if (err) {
          throw new Error('deleteObject() => \n' + err);
        } else {
          grunt.log.oklns(emoji.emojify(':x:  Deleted... ' + path));
        }
      });
    }

    function getOrphans(path, key) {

      var orphanFile = true;

      lsTask.files.forEach(function (file) {
        for (var i = 0; i < file.src.length; i++) {
          if (grunt.file.isFile(file.src[i])) {
            var localThemePath = normalizePath(file.src[i]);
            if (localThemePath === path) {
              orphanFile = false;
            }
          }
        }
      });

      if (orphanFile) {
        deleteObject(path, key);
      }
    }

    function checkYaml() {
      s3.getObject({
        Bucket: bucket,
        Key: store + '/themes/' + userOptions.theme_api_code + '/theme.yaml'
      }, function (err, data) {
        if (err) {
          if (err.code === 'NoSuchKey') {
            grunt.log.oklns('Getting theme from repository and installing in your store...');
            cloneRepo(userOptions.theme_repository);
          } else {
            throw new Error('checkYaml() => \n' + err);
          }
        } else {
          checkFiles();
        }
      });
    }

    function listObjects(target) {
      s3.listObjectsV2({
        Bucket: bucket,
        Prefix: store + '/themes/' + userOptions.theme_api_code
      }, function (err, data) {
        if (err) {
          throw new Error('listObjects() => \n' + err);
        }

        var objectKey;

        if (target === 'local') {

          lsTask.files.forEach(function (file) {
            for (var i = 0; i < file.src.length; i++) {
              if (grunt.file.isMatch(["theme/content", "theme/pages", "theme/partials", "theme/resources", "theme/templates", "theme/theme.yaml"], file.src[i])) {
                grunt.file.delete(file.src[i]);
              }
            }
          });

          for (var i = 0; i < data.KeyCount; i++) {
            objectKey = data.Contents[i].Key;
            var saveLocation = "theme/" + objectKey.replace(store + '/themes/' + userOptions.theme_api_code + '/', '');
            if (saveLocation.indexOf('.git') === -1) {
              getAllObjects(objectKey, saveLocation);
            }
          }
        } else if (target === 'remote') {

          for (var j = 0; j < data.KeyCount; j++) {

            objectKey = data.Contents[j].Key;
            var remoteThemePath = objectKey.replace(store + '/themes/' + userOptions.theme_api_code + '/', '');

            getOrphans(remoteThemePath, objectKey);
          }
        }
      });
    }

    var request = https.request(httpsOptions, function (res) {

      res.on('data', function (d) {

        awsKey = JSON.parse(d).data.key;
        awsSecret = JSON.parse(d).data.secret;
        awsToken = JSON.parse(d).data.token;
        bucket = JSON.parse(d).data.bucket;
        store = JSON.parse(d).data.store;

        aws.config.update({
          accessKeyId: awsKey,
          secretAccessKey: awsSecret,
          sessionToken: awsToken,
          region: userOptions.region
        });

        s3 = new aws.S3();

        switch (userOptions.clean) {
          case false:
            {
              checkYaml();
              break;
            }
          case "local":
            {
              grunt.log.oklns("Replacing local theme with store theme...");
              listObjects("local");
              break;
            }
          case "remote":
            {
              grunt.log.oklns("Deleting store theme files that do not exist locally...");
              listObjects("remote");
              break;
            }
          default:
            {
              grunt.log.errorlns("Invalid command");
            }
        }
      });
    });

    request.on('error', function (e) {
      console.error(e);
    });

    request.end();
  });
};
//# sourceMappingURL=lemonsync.js.map
