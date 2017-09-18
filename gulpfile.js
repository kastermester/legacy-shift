var gulp = require('gulp');
var path = require('path');
var react = require('gulp-react');

var concat = require('gulp-concat');
var validatorFiles = ['required.jsx', 'minlength.jsx', 'longerthan.jsx'].map(function(f) {
	return path.join('validators', f);
});
var editorFiles = ['text.jsx', 'textarea.jsx'].map(function(f) {
	return path.join('editors', f);
});
var presenterFiles = ['text.jsx'].map(function(f) {
	return path.join('presenters', f);
});
var files = [
	'wrap_begin.js',
	'utils.jsx',
	'templatehelper.jsx',
	'promise.jsx',
	'validator.jsx',
	'mixins.jsx',
	'editor.jsx',
	'presenters.jsx',
].concat(validatorFiles, editorFiles, presenterFiles, [
	'label.jsx',
	'title.jsx',
	'validationclassstatus.jsx',
	'form.jsx',
	'presenter.jsx',
	'wrap_end.js',
]);

gulp.task('build', function() {
	return gulp
		.src(
			files.map(function(e) {
				return path.join('src', e);
			})
		)
		.pipe(concat('shift.jsx'))
		.pipe(gulp.dest('js'))
		.pipe(react({ harmony: true }))
		.on('error', function(e) {
			console.warn(e.message);
			console.warn(e.stack);
		})
		.pipe(gulp.dest('js'));
});

gulp.task('watch', function() {
	gulp.watch(['src/**/*.jsx'], ['build']);
});

gulp.task('default', ['build', 'watch']);
