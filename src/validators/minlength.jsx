Shift.Validators.minlength = function (value, params) {
	var defer = Shift.defer();
	setTimeout(function () {
		if (utils.isEmptyValue(value)) {
			return defer.resolve();
		}

		if (value.length < params.length) {
			return defer.reject(params.errorMessage || 'Minimum length: ' + params.length);
		}
		defer.resolve();
	}, 100);
	return defer.promise;
};
