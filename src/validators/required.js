Shift.Validators.required = function(value, params){
	if(utils.isEmptyValue(value)){
		throw new Error(params.errorMessage || 'Field is required');
	}
};
