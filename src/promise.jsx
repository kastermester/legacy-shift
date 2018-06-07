Shift.Deferred = function() {
	this.resolve = null;
	this.reject = null;
	this.promise = new Promise((resolve, reject) => {
		this.resolve = resolve;
		this.reject = reject;
	});
};

Shift.defer = function() {
	return new Shift.Deferred();
};

Shift.Promise = Promise;
