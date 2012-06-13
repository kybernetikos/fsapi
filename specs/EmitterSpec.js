describe("An Emitter,", function() {
	var emitter;

  beforeEach(function() {
	  emitter = new Emitter();
  });

  describe("when a listener is listening to some event,", function() {
	  var called;
	  var args = null;
	  var listener;
	  
	  beforeEach(function() {
		 called = 0;
		 listener = function() {
			 called++;
			 args = arguments;
		 }
		 emitter.on("some event", listener);
	  });
	 
	  it("and that event is emitted, it should receive that event complete with any passed arguments.", function() {
		 emitter.emit("some event", 12, 10);
		 
		 expect(called).toBe(1);
		 expect(args[0]).toBe(12);
		 expect(args[1]).toBe(10);
	  });
	  
	  it("should not receive other events.", function() {
		 emitter.emit("some other event");
		 expect(called).toBe(0);
	  });
	  
	  it("if it is removed, it should no longer receive events.", function() {
		 emitter.remove("some event", listener);
		 emitter.emit("some event");
		 expect(called).toBe(0);
	  });
	  
	  it("if it is listening twice, it should receive the event twice.", function() {
		 emitter.on("some event", listener);
		 emitter.emit("some event");
		 expect(called).toBe(2);
	  });
	  
  });
});