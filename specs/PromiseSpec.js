describe("A Promise,", function() {
	var promise;

	beforeEach(function() {
		promise = new Promise();
	});
	
	it("if it has once been resolved, should not resolve or reject again.", function() {
		var results = [];
		var errors = [];
		
		promise.then(function(val){
			results.push(val);
		}, function(val) {
			errors.push(val);
		});
		
		var response = promise.resolve("first");
		
		expect(response).toBe(true);
		expect(results.length).toBe(1);
		expect(results[0]).toBe("first");
		expect(errors.length).toBe(0);
		
		response = promise.resolve("second");
		
		expect(response).toBe(false);
		expect(results.length).toBe(1);
		expect(results[0]).toBe("first");
		expect(errors.length).toBe(0);

		response = promise.reject("err");
		
		expect(response).toBe(false);
		expect(results.length).toBe(1);
		expect(results[0]).toBe("first");
		expect(errors.length).toBe(0);
	});
	
	it("if it has once been rejected, should not resolve or reject again.", function() {
		var results = [];
		var errors = [];
		
		promise.then(function(val){
			results.push(val);
		}, function(val) {
			errors.push(val);
		});
		
		var response = promise.reject("err1");
		
		expect(response).toBe(true);
		expect(results.length).toBe(0);
		expect(errors.length).toBe(1);
		expect(errors[0]).toBe("err1");
		
		response = promise.resolve("second");
		
		expect(response).toBe(false);
		expect(results.length).toBe(0);
		expect(errors.length).toBe(1);
		expect(errors[0]).toBe("err1");

		response = promise.reject("err");
		
		expect(response).toBe(false);
		expect(results.length).toBe(0);
		expect(errors.length).toBe(1);
		expect(errors[0]).toBe("err1");
	});
	
	it("if it is already resolved, should still trigger actions passed to .then.", function() {
		promise.resolve("done");
		var resolveOut = null;
		var errOut = null;
		promise.then(function(val) {resolveOut = val}, function(val) {errOut = val});
		
		expect(resolveOut).toBe("done");
		expect(errOut).toBe(null);
	});

	it("when .then is called, it returns a Promise which resolves with the return value of the passed function.", function() {
		var finalResult = null;
		var returnedPromise = promise.then(function(x, y){return x + y;});
		returnedPromise.then(function(result) {finalResult = result;});
		
		promise.resolve(10, 4);
		
		expect(returnedPromise instanceof Promise).toBe(true);
		expect(finalResult).toBe(14);
	});
});
	
