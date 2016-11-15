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
      // Local theme files go here.
    },
  },
});
```

### Options

#### options.access_token (required)
Type: `String`

The LemonStand Access Token. You can load it via JSON as shown in the [example](#basic-usage-examples) (remember to store your token in a secure place and exclude it from commits).

#### options.store_host (required)
Type: `String`

The domain name of your LemonStand store. E.G. `my-store.lemonstand.com`.

#### options.theme_api_code (required)
Type: `String`

A unique code to identify your theme in LemonStand's backend. The code can contain only Latin symbols, digits and the hyphen symbol. 

#### options.theme_repository (required)
Type: `String`

The git repository to clone the theme from. A `/theme` directory will be added to to your project. 

#### options.clean (optional)
Type: `String`
Values:
- `local` - replaces local theme files with store theme files
- `remote` - deletes theme files from store that do not exist locally

You can use a flag to indicate whether you'd like to traget the local or remote theme.
E.G. `grunt --clean=local`


### Basic Usage Examples

In this example, the LemonStand Access Token is loaded via a JSON file.

```JSON
{
  "lsAccessToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "lsStore": "my-store.lemonstand.com"
}
```

```js
grunt.initConfig({

  lsConfig: grunt.file.readJSON('lemonstand-config.json'),

  var target = grunt.option('clean') || false;

  lemonsync: {
      options: {
        access_token: '<%= lsConfig.lsAccessToken %>',
        store_host: '<%= lsConfig.lsStore %>',
        theme_api_code: 'my-first-custom-theme',
        theme_repository: 'https://github.com/lemonstand/ls2-theme-zest',
        clean: target
      },
      src: [
        'theme/content/**', 
        'theme/pages/**', 
        'theme/partials/**', 
        'theme/resources/**', 
        'theme/templates/**', 
        'theme/theme.yaml'
      ]
    }
});
```

## Release History
* 2016-11-14   v1.3.0   Download modified files from LS store
* 2016-10-11   v1.2.1   Bug fixes
* 2016-10-10   v1.2.0   Performance improvements
* 2016-10-10   v1.1.0   Clone themes from git repository
* 2016-09-06   v1.0.0   Download and install themes from git repository
* 2016-09-04   v0.1.2   Added MIME type detection
* 2016-09-04   v0.1.1   Updated package.json
* 2016-09-04   v0.1.0   First release