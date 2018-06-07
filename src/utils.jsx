var utils = (Shift.utils = {
	async: {
		whenAll: function(promises) {
			return Promise.all(promises);
		},
		awaitAll: function(promises) {
			return new Promise((resolve, reject) => {
				Promise.all(
					promises.map(promise => {
						if (Shift.utils.isPromise(promise)) {
							return new Promise(resolveInner => {
								promise.then(
									r => {
										resolveInner({ value: r, failed: false });
									},
									e => {
										resolveInner({ value: e, failed: true });
									}
								);
							});
						} else {
							return { value: promise, failed: false };
						}
					})
				).then(
					results => {
						const values = results.map(result => result.value);
						const failed = results.findIndex(result => result.failed) >= 0;
						if (failed) {
							reject(values);
						} else {
							resolve(values);
						}
					},
					err => {
						console.error('This should never fail: ', err);
						reject(Array(promises.length));
					}
				);
			});
		},
	},
	isEmptyValue: function(value) {
		if (value == null) {
			return true;
		}

		if (value === '') {
			return true;
		}

		if (value instanceof Array && value.length == 0) {
			return true;
		}

		return false;
	},
	extend: function() {
		var dst = arguments[0];

		for (var i = 1, n = arguments.length; i < n; i++) {
			var obj = arguments[i];
			for (var key in obj) {
				dst[key] = obj[key];
			}
		}

		return dst;
	},
	bind: function() {
		if (arguments.length < 2) {
			throw new Error('Shift.utils.bind must be called with 2 or more parameters');
		}

		var fn = [arguments[0]];
		var args = arguments.slice(1);

		if (typeof fn != 'function') {
			throw new Error('Shift.utils.bind: first argument must be a function');
		}

		return function() {
			Function.call.apply(fn.concat(args).concat(arguments));
		};
	},
	nextTick: function(fn) {
		if (typeof process != 'undefined') {
			process.nextTick(fn);
		} else {
			setTimeout(fn, 0);
		}
	},
	isPromise: function(obj) {
		if (obj == null) {
			return false;
		}

		return typeof obj.then == 'function';
	},
	makePromise: function(obj, isFaulty) {
		return new Promise((resolve, reject) => {
			if (isFaulty) {
				reject(obj);
			} else {
				resolve(obj);
			}
		});
	},
	ensurePromise: function(fn) {
		try {
			var result = fn();
			if (utils.isPromise(result)) {
				return result;
			}
			return utils.makePromise(result, false);
		} catch (err) {
			return utils.makePromise(err, true);
		}
	},
	mergeClassNames: function() {
		args = arguments;
		classNames = {};
		for (var i = 0, n = args.length; i < n; i++) {
			classes = args[i].split(' ');
			for (var j = 0, m = classes.length; j < m; j++) {
				if (classes[j].length == 0) {
					continue;
				}
				classNames[classes[j]] = true;
			}
		}
		return Object.keys(classNames).join(' ');
	},
	maybeAppendErrorClassNames: function(className, errorClassName, isValid) {
		var result = [];
		if (typeof className == 'string' && className.length > 0) {
			result.push(className);
		}

		if (typeof errorClassName == 'string' && errorClassName.length > 0 && !isValid) {
			result.push(errorClassName);
		}

		return result.join(' ');
	},
	unwrapEditor: function(editor) {
		if (typeof editor == 'string') {
			return Shift.Editors[editor];
		}

		return editor;
	},
	unwrapPresenter: function(presenter) {
		if (typeof presenter == 'string') {
			return Shift.Presenters[presenter];
		}

		return presenter;
	},
	getIn: function(val, key) {
		if (val == null) {
			return;
		}

		if (Object.hasOwnProperty.call(val, key)) {
			return val[key];
		}

		var keys = key.split('.');

		var ret = val[keys[0]];

		if (ret == null) {
			return;
		}

		keys.splice(0, 1);

		if (keys.length > 0) {
			return utils.getIn(ret, keys.join('.'));
		}

		return ret;
	},
});
