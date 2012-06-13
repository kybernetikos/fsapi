// Useful copying functionality
function mixin(destination, source) {
	for (var property in source) {
		destination[property] = source[property];
	}
}

function array(arraylike) {
	return Function.prototype.call.bind(Array.prototype.slice).apply(null, arguments);
}