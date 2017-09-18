Shift.Validators.required = function(value, params) {
	if (utils.isEmptyValue(value)) {
		throw params.errorMessage || { en_US: 'Field is required', da_DK: 'Felt skal udfyldes' };
	}
};
