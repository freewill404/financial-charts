var gulp = require('gulp'),
    gulpif = require('gulp-if'),
    clean = require('gulp-clean'),
    browserSync = require('browser-sync'),
    reloadMe = require('browser-sync').reload,
    imageMin = require('gulp-imagemin'),
    sourcemaps = require('gulp-sourcemaps'),
    ngAnnotate = require('gulp-ng-annotate'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    stylus = require('gulp-stylus'),
    cssMin = require('gulp-minify-css'),
    nib = require('nib'),
    es = require('event-stream'),
    merge = require('event-stream').concat;

var publicDir = __dirname + '/public',
    publicImgDir = __dirname + '/public/img';

var concatAppJS = function(minifyMe) {
    var stream = gulp.src([
            './assets/scripts/App.js',
            './assets/scripts/**/*.js'
        ])
        .pipe(gulpif(minifyMe, ngAnnotate()))
        .pipe(sourcemaps.init())
        .pipe(babel());

    stream.on('error', function() {
        console.log('Error parsing JS!');
    });

    return stream
        .pipe(concat('app.js'))
        .pipe(gulpif(minifyMe, uglify()))
        .pipe(gulp.dest(publicDir));
};
var concatVendorJS = function(minifyMe) {
    return gulp.src([
        './bower_components/jquery/dist/jquery.js',
        './bower_components/highcharts-release/highcharts.js',
        './bower_components/angular/angular.js'
    ])
        .pipe(concat('vendor.js'))
        .pipe(gulpif(minifyMe, uglify()))
        .pipe(gulp.dest(publicDir));
};
var concatCSS = function(minifyMe) {
    return gulp.src([
        './app/styles/reset.styl',
        './app/styles/main.styl'
    ])
        .pipe(stylus({use: [nib()]}))
        .pipe(concat('app.css'))
        .pipe(gulpif(minifyMe, cssMin()))
        .pipe(gulp.dest(publicDir))
        .pipe(reloadMe({stream:true}));
};
var copyStuff = function() {
    return gulp.src('./assets/img/**/*', { base: './app' })
        .pipe(filterEmptyDirs())
        .pipe(gulp.dest(publicDir));
};

//removes empty dirs from stream
var filterEmptyDirs = function() {
    return es.map(function (file, cb) {
        if (file.stat.isFile()) {
            return cb(null, file);
        } else {
            return cb();
        }
    });
};

var minifyImages = function() {
    return gulp.src(publicImgDir+'/**/*')
        .pipe(imageMin())
        .pipe(gulp.dest(publicImgDir));
};

//opens up browserSync url
var syncMe = function() {
    browserSync({
        proxy: 'localhost:8000',
        open: false
    });
};

//cleans build folder
gulp.task('clean', function() {
    console.log('Cleaning:', publicDir);
    return gulp.src(publicDir, { read: false })
        .pipe(clean());
});

//build + watching, for development
gulp.task('default', ['clean'], function() {
    gulp.watch(['./assets/scripts/**/*.js'], function() {
        console.log('File change - concatAppJS()');
        concatAppJS()
            .pipe(reloadMe({stream:true}));
    });
    gulp.watch('./app/styles/**/*.styl', function() {
        console.log('File change - concatCSS()');
        concatCSS();
    });
    gulp.watch(['./assets/img/**/*'], function() {
        console.log('File change - copyStuff()');
        copyStuff()
            .pipe(reloadMe({stream:true}));
    });
    gulp.watch(['./app/views/**/*'], function() {
        console.log('File change - templates');
        reloadMe();
    });

    return merge(copyStuff(), concatCSS(), concatAppJS(), concatVendorJS())
        .on('end', function() {
            syncMe();
        });
});

gulp.task('watch', ['default'], function() {
    gulp.watch(['./assets/scripts/**/*.js'], function() {
        console.log('File change - concatAppJS()');
        concatAppJS()
            .pipe(reloadMe({stream:true}));
    });
    gulp.watch('./app/styles/**/*.styl', function() {
        console.log('File change - concatCSS()');
        concatCSS();
    });
    gulp.watch(['./assets/img/**/*'], function() {
        console.log('File change - copyStuff()');
        copyStuff()
            .pipe(reloadMe({stream:true}));
    });
});

//production build task
gulp.task('build', ['clean'], function() {
    return merge(copyStuff(), concatCSS(true), concatAppJS(true), concatVendorJS(true))
        .on('end', function() {
            minifyImages();
        });
});
