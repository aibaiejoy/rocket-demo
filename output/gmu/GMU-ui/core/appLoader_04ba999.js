/** 
 * @file appLoader.js
 * @desc webapp资源加载器
 */

(function(undefined) {
	var appcatch = this.localStorage,
		json = this.JSON,
        docHead = document.head || document.getElementsByTagName('head')[0],
        isCached = !!document.documentElement.getAttribute('manifest'),
        isDebug = /DEBUG=1;/.test(document.cookie),
		url = 'http://bb-ikonw-test06.vm.baidu.com:8089/webapp';

    function forEach(obj, fn) {
        if (!obj && typeof obj != 'object') return;
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && fn(obj[key], key) == false) return;
        }
    }

	function errorInfo(e) {
		if (this.errorInfo) this.errorInfo(e);
		else throw new Error(e);
	}

    function getSum(data) {
        var sum = 0;
        forEach(data, function(item) {
            sum += item.hash[0].charCodeAt();
        });
        return sum;
    }

	function ajax(opts) {
		var xhr = new XMLHttpRequest(),
			method = 'GET',
			data = null,
            cb = opts.success || errorInfo,
			timer;

		if(opts.data){
			method = 'POST';
			data = opts.data;
		}

		xhr.open(method, opts.url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.onreadystatechange = function() {
			if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
				if (xhr.readyState === 4) {
					clearTimeout(timer);
					cb(json.parse(xhr.responseText));
				}
			}
		};
		xhr.send(data);
		timer = setTimeout(function() {
			xhr.abort();
			errorInfo('timeout to load file :' + url);
		}, opts.timeout || 30000);
	}

	function execFile(text, type) {
		var node;
        if (type == 1) {
            node = document.createElement('script');
            node.innerHTML = text;
            docHead.insertBefore(node, docHead.firstChild);
        } else {
            node = document.createElement('style');
            node.type = "text/css";
            node.innerHTML = text;
            docHead.appendChild(node);
        }
	}

    function addFile(name, type) {
        var path = url + '?type=proxy&name=' + name + '&DEBUG=1';
            node;
         if (type == 1) {
             node = document.createElement('script');
             node.src = path;
             docHead.insertBefore(node, docHead.firstChild);
         } else {
             node = document.createElement('link');
             node.rel = "stylesheet";
             node.href = path;
             docHead.appendChild(node);
         }
    }

    function loadFile(hash, sum, diff) {
        var data = 'hash=' + hash + '&sum=' + sum + (diff || '');
        ajax({
            url: url + '?type=data',
            data: data,
            success: savaFile
        });
    }

	function compareFile(ret, all){
        if (ret.path) { // debug，直接输出path列表
            forEach(ret.path, function(item) {
                addFile(item.name, item.type); //todo: config proxy path
            });
            return;
        }

        var data = ret.list,
            hash = write('appHash', ret.hash);

        if (all) { // 请求全部
            data = write('appData', json.stringify(data));
            loadFile(hash, '');
        } else if (data && data.length) {
            var diff = [],
                sum = getSum(data),
                old = read('appData'),
                key, isHas;
            forEach(data, function(item) {
                key = item.hash;
                isHas = false;
                forEach(old, function(oitem) {
                    if (oitem.hash == key) {
                        item.data = oitem.data;
                        isHas = true;
                        return false;
                    }
                });
                if (!isHas) diff.push('&diff[]=' + key);
            });
            write('appData',  json.stringify(data));
            loadFile(hash, sum, diff.join(''));
		} else { // 么有更新，执行缓存中的文件
			loadCache();
		}
	}

    function savaFile(ret) {
        var old = read('appData'),
            data = ret.list;
        // update data
        forEach(data, function(val, key) {
            forEach(old, function(item) {
                if (item.hash == key) item.data = val;
            });
        });
        write('appHash', ret.hash);
        loadCache(old);
    }

    function loadCache(data) {
        if (!data) data = read('appData');
        else write('appData', json.stringify(data));
        forEach(data, function(item) {
            execFile(item.data, item.type);
        });
    }

	function read(key) {
		var val = appcatch[key];
		return key == 'appData' && val ? json.parse(val) : val;
	}

	function write(key, val) {
        try {
            return appcatch[key] = val;
        } catch (e) {}
	}

	this.load = function(opts) {
		var hash = read('appHash'),
			data = read('appData');

        if (hash) {
            if (isCached) { // manifest, 需要先发一次请求
                data = 'hash=' + hash + '&sum=' + getSum(data);
                if (isDebug) data += '&DEBUG=1';
                ajax({
                    url: url + '?type=list',
                    data: data,
                    success: compareFile
                });
            } else compareFile(opts); // 页面可以刷新，比较传入数据即可
        } else compareFile(opts, true);
	};

}).call(this);