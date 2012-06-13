describe("An Emitter,", function() {
  var emitter;

  beforeEach(function() {
	  emitter = new Emitter();
  });

  describe("when a listener is listening to an event,", function() {
	  var called;
	  var args = null;
	  var listener;
	  
	  beforeEach(function() {
		 called = false;
		 listener = function() {
			 called = true;
			 args = arguments;
		 }
		 emitter.on("someevent", listener);
	  });
	 
	  it("should receive those events.", function() {
		 emitter.emit("someevent", 12, 10);
		 
		 expect(called).toBe(true);
		 expect(args[0]).toBe(12);
		 expect(args[1]).toBe(10);
	  });
	  
	  it("should not receive other events.", function() {
		 emitter.emit("someotherevent", 12, 10);
		 
		 expect(called).toBe(false);
	  });
  });
});