Shift.Validator = function(validateFunction, params, deps) {
	if (deps instanceof Object) {
		this.dependencies = deps;
	} else {
		this.dependencies = {};
	}

	this.id = Shift.Validator.nextId++;

	if (typeof validateFunction == 'string' && typeof Shift.Validators[validateFunction] == 'function') {
		validateFunction = Shift.Validators[validateFunction];
	}

	if (typeof validateFunction != 'function') {
		throw new TypeError(
			'validateFunction must be a function or the name of a function that exists in Shift.Validators'
		);
	}

	this.validate = function(value, dependencies) {
		return validateFunction(value, params || {}, dependencies);
	};
};
Shift.Validator.nextId = 0;

Shift.Validators = {};
