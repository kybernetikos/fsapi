fsapi
=====

*wrapping the insanity of the HTML5 FileSystem API*

It's been a long time coming, but now javascript can read and write to files, almost like a proper programming language.  The [html5rocks guide](http://www.html5rocks.com/en/tutorials/file/filesystem/) has a good description of the API, and you can read more directly at [the w3c spec](http://www.w3.org/TR/file-system-api/).  It's currently supported pretty much only on [Chrome](http://caniuse.com/#feat=filesystem), although there are plans to implement it elsewhere too.

The FileSystem API is asynchronous, so you'll notice quickly from the [html5rocks guide](http://www.html5rocks.com/en/tutorials/file/filesystem/) that even simple tasks involve many many levels of nesting of callbacks to get them sequenced correctly.  Take a look at this piece of code to create a file and then list all the files in the root folder:

```javascript
window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
  window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
}, errorHandler);

function onInitFs(fs) {
  fs.root.getFile('log.txt', {create: true}, function(fileEntry) {
	    fileEntry.createWriter(function(fileWriter) {

	      fileWriter.onwriteend = function(e) {
	        
	    		function listResults(entries) {
	    			// finished!  Output the directory entries
	    			console.log(entries);
	    		};

	    		var dirReader = fs.root.createReader();
	    		var entries = [];

	    		// Call the reader.readEntries() until no more results are returned.
    		  var readEntries = function() {
    		     dirReader.readEntries (function(results) {
    		      if (results.length < 1) {
    		        listResults(entries.sort());
    		      } else {
    		        entries.push.apply(entries, results);
    		        readEntries();
    		      }
    		    }, errorHandler);
    		  };

    		  readEntries(); // Start reading dirs.
	      };

	      fileWriter.onerror = errorHandler;

	      // Create a new Blob and write it to log.txt.
	      var bb = new WebKitBlobBuilder();
	      bb.append('Hello FileSystem API');
	      fileWriter.write(bb.getBlob('text/plain'));

	    }, errorHandler);
  }, errorHandler);
}

function errorHandler(err) {
	console.log("ERROR", err);
}
```

While this code can be tidied up a little, compare it with the bash commands to do the same thing:

```sh
echo Hello FileSystem API > log.txt
ls
```
    
There's quite a difference in length and complexity.  You may not have noticed because some of it is split out, but by the time we get to the listResults function and the end of the task, we are 5 levels deep, mainly in closures.

Here's the equivalent code using this library:

```javascript
var fs = FS.request(window.PERMANENT, 1024*1024);
fs.seq(
	FS.getFile("log.txt", true),
	FS.write("Hello FileSystem API"),
	fs,
	FS.list
).then(function(entries) {
	// we're done!
	console.log(entries);
}, function(err) {
	console.log("ERROR", err);
});
```

It's still not as simple as the bash code, but the nesting has been turned into sequential calls, and this gives us the power to compose and reuse pieces of functionality much more easily.

 * Get the code from the [Project Page on Github](https://github.com/kybernetikos/fsapi).
 * See this description page [on Github](http://kybernetikos.github.com/fsapi/).
 * Read about the [Monad design pattern](http://kybernetikos.com/2012/07/10/design-pattern-wrapper-with-composable-actions/) at [my blog](http://kybernetikos.com).
 * Check the [Jasmine Specs on Github](http://kybernetikos.github.com/fsapi/specs/).
 * If you're running this locally, you can also see the [Jasmine Specs here](specs).