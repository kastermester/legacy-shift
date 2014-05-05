var gulp = require('gulp');
var path = require('path')

var concat = require('gulp-concat');
var validatorFiles = ['required.js', 'minlength.js', 'longerthan.js'].map(function(f){
	return path.join('validators', f);
});
var editorFiles = ['text.js'].map(function(f){
	return path.join('editors', f);
});
var presenterFiles = ['text.js'].map(function(f){
	return path.join('presenters', f);
});
var files = ['wrap_begin.js', 'utils.js', 'templatehelper.js', 'promise.js', 'validator.js', 'editor.js', 'presenters.js'].concat(
	validatorFiles, editorFiles, presenterFiles,
	['label.js', 'title.js', 'validationclassstatus.js', 'form.js', 'presenter.js', 'wrap_end.js']
);

gulp.task('build', function(){
	return gulp.src(files.map(function(e){ return path.join('src', e); }))
	  .pipe(concat('shift.js'))
	  .pipe(gulp.dest('js'));
});

gulp.task('watch', function(){
	gulp.watch(['src/**/*.js'], ['build']);
});

gulp.task('default', ['build', 'watch']);
