(function($){
	
	/*
	 * $.localStorage(key, value, time) 
	 *     key:    string | number 
	 *     value:  string | number |  object | array 
	 *     time:   number(unit:minutes)
	 * 
	 * $.localStorage('test') //get
	 * $.localStorage('test',123) //set
	 * $.localStorage('test',{value:123}) //set
	 * $.localStorage('test',{value:123}, 1) //set
	 * $.localStorage('test',null) //remove  
	 *  
	 */
	//判断函数 

    var tryStorage= function (l, s){
           var arg= arguments,
               _storage = l;
               try{
                   _storage.setItem('cache','test'); 
                   _storage.removeItem('cache'); 
               }catch(e){
                   try{
                       _storage.clear();                        
                       _storage.setItem('cache','test'); 
                       _storage.removeItem('cache'); 
                   }catch(e){
                       _storage = arg[1] ? arg.callee.apply(arg, [].slice.call(arg,1)) : false;
                   }
               }
               delete arg; 
               return _storage
        }; 

        // 分别尝试使用 localStorage和sessionStorage
    var _storage =  (function(){
            try{
                return tryStorage(localStorage, sessionStorage);
            }
            catch(e){
                return false; 
            }
        })();	

    var minutes =  1000*60,
		now = Date.now(),
		jsonReg=/^[\[{].+[\]}]$/,
    	resetCache = function(time){//定时清理
    		if(!_storage)
    			return ;
    		var expires, day= minutes*60*24;
    		time = time || 0;
    		if((expires=_storage.getItem('_expires')) && expires>now){
    			return false;
    		}
    		
    		var len= _storage.length,item,key,t;
    		for(var i=0; i<len; i++){
    			key= _storage.key(i);
    			item=_storage.getItem(key);
    			
    			if(item && item.indexOf('_expires')!=-1){
    				t=item.match(/_expires":(\d+)/)[1];
    				if(now<t){
    					continue;
    				}
    			}
    			_storage.removeItem(key);
    		}
    		
    		return _storage.setItem('_expires', day*time+ now);		//设置整个缓存的过期时间
    	}
  		
    	resetCache(15);	//15天检测一遍,定时清理垃圾数据
	
	
	addEventListener('error',function(e){
	    console.log(e,'错误事件');
	    if(/QUOTA_EXCEEDED_ERR/i.test(e.message)){
	        _storage.clear();
           alert('您的浏览器本地数据已经到达最大，已经帮您清空...');
	       location.reload();     
	    }
	},false);
	
	$.localStorage = function(name, value, time) {	
		if(!_storage)
			return false;
	    if(name===null)
	        _storage.clear();
	          
        if (typeof value != 'undefined') {	//set
        	
        	if(value===null){
        		return _storage.removeItem(name);
        	}
        	
        	if(!isNaN(+time)){
        		value = {value: value, _expires : now+time*minutes};
        	}
        	
        	_storage.setItem(name,$.isObject(value) ? JSON.stringify(value) : value);  
        	
        	return value.value || value;
        	
	     }else{		//get
	     
               var localValue = null,st,et;
               localValue = _storage.getItem(name);
                
               if(jsonReg.test(localValue)){
                   localValue = JSON.parse(localValue);
                   if($.isObject(localValue) && (et=localValue._expires)){
            			if(now > et){
    	        			_storage.removeItem(name);
    	        			localValue=null;
            			}else{
            				localValue=
            				   typeof (localValue =  localValue['value']) === 'string' && 
            				   jsonReg.test(localValue)  ? 
            				   JSON.parse(localValue) : 
            				   localValue;
            			}
            		} 
               }
               return localValue;
        }
	};


})(Zepto);



