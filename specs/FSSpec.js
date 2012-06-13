describe("Exercising the filesystem api:,", function() {
	
	var whenRunningFromAServer = it;
	if (location.protocol == "file:") {
		whenRunningFromAServer = xit;
	}
	
	whenRunningFromAServer("should correctly create and then read a file.", function() {
		var fileContent = null;
		var error = null;
		waitsFor(function() {
			return fileContent != null || error != null;
		}, "FAILED TO COMPLETE", 10000);
		
		var fs = FS.request(TEMPORARY, 1024*1024*1);
		fs.seq(
			FS.getFile("/bob.txt", true),
			FS.write("Hello!"),
			fs,
			FS.getFile("/bob.txt"),
			FS.read()
		).then(function(content) {
			fileContent = content;
		}, function(err) {
			error = err;
		});
		
		runs(function() {
			expect(error).toBe(null);
			expect(fileContent).toBe("Hello!");
		})
	});
});