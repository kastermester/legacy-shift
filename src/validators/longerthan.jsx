Shift.Validators.longerThan = function(value, params, deps){
	if(value.length > deps.other.length){
		return;
	}
	throw params.errorMessage || 'Must be longer than other field';
};
