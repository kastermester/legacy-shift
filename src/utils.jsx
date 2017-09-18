var utils = (Shift.utils = {
	async: {
		whenAll: function(promises) {
			if (!(promises instanceof Array)) {
				throw new Error('Shift.async.whenAll: first argument must be an array');
			}
			var result = promises.slice();
			var defer = Shift.defer();
			var totalDone = 0;
			var total = result.length;
			var promiseInResult = false;
			var checkDone = function() {
				if (total != totalDone) {
					return;
				}

				if (!promiseInResult) {
					return defer.resolve(result);
				}

				utils.async.whenAll(result).then(
					function(res) {
						defer.resolve(res);
					},
					function(err) {
						if (defer.promise.state == 'open') {
							defer.reject(err);
						}
					}
				);
			};
			for (var i in promises) {
				(function(i) {
					var promise = promises[i];
					if (!utils.isPromise(promise)) {
						result[i] = promise;
						totalDone++;
						return;
					}

					promise.then(
						function(res) {
							result[i] = res;
							totalDone++;
							if (utils.isPromise(res)) {
								promiseInResult = true;
							}

							checkDone();
						},
						function(err) {
							if (defer.promise.state == 'open') {
								defer.reject(err);
							}
						}
					);
				})(i);
			}

			checkDone();

			return defer.promise;
		},
		awaitAll: function(promises) {
			if (!(promises instanceof Array)) {
				throw new Error('Shift.async.whenAll: first argument must be an array');
			}
			var result = promises.slice();
			var defer = Shift.defer();
			var totalDone = 0;
			var total = result.length;
			var promiseInResult = false;
			var resolve = true;
			var checkDone = function() {
				if (total != totalDone) {
					return;
				}

				if (!promiseInResult) {
					if (resolve) {
						return defer.resolve(result);
					} else {
						return defer.reject(result);
					}
				}

				Shift.async
					.awaitAll(
						result.map(function(e) {
							if (utils.isPromise(e.result)) {
								return e.result;
							}
							return e;
						})
					)
					.then(
						function(res) {
							defer.resolve(res);
						},
						function(res) {
							defer.reject(res);
						}
					);
			};
			for (var i in promises) {
				(function(i) {
					var promise = promises[i];
					if (!utils.isPromise(promise)) {
						result[i] = { resolved: true, result: promise };
						totalDone++;
						return;
					}

					promise.then(
						function(res) {
							result[i] = { resolved: true, result: res };
							totalDone++;
							if (utils.isPromise(res)) {
								promiseInResult = true;
							}

							checkDone();
						},
						function(err) {
							if (utils.isPromise(err)) {
								result[i] = { resolved: true, result: err };
							} else {
								resolve = false;
								result[i] = { resolved: false, result: err };
							}
							totalDone++;
							checkDone();
						}
					);
				})(i);
			}

			checkDone();

			return defer.promise;
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
		var result;
		var defer = Shift.defer();

		if (isFaulty) {
			defer.reject(obj);
		} else {
			defer.resolve(obj);
		}

		return defer.promise;
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
