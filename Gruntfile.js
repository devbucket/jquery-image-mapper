"use strict";

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: '\n\n'
			},
			dist: {
				src: ['build/overlaps.js', 'build/image-mapper.js'],
				dest: 'jquery.image-mapper.js'
			}
		},
		uglify: {
			options: {
				sourceMap: true,
				compress: {
					drop_console: true,
					drop_debugger: true
				},
				banner: '/* <%= pkg.title %> v<%= pkg.version %> - <%= pkg.homepage %>\n' +
				' * <%= pkg.description %>\n' +
				' * \n' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
				' * Licensed under the <%= pkg.license %> license\n' +
				' * <%= grunt.template.today("yyyy-mm-dd") %>\n' +
				' */'
			},
			minify : {
				files: {
					'jquery.image-mapper.min.js': ['jquery.image-mapper.js']
				}
			}
		},
		watch: {
			files: ['build/*.js'],
			tasks: ['concat', 'uglify']
		}
	});

	grunt.registerTask('default', ['concat', 'uglify', 'watch']);
};