// Copies everything from the source to the destination.
function mixin(destination, source) {
	for (var property in source) {
		destination[property] = source[property];
	}
}

// A version of [].slice that you can call directly
function array(arraylike) {
	return Function.prototype.call.bind(Array.prototype.slice).apply(null, arguments);
}