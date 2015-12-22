/** 
 * @file load.js
 * @desc 加载资源并缓存到localstorage中，下一次直接从缓存中提取执行
 */

(function(undefined) {
	var appcatch = window.localStorage,
		rmatch = /([^.\-]*)\.(\w*)/,
		guid = 1,
		resources = [],
		errorInfo;

	function createRequest(url, type, cb, timeout) {
		var xhr = new XMLHttpRequest(),
			obj = {
				xhr: xhr,
				ready: false
			},
			timer;

		url += '?t=' + Date.now();
	 	xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
        	if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        		if (xhr.readyState === 4) {
        			clearTimeout(timer);
        			var res = xhr.responseText;
        			cb(res, obj);
        		} 
        	} 
        }; 
        xhr.send(null);  
        timer = setTimeout(function() {
        	xhr.abort();
        	errorInfo('timeout to load file :' + url);
        }, timeout || 30000);	

        if(type == 'js'){
        	obj.order = guid++;
        	resources.push(obj);
        }

        return obj;
	}

	function execResources(type) {
		while (resources.length) {
			var obj = resources[0];
			if(!obj || !obj.ready || !obj.text) return;
			obj = resources.shift();
			execFile(obj.text, type);
		}
	}

	function execFile(text, type) {
		var head = document.head || document.getElementsByTagName('head')[0],
			node;
		if (type == 'css') {
			node = document.createElement('style');
			node.type = "text/css";
			node.innerHTML = text;
			head.appendChild(node);
		} else {
			node = document.createElement('script');
			node.innerHTML = text;
			head.insertBefore(node, head.firstChild);
		}
	}

	function checkCatch(key, version) {
		var num = appcatch[key + '-n'];
		return num !== undefined && num == version ? true : false;
	}

	function setCatch(key, version, text){
		try {
			appcatch[key + '-n'] = version;
			appcatch[key + '-v'] = text;
		} catch (e) {}
	}

	function getCatch(key){
		return {
			text: appcatch[key + '-v'],
			version: appcatch[key + '-n']
		};
	}

	errorInfo = function(e) {
		if (this.errorInfo) this.errorInfo(e);
		else throw new Error(e);
	}

	this.load = function(pathes, timeout) { 
		if (typeof pathes == 'string') pathes = [pathes];
		pathes.forEach(function(path) {
			if (typeof path == 'object') {
				var version = path.version;
				path = path.url;
			}

			var file = path.split('/').pop(),
				matches = rmatch.exec(file),
				key, type;

			try{
				key = matches[1];
				type = matches[2].toLowerCase();
				version = version || 0;

				if (checkCatch(key, version)) {
					var cache = getCatch(key);
					if (type == 'css') execFile(cache.text, type);
					else {
						// js资源添加到队列中
						resources.push({
							ready: true,
							text: cache.text
						});
						execResources(type);
					}
				} else{
					var cb = function(res, obj){
						obj.ready = true;
						obj.text = res;
						setCatch(key, version, res);
						type == 'css' ? execFile(res, type) : execResources(type);
					};
					createRequest(path, type, cb, timeout);
				} 
			}catch(e){
				errorInfo(e);
			}
		});
	}

}).call(this);
