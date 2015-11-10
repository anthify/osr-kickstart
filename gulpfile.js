//These are all the dependencies of this gulp file
//Run npm install in your terminal to ensure they are on your computer
var gulp = require('gulp'), //gulp
	sass = require('gulp-sass'), //gulp sass compiler
	autoprefixer = require('gulp-autoprefixer'), //css autoprefixer
	imagemin = require('gulp-imagemin'), //image optimiser
	pngquant = require('imagemin-pngquant'), //png optimiser to work with imagemin
	mozjpeg = require('imagemin-mozjpeg'), //jpeg optimiser
	fs = require('fs'), //node.js file system module; it enables you to modify files on your computer
	jsdom = require('jsdom'), //jsdom provides a DOM api to node.js to manipulate html files
	runSequence = require('run-sequence'),
	mkdirp = require('mkdirp'),
	del = require('del'),
	browserSync = require('browser-sync').create(); //browser-sync automatically reloads the browser for you: MAGIC!



//This task compiles the sass from styles.scss and outputs it as styles.css
gulp.task('compile-sass', function() {
	return gulp.src('./src/scss/styles.scss')
	.pipe(sass())
	.pipe(gulp.dest('./dist/css'));
});


//This task prefixes all of the css once compile-sass task has completed
gulp.task('autoprefix', ['compile-sass'], function() {
	return gulp.src('./dist/css/styles.css')
	.pipe(autoprefixer())
	.pipe(gulp.dest('./dist/css/'));
});


//This task creates a server from the root directory
//It watches for changes in the css folder and index.html file
//When a change is detected it refreshes your browser
gulp.task('browser-sync', function() {
	browserSync.init({
			server: {
				baseDir: "./"
			}
		});
	gulp.watch(['./dist/css/**/*','./index.html']).on("change", browserSync.reload);
});


//This task watches ./src/scss/ folder and actions the autoprefix task when a change is detected
gulp.task('watch-files', function() {
	gulp.watch(['./src/scss/**/*'], ['autoprefix']);
});


//This task starts a chain of processes, starting at sass-correct>sass-deploy>deploy-sass-prep
//once that chain is complete it then autprefixes the css
gulp.task('deploy-css-init', ['sass-correct'], function() {
	return gulp.src('./dist/css/styles.css')
	.pipe(autoprefixer())
	.pipe(gulp.dest('./dist/css/'));
});


//This task returns to the styles.scss to it's original state with @import "reset.scss"; present
//But only when autoprefix, which also actions compile-sass, is complete
gulp.task('sass-correct', ['sass-deploy'], function() {
	setTimeout(function() {
	fs.readFile('./src/scss/styles.scss', 'utf8', function (err, data) {
		if (err) {
			return console.log(err)
		}
		var result = data.replace(/\/\//g, '');
		fs.writeFile('./src/scss/styles.scss', result, 'utf8', function (err) {
			if(err) return console.log(err);
			});
		}, 3000);
	});
});


//This task compiles the sass after deploy-sass-prep has completed
gulp.task('sass-deploy', ['deploy-sass-prep'], function() {
	setTimeout(function () {  
	return gulp.src('./src/scss/styles.scss')
	.pipe(sass())
	.pipe(gulp.dest('./dist/css'));
		}, 2000);
});


//This task comments outs the @import "reset.scss"; from your styles.scss file
gulp.task('deploy-sass-prep', function() {
    
	fs.readFile('./src/scss/styles.scss', 'utf8', function (err, data) {
		if (err) {
			return console.log(err)
		}
		var result = data.replace(/@import "_reset./g, '//@import "_reset.');
		fs.writeFile('./src/scss/styles.scss', result, 'utf8', function (err) {
			if(err) return console.log(err);
  			});
	});
});


//This task extracts relevant osr content from index.html and puts it into dist/index.html
gulp.task('deploy-html', function() {
	mkdirp('./dist/', function (err) {
	    if (err) console.error(err)
	    else console.log('dist path created');
	});
	jsdom.env(
	  './index.html',
	  ["http://code.jquery.com/jquery.js"],
	  function (err, window) {
	    var osr = window.$("body").html();
	   	osr = osr.replace('<script class="jsdom" src="http://code.jquery.com/jquery.js"></script>',' ');
	    fs.writeFile('./dist/index.html', osr, 'utf8', function (err) {
 			if (err) return console.log(err);
 			console.log('deploy-html complete');
			});
	  }
	);
});


//Image compression using imagemin but their jpg/jpeg compression isn't very good so we're using mozjpeg in the next task
gulp.task('img-shrink', ['jpg-shrink'], function () {
    return gulp.src(['./src/imgs/*.png','./src/imgs/*.svg'])
        .pipe(imagemin({
            progressive: false,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/imgs'));
});


//This is mozjpeg, simply change the quality to whatever you like but it is defaulted here to 75
gulp.task('jpg-shrink', function() {
	return gulp.src(['./src/imgs/*.jpeg', './src/imgs/*.jpg'])
        .pipe(mozjpeg({quality: '75'})())
        .pipe(gulp.dest('./dist/imgs'));
	});


gulp.task('clean', function() {
	del('dist');
});


//This task makes sure that compile-sass and autoprefix have be actioned when you first run gulp
gulp.task('init', ['autoprefix']);


//This is the default gulp command which can be actioned from terminal by writing: gulp
gulp.task('default', ['init', 'watch-files', 'browser-sync']);


//This is the deploy task that will get your take your css, html and images and place them in the dist folder.
//This is designed to be ran before you put your work into the Portal

gulp.task('deploy', function(callback) {
	runSequence('clean',['img-shrink'],'deploy-css-init','deploy-html', callback);
	});

