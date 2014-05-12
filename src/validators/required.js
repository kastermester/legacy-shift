Shift.Validators.required = function(value, params){
	if(utils.isEmptyValue(value)){
		throw params.errorMessage || 'Field is required';
	}
};
