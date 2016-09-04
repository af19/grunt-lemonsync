# grunt-lemonsync

> A grunt plugin for working on LemonStand themes locally and pushing changes to stores.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-lemonsync --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-lemonsync');
```

## The "lemonsync" task

### Overview
In your project's Gruntfile, add a section named `lemonsync` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  lemonsync: {
    options: {
      // Options specific to your LemonStand store go here.
    },
    src: {
      // Local theme files and folders go here.
    },
  },
});
```

### Options

#### options.access_token (required)
Type: `String`

The LemonStand Access Token. You can load it via JSON as shown in the [example](#usage-examples) (remember to store your token in a secure place and exclude it from commits).

#### options.store_host (required)
Type: `String`

The domain name of your LemonStand store. E.G. `my-store.lemonstand.com`.

#### options.theme_api_code (required)
Type: `String`

The API code for the theme you want to upload to. 

### Usage Examples

In this example, the LemonStand Access Token is loaded via a JSON file.

```JSON
{
  "lsAccessToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

```js
grunt.initConfig({
  lsToken: grunt.file.readJSON('lemonstand-token.json'),
  lemonsync: {
      options: {
        access_token: '<%= lsToken.lsAccessToken %>',
        store_host: 'my-store.lemonstand.com',
        theme_api_code: 'bones'
      },
      src: ['content/**', 'pages/**', 'partials/**', 'resources/**', 'templates/**', 'theme.yaml']
    },
});
```

## Release History
* 2016-09-04   v0.1.1   Updated package.json
* 2016-09-04   v0.1.0   First release
