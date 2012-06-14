var FS = (function(){
	return {
		TEXT: "text",
		DATAURL: "dataurl",
		ARRAYBUFFER: "arraybuffer",
		request: function(type, size) {
			var promise = new Promise();
			var storageInfo = window.StorageInfo || window.webkitStorageInfo;
			var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
			function requestFS(bytes) {
				requestFileSystem.call(window, type, bytes, promise.resolver, promise.rejecter);
			}
			if (type === PERSISTENT) {
				storageInfo.requestQuota(PERSISTENT, size, requestFS, promise.rejecter);
			} else {
				requestFS(this.size);
			}
			return promise;
		},
		getFile: function(filename, create) {
			return function(fs) {
				var promise = new Promise();
				if (create !== true) create = false;
				fs.root.getFile(filename, {create: create}, promise.resolver, promise.rejecter);
				return promise;
			};
		},
		getDir: function(filename, create) {
			return function(fs) {
				if (filename.isDirectory) return Promise.wrap([filename]);
				var promise = new Promise();
				function createDir(pathElements, parent) {
					if (pathElements.length == 0) {
						promise.resolve(parent);
					} else if (pathElements[0] == "" || pathElements[0] == ".") {
						createDir(pathElements.slice(1), parent);
					} else {
						parent.getDirectory(pathElements[0], {create: true}, createDir.bind(null, pathElements.slice(1)), promise.rejector);
					}
				}
				
				if (create === true) {
					createDir(filename.split("/"), fs.root);
				} else {
					fs.root.getDirectory(filename, {create: false}, promise.resolver, promise.rejecter);
				}
				return promise;
			};
		},
		get: function(filename) {
			return function(fs) {
				var promise = new Promise();
				var filePromise = FS.getFile(filename)(fs);
				filePromise.then(
					promise.resolver,
					function(err) {
						promise.resolve(FS.getDir(filename)(fs));
					}
				);
				return promise;
			}
		},
		list: function(dirEntry) {
			if (dirEntry.root) dirEntry = dirEntry.root;
			var promise = new Promise();
			var reader = dirEntry.createReader();
			var resultsSoFar = [];
			function readEntries(results) {
				if (results.length === 0) {
					promise.resolve(resultsSoFar);
				} else {
					resultsSoFar.push.apply(resultsSoFar, array(results));
					reader.readEntries(readEntries, promise.rejecter);
				}
			};
			reader.readEntries(readEntries, promise.rejecter);
			return promise;
		},
		spider: function(rootdir) {
			if (rootdir.root) rootdir = rootdir.root;
			var result = {};
			var listPromise = FS.list(rootdir);
			return listPromise.then(function(entryArray) {
				var result = {".": rootdir};
				var dependencies = [];
				for (var i = 0, len = entryArray.length; i < len; ++i) {
					(function(entry) {
						if (entry.isFile) {
							result[entry.name] = entry;
						} else {
							// recurse....
							dependencies.push(FS.spider(entry).then(function(spideredDir) {
								result[entry.name] = spideredDir;
								result[entry.name][".."] = rootdir;
							}));
						}
					})(entryArray[i]);
				}
				if (dependencies.length > 0) return Promise.all.apply(null, dependencies).then(result);
				return result;
			});
		},
		write: function(content, append) {
			return function(entry) {
				var promise = new Promise();
				entry.createWriter(function(fileWriter) {
					fileWriter.onwriteend = promise.resolver;
					fileWriter.onerror = promise.rejecter;
					
					var type = null;
					if (typeof content == 'function') {
						content = content();
					}
					if (typeof content == 'string') {
						type = 'text/plain';
					}
					if (content instanceof Blob == false) {
						var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
						var bb = new BlobBuilder();
						if (content instanceof Array) {
							for (var i = 0; i < content.length; ++i) {
								bb.append(content[i]);
							}
						} else {
							bb.append(content);
						}
						content = bb;
					}
					if (append === true) {
						 fileWriter.seek(fileWriter.length);
					}
					fileWriter.write(content.getBlob(type));
				}, promise.rejecter);
				return promise;
			}
		},
		read: function(type) {
			return function(entry) {
				var promise = new Promise();
			    // Get a File object representing the file,
			    // then use FileReader to read its contents.
			    entry.file(function(file) {
			       var reader = new FileReader();
			       reader.onloadend = function() {
			         promise.resolve(reader.result, file);
			       };
			       var thisfiletype = type;
			       if (thisfiletype == null) {
			    	   var mimeParts = file.type.split("/");
			    	   var major = mimeParts[0];
			    	   var minor = mimeParts[1];
			    	   if (major == "text") {
			    		   thisfiletype = FS.TEXT;
			    	   } else if (major == "application") {
			    		   switch (minor) {
			    		   case	"rtf":
			    		   case "ecmascript":
			    		   case "javascript":
			    		   case "json":
			    		   case "xhtml+xml":
			    		   case "xml-dtd":
			    			   thisfiletype = FS.TEXT;
			    			   break;
			    		   default:
			    			   thisfiletype = FS.ARRAYBUFFER;
			    		   }
			    	   } else {
			    		   thisfiletype = FS.ARRAYBUFFER;
			    	   }
			       }
			       if (thisfiletype == FS.TEXT) {
			    	   reader.readAsText(file);
			       } else if (thisfiletype == FS.DATAURL) {
			    	   reader.readAsDataURL(file);
			       } else if (thisfiletype == FS.ARRAYBUFFER) {
			    	   reader.readAsArrayBuffer(file);
			       } else {
			    	   promise.reject("File type should be one of text, arraybuffer, dataurl, was "+thisfiletype, file);
			       }
			    }, promise.rejecter);
			    return promise;
			 };
		},
		remove: function(entry) {
			var promise = new Promise();
			if (entry.isDirectory) {
				entry.removeRecursively(promise.resolver, promise.rejecter);
			} else {
				entry.remove(promise.resolver, promise.rejecter);
			}
			return promise;
		},
		getParent: function(childEntry) {
			var promise = new Promise();
			childEntry.getParent(promise.resolver, promise.rejecter);
			return promise;
		},
		rename: function(newName) {
			return function(sourceEntry, passedNewName) {
				var promise = new Promise();
				var destDirPromise = FS.getParent(sourceEntry);
				destDirPromise.then(
					function(destDir) {
						sourceEntry.moveTo(destDir, newName || passedNewName, promise.resolver, promise.rejecter);
					}, promise.rejecter
				);
				return promise;
			}
		},
		move: function(destination, newName) {
			return function(sourceEntry, passedDest, passedNewName) {
				var promise = new Promise();
				if (destination != null) {
					destDirPromise = FS.get(destination)(sourceEntry.filesystem);
				} else {
					destDirPromise = Promise.wrap(passedDest);
				}

				destDirPromise.then(
					function(destDir) {
						sourceEntry.moveTo(destDir, newName || passedNewName, promise.resolver, promise.rejecter);
					}, promise.rejecter
				)
				return promise;
			}
		},
		copyTo: function(destination, newName) {
			return function(sourceEntry, passedDest, passedNewName) {
				var promise = new Promise();
				if (destination != null) {
					destDirPromise = FS.get(destination)(sourceEntry.filesystem);
				} else {
					destDirPromise = Promise.wrap(passedDest);
				}

				destDirPromise.then(
					function(destDir) {
						sourceEntry.copyTo(destDir, newName || passedNewName, promise.resolver, promise.rejecter);
					}, promise.rejecter
				)
				return promise;
			}
		}
	};
})();