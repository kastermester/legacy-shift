Shift.Deferred = function(){
	this.promise = new Shift.Promise();
};

Shift.Deferred.prototype.resolve = function(obj){
	this.promise.become(obj);
};

Shift.Deferred.prototype.reject = function(obj){
	this.promise.become(obj, true);
};

Shift.defer = function(){
	return new Shift.Deferred();
};

Shift.Promise = function(){
	this.fulfilledHandlers = [];
	this.rejectedHandlers = [];
	this.state = 'open';
};

Shift.Promise.prototype.become = function(obj, isRejected){
	if(this.state != 'open'){
		throw new Error("Promise cannot become anything unless it is in the open state");
	}
	if(utils.isPromise(obj)){
		var that = this;
		obj.then(function(res){
			that.become(res);
		}, function(res){
			that.become(res, true);
		});
	} else {
		this.state = isRejected ? 'rejected' : 'resolved';
		this.value = obj;

		this.runBoundHandlers();
	}
};

Shift.Promise.prototype.runBoundHandlers = function(){
	var handlers;
	if(this.state == 'resolved'){
		handlers = this.fulfilledHandlers;
	} else if(this.state == 'rejected'){
		handlers = this.rejectedHandlers;
	} else {
		throw new Error('Cannot call runBoundHandlers for a promise that is open');
	}
	var value = this.value;

	utils.nextTick(function(){
		for(var i in handlers){
			var handler = handlers[i];
			handler.call(undefined, value);
		}
	});
	this.fulfilledHandlers = null;
	this.rejectedHandlers = null;
}

Shift.Promise.prototype.then = function(onFulfilled, onRejected){
	var fulfill, reject;
	if(this.state == 'open'){
		fulfill = typeof(onFulfilled) == 'function';
		reject = typeof(onRejected) == 'function';
		if(fulfill || reject){
			var newPromise = new Shift.Promise();

			if(!fulfill){
				onFulfilled = function(obj){
					newPromise.become(obj);
				}
			} else {
				var origFulfill = onFulfilled;
				onFulfilled = function(obj){
					try {
						obj = origFulfill.call(undefined, obj);
						newPromise.become(obj);
					} catch(err){
						newPromise.become(err, true);
					}
				};
			}

			if(!reject){
				onRejected = function(obj){
					newPromise.become(obj, true);
				};
			} else {
				var origReject = onRejected;
				onRejected = function(obj){
					try {
						obj = origReject.call(undefined, obj);
						newPromise.become(obj);
					} catch (err){
						newPromise.become(err, true);
					}
				};
			}

			this.fulfilledHandlers.push(onFulfilled);
			this.rejectedHandlers.push(onRejected);
		}
		return this;
	} else {
		newPromise = new Shift.Promise();
		var value = this.value;
		var state = this.state;
		utils.nextTick(function(){
			var res = value;
			var faulty = state == 'rejected';
			if(state == 'resolved'){
				if(typeof(onFulfilled) == 'function'){
					try {
						res = onFulfilled.call(undefined, value);
					} catch(err){
						res = err;
						faulty = true;
					}
				}
			} else {
				if(typeof(onRejected) == 'function'){
					try {
						res = onRejected.call(undefined, value);
						faulty = false;
					} catch(err){
						res = err;
						faulty = true;
					}
				}
			}

			newPromise.become(res, faulty);
		});

		return newPromise;
	}
};

Shift.Promise.prototype.fail = function(onRejected){
	this.then(undefined, onRejected);
};
