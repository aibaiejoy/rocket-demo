;(function($){
	/** 
	* 格式化整数 
	* @param number:number 要格式化的整数 
	* @param fmt:string 整数格式 
	*/ 

	function formatNumber(number, fmt) { 
		number = number + ''; 
		if (fmt.length > number.length) { 
			return fmt.substring(number.length) + number; 
		} 
		return number; 
	}
	/** 
	* 格式化日期为字符串表示 
	* @param datetime:Date 要格式化的日期对象 
	* @param format:String 日期格式 
	*/ 
	$.formatDate = function(datetime, format){
		if(String(datetime).length < 13){
			datetime = datetime * 1000;
		}
		var datetime = new Date(Number(datetime));

		var cfg = { 
			MMM : ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'], 
			MMMM : ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'] 
		}, 
		
		values = { 
			y : datetime.getFullYear(), 
			M : datetime.getMonth(), 
			d : datetime.getDate(), 
			H : datetime.getHours(), 
			m : datetime.getMinutes(), 
			s : datetime.getSeconds(), 
			S : datetime.getMilliseconds() 
		}; 
		/*用正则表达式拆分日期格式各个元素*/ 
		var elems = format.match(/y+|M+|d+|H+|m+|s+|S+|[^yMdHmsS]/g); 
		//将日期元素替换为实际的值 
		for (var i = 0; i < elems.length; i++) { 
			if(cfg[elems[i]]) { 
				elems[i] = cfg[elems[i]][values[elems[i].charAt(0)]]; 
			} else if (values[elems[i].charAt(0)]) { 
				elems[i] = formatNumber(values[elems[i].charAt(0)], elems[i].replace(/./g, '0')); 
			} 
		}
		return elems.join(''); 	

	}

	//add scrollTop(value) 1.1 , current vision is 1.0;
	$.fn.scrollTop = function(value){
		if (!this.length) return;
		var hasScrollTop = 'scrollTop' in this[0];
		if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset;
		return this.each( hasScrollTop ?
			function(){ this.scrollTop = value } :
			function(){ this.scrollTo(this.scrollX, value) });
	}

	Array.prototype.inArray = function(item, arr){
		for (var i = 0; i < this.length; i++) {
			if( this[i] == item ){
				return i;
			} 
		}
		return -1;
	}

})(Zepto);