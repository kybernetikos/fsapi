// An op is a function that returns a promise.  It's suitable for passing to 'then'.
var Op = (function(){
	return {
		seq: function() {
			var actions = array(arguments);
			return function() {
				var literalPromise = Promise.wrap(arguments);
				var lastPromise = literalPromise;
				for (var i = 0, len = actions.length; i < len; ++i) {
					lastPromise = lastPromise.then(actions[i]);
				}
				return lastPromise;
			}
		},
		parSeq: function () {
			var actions = array(arguments);
			return function(arr) {
				function valueSequence(val) {
					var promise = Promise.wrap([val])
					return promise.seq.apply(promise, actions);
				}
					
				return Promise.all.apply(null, arr.map(valueSequence));
			};
		},
		iff: function(attribute, equal, op) {
			return function(obj) {
				var promise = Promise.wrap(arguments);
				var result = promise;
				if (obj[attribute] == equal) {
					result = promise.then(op);
				}
				return result;
			}
		},
		log: function(id) {
			return function() {
				console.log.bind(console, id).apply(console, arguments);
				return Promise.wrap(arguments);
			}
		},
		args: function(inArgs, outArgs) {
			var srcArgMap = []
			for (var i = 0, len = outArgs.length; i < len; ++i) {
				var idx = inArgs.indexOf(outArgs[i]);
				srcArgMap[i] = idx;
			}
			return function() {
				var result = [];
				for (var i = 0, len = srcArgMap.length; i < len; ++i) {
					var srcIdx = srcArgMap[i];
					if (srcIdx < 0) {
						result[i] = outArgs[i];
					} else {
						result[i] = arguments[srcIdx];
					}
				}
				return Promise.wrap(result);
			}
		}
	};
})();
