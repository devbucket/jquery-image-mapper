"use strict";

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				sourceMap: true,
				compress: {
					drop_console: true,
					drop_debugger: true
				},
				banner: '/* <%= pkg.title %> - v<%= pkg.version %>\n' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
				' * <%= grunt.template.today("yyyy-mm-dd") %>\n' +
				' */'
			},
			minify : {
				files: {
					'jquery.image-mapper.min.js': ['jquery.image-mapper.js']
				}
			}
		}
	});

	grunt.registerTask('default', ['uglify']);
};