var Promise = (function(){
	
	// A promise is like a future, but instead of providing its value via a .get, you give it a callback
	// to execute when it is ready by calling .then(callback, errback).  A nice feature is that if it is
	// already completed when you add your callback with .then, your callback will be called immediately.
	
	// It's better than just using callbacks because they can be chained without disappearing into a million
	// levels of nesting.
	
	// NICE TO HAVE: cancel and progress
	// DEVIATIONS: these promises can be fulfilled only once, but you can call resolve multiple times
	//				the first call to resolve with a nonpromise or the first required promise that fulfills
	//				will fulfills this promise too.

	function Promise() {
		Emitter.call(this);
		this.state = Promise.UNRESOLVED;
		this.values = null;
		this.resolver = this.resolve.bind(this);
		this.rejecter = this.reject.bind(this);
	}
	// Inherit from Emitter
	Promise.prototype = Object.create(Emitter.prototype);
	// Methods
	mixin(Promise.prototype, {
		resolve: function(promise) {
			if (this.state === Promise.UNRESOLVED) {
				if (promise instanceof Promise && promise != this) {
					promise.then(function() {
						this.resolve.apply(this, arguments);
					}.bind(this), function() {
						this.reject.apply(this, arguments);
					}.bind(this));
					return true;
				} else {
					this.values = array(arguments);
					this.state = Promise.RESOLVED;
					this.emit.bind(this,"resolved").apply(this, this.values);
					// clear down the listeners so they can be garbage collected if necessary.
					this._listeners = [];
					return true;
				}
			}
			return false;
		},
		reject: function() {
			if (this.state === Promise.UNRESOLVED) {
				this.values = array(arguments);
				this.state = Promise.REJECTED;
				this.emit.bind(this,"rejected").apply(this, this.values)
				// clear down the listeners so they can be garbage collected if necessary.
				this._listeners = [];
				return true;
			}
			return false;
		},
		then: function(onResolve, onReject) {
			var pipelined = new Promise();
			
			function whenResolved() {
				var result = onResolve;
				if (typeof onResolve == 'function') {
					result = onResolve.apply(null, array(arguments));
				}
				if (result === undefined) {
					pipelined.resolve.apply(pipelined, array(arguments));
				} else {
					pipelined.resolve(result);
				}
			}
			
			function whenRejected() {
				var result = onReject;
				if (typeof onReject === 'function') {
					result = onReject.apply(null, array(arguments));
				}
				if (result === undefined) {
					pipelined.reject.apply(pipelined, array(arguments));
				} else {
					pipelined.reject(result);
				}
			}
			
			if (this.state === Promise.RESOLVED) {
				whenResolved.apply(this, this.values);
			} else if (this.state == Promise.REJECTED) {
				whenRejected.apply(this, this.values);
			} else {
				this.on("resolved", whenResolved);
				this.on("rejected", whenRejected);
			}
			
			return pipelined;
		},
		// Equivalent to a chain of .thens
		seq: function() {
			var lastPromise = this;
			for (var i = 0, len = arguments.length; i < len; ++i) {
				lastPromise = lastPromise.then(arguments[i]);
			}
			return lastPromise;
		}
	});
	// "statics"
	mixin(Promise, {
		// Possible states of a promise
		UNRESOLVED: "UNRESOLVED",
		RESOLVED: "RESOLVED",
		REJECTED: "REJECTED",

		// resolves to an array containing all the fulfillments of the passed promises
		// or rejects if any of the passed promises reject.
		all: function() {
			var combined = new Promise();
			var values = [];
			var waitingFor = arguments.length;
			var args = arguments;
			for (var i = 0, len = args.length; i < len; ++i) {
				(function(i) {
					var promise = args[i];
					promise.then(
							function() {
								values[i] = array(arguments);
								if (--waitingFor < 1) {
									combined.resolve.apply(combined, values);
								}
							}, combined.rejecter);
				})(i);
			}
			return combined;
		},

		// Makes a promise that immediately resolves to the passed values
		// unless the passed value is a single promise, in which case, it just returns it.
		wrap: function(args) {
			if (args.length == 1 && args[0] instanceof Promise) {
				return args[0];
			}
			var promise = new Promise();
			promise.resolve.apply(promise, args);
			return promise;
		},
		// Does the same as the first dependency to resolve or reject
		first: function() {
			var combined = new Promise();
			var args = arguments;
			for (var i = 0, len = args.length; i < len; ++i) {
				combined.resolve(args[i]);
			}
			return combined;
		},
		// Only rejects if all dependencies reject
		any: function() {
			var combined = new Promise();
			var args = arguments;
			var toResolve = args.length;
			for (var i = 0, len = args.length; i < len; ++i) {
				args[i].then(combined.resolver, function() {
					if (-- toResolve == 0) {
						combined.reject.apply(combined, arguments);
					}
				});
			}
			return combined;
		}
	});
	
	return Promise;
})();