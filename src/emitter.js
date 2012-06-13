var Emitter = (function(){
	// Minimal event emitter.
	// Listeners can register with .on and removed with .remove
	// Events can be emitted with .emit
	function Emitter() {
		this._listeners = {};
	}
	Emitter.prototype = Object.create(Object.prototype);
	mixin(Emitter.prototype, {
		on: function(evtName, callee) {
			if (typeof evtName !== 'string') throw new Error("on: Illegal Argument: Event name must be a string, was "+evtName);
			if (typeof callee !== 'function') throw new Error("on: Illegal Argument: callee must be a function, was "+callee);
			var listeners = this._listeners[evtName] || (this._listeners[evtName] = []);
			listeners.push(callee);
		},
		remove: function(evtName, callee) {
			if (typeof evtName !== 'string') throw new Error("remove: Illegal Argument: Event name must be a string, was "+evtName);
			if (typeof callee !== 'function') throw new Error("remove: Illegal Argument: callee must be a function, was "+callee);
			var listeners = this._listeners[evtName] || [];
			var idx = listeners.indexOf(callee);
			if (idx >= 0) listeners.splice(idx, 1);
		},
		emit: function(evtName) {
			if (typeof evtName !== 'string') throw new Error("emit: Illegal Argument: Event name must be a string, was "+evtName);
			var args = array(arguments, 1);
			(this._listeners[evtName] || []).forEach(function(callee) {
				callee.apply(this, args);
			}.bind(this));
		}
	});

	return Emitter;
})();

