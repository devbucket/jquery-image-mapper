"use strict";

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		banner: '/* <%= pkg.title %> v<%= pkg.version %> - <%= pkg.homepage %>\n' +
			' * <%= pkg.description %>\n' +
			' * \n' +
			' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
			' * Licensed under the <%= pkg.license %> license\n' +
			' * <%= grunt.template.today("yyyy-mm-dd") %>\n' +
			' */\n',
		concat: {
			options: {
				separator: '\n\n',
				stripBanners: false,
				banner: '<%= banner %>\n'
			},
			dist: {
				src: ['build/overlaps.js', 'build/image-mapper.js'],
				dest: 'build/jquery.image-mapper.js'
			}
		},
		uglify: {
			max: {
				options: {
					compress: false,
					banner: '<%= banner %>\n',
					beautify: true,
					mangle: false
				},
				files: {
					'jquery.image-mapper.js': ['build/jquery.image-mapper.js']
				}
			},
			min: {
				options: {
					compress: {
						drop_console: true,
						drop_debugger: true
					},
					banner: '<%= banner %>',
					mangle: true
				},
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