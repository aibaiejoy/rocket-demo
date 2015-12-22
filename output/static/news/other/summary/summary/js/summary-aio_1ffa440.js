/*! iScroll v5.1.3 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license */
(function (window, document, Math) {
var rAF = window.requestAnimationFrame	||
	window.webkitRequestAnimationFrame	||
	window.mozRequestAnimationFrame		||
	window.oRequestAnimationFrame		||
	window.msRequestAnimationFrame		||
	function (callback) { window.setTimeout(callback, 1000 / 60); };

var utils = (function () {
	var me = {};

	var _elementStyle = document.createElement('div').style;
	var _vendor = (function () {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;

		for ( ; i < l; i++ ) {
			transform = vendors[i] + 'ransform';
			if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
		}

		return false;
	})();

	function _prefixStyle (style) {
		if ( _vendor === false ) return false;
		if ( _vendor === '' ) return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	me.getTime = Date.now || function getTime () { return new Date().getTime(); };

	me.extend = function (target, obj) {
		for ( var i in obj ) {
			target[i] = obj[i];
		}
	};

	me.addEvent = function (el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	};

	me.removeEvent = function (el, type, fn, capture) {
		el.removeEventListener(type, fn, !!capture);
	};

	me.prefixPointerEvent = function (pointerEvent) {
		return window.MSPointerEvent ? 
			'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10):
			pointerEvent;
	};

	me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
		var distance = current - start,
			speed = Math.abs(distance) / time,
			destination,
			duration;

		deceleration = deceleration === undefined ? 0.0006 : deceleration;

		destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
		duration = speed / deceleration;

		if ( destination < lowerMargin ) {
			destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
			distance = Math.abs(destination - current);
			duration = distance / speed;
		} else if ( destination > 0 ) {
			destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
			distance = Math.abs(current) + destination;
			duration = distance / speed;
		}

		return {
			destination: Math.round(destination),
			duration: duration
		};
	};

	var _transform = _prefixStyle('transform');

	me.extend(me, {
		hasTransform: _transform !== false,
		hasPerspective: _prefixStyle('perspective') in _elementStyle,
		hasTouch: 'ontouchstart' in window,
		hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
		hasTransition: _prefixStyle('transition') in _elementStyle
	});

	// This should find all Android browsers lower than build 535.19 (both stock browser and webview)
	me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));

	me.extend(me.style = {}, {
		transform: _transform,
		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
		transitionDuration: _prefixStyle('transitionDuration'),
		transitionDelay: _prefixStyle('transitionDelay'),
		transformOrigin: _prefixStyle('transformOrigin')
	});

	me.hasClass = function (e, c) {
		var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
		return re.test(e.className);
	};

	me.addClass = function (e, c) {
		if ( me.hasClass(e, c) ) {
			return;
		}

		var newclass = e.className.split(' ');
		newclass.push(c);
		e.className = newclass.join(' ');
	};

	me.removeClass = function (e, c) {
		if ( !me.hasClass(e, c) ) {
			return;
		}

		var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
		e.className = e.className.replace(re, ' ');
	};

	me.offset = function (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;

		// jshint -W084
		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}
		// jshint +W084

		return {
			left: left,
			top: top
		};
	};

	me.preventDefaultException = function (el, exceptions) {
		for ( var i in exceptions ) {
			if ( exceptions[i].test(el[i]) ) {
				return true;
			}
		}

		return false;
	};

	me.extend(me.eventType = {}, {
		touchstart: 1,
		touchmove: 1,
		touchend: 1,

		mousedown: 2,
		mousemove: 2,
		mouseup: 2,

		pointerdown: 3,
		pointermove: 3,
		pointerup: 3,

		MSPointerDown: 3,
		MSPointerMove: 3,
		MSPointerUp: 3
	});

	me.extend(me.ease = {}, {
		quadratic: {
			style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			fn: function (k) {
				return k * ( 2 - k );
			}
		},
		circular: {
			style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
			fn: function (k) {
				return Math.sqrt( 1 - ( --k * k ) );
			}
		},
		back: {
			style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			fn: function (k) {
				var b = 4;
				return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
			}
		},
		bounce: {
			style: '',
			fn: function (k) {
				if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
					return 7.5625 * k * k;
				} else if ( k < ( 2 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
				} else if ( k < ( 2.5 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
				} else {
					return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
				}
			}
		},
		elastic: {
			style: '',
			fn: function (k) {
				var f = 0.22,
					e = 0.4;

				if ( k === 0 ) { return 0; }
				if ( k == 1 ) { return 1; }

				return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
			}
		}
	});

	me.tap = function (e, eventName) {
		var ev = document.createEvent('Event');
		ev.initEvent(eventName, true, true);
		ev.pageX = e.pageX;
		ev.pageY = e.pageY;
		e.target.dispatchEvent(ev);
	};

	me.click = function (e) {
		var target = e.target,
			ev;

		if ( !(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName) ) {
			ev = document.createEvent('MouseEvents');
			ev.initMouseEvent('click', true, true, e.view, 1,
				target.screenX, target.screenY, target.clientX, target.clientY,
				e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
				0, null);

			ev._constructed = true;
			target.dispatchEvent(ev);
		}
	};

	return me;
})();

function IScroll (el, options) {
	this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
	this.scroller = this.wrapper.children[0];
	this.scrollerStyle = this.scroller.style;		// cache style for better performance

	this.options = {

		resizeScrollbars: true,

		mouseWheelSpeed: 20,

		snapThreshold: 0.334,

// INSERT POINT: OPTIONS 

		startX: 0,
		startY: 0,
		scrollY: true,
		directionLockThreshold: 5,
		momentum: true,

		bounce: true,
		bounceTime: 600,
		bounceEasing: '',

		preventDefault: true,
		preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },

		HWCompositing: true,
		useTransition: true,
		useTransform: true
	};

	for ( var i in options ) {
		this.options[i] = options[i];
	}

	// Normalize options
	this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

	this.options.useTransition = utils.hasTransition && this.options.useTransition;
	this.options.useTransform = utils.hasTransform && this.options.useTransform;

	this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
	this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

	// If you want eventPassthrough I have to lock one of the axes
	this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
	this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

	// With eventPassthrough we also need lockDirection mechanism
	this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
	this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

	this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

	this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

	if ( this.options.tap === true ) {
		this.options.tap = 'tap';
	}

	if ( this.options.shrinkScrollbars == 'scale' ) {
		this.options.useTransition = false;
	}

	this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

// INSERT POINT: NORMALIZATION

	// Some defaults	
	this.x = 0;
	this.y = 0;
	this.directionX = 0;
	this.directionY = 0;
	this._events = {};

// INSERT POINT: DEFAULTS

	this._init();
	this.refresh();

	this.scrollTo(this.options.startX, this.options.startY);
	this.enable();
}

IScroll.prototype = {
	version: '5.1.3',

	_init: function () {
		this._initEvents();

		if ( this.options.scrollbars || this.options.indicators ) {
			this._initIndicators();
		}

		if ( this.options.mouseWheel ) {
			this._initWheel();
		}

		if ( this.options.snap ) {
			this._initSnap();
		}

		if ( this.options.keyBindings ) {
			this._initKeys();
		}

// INSERT POINT: _init

	},

	destroy: function () {
		this._initEvents(true);

		this._execEvent('destroy');
	},

	_transitionEnd: function (e) {
		if ( e.target != this.scroller || !this.isInTransition ) {
			return;
		}

		this._transitionTime();
		if ( !this.resetPosition(this.options.bounceTime) ) {
			this.isInTransition = false;
			this._execEvent('scrollEnd');
		}
	},

	_start: function (e) {
		// React to left mouse button only
		if ( utils.eventType[e.type] != 1 ) {
			if ( e.button !== 0 ) {
				return;
			}
		}

		if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
			return;
		}

		if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.touches ? e.touches[0] : e,
			pos;

		this.initiated	= utils.eventType[e.type];
		this.moved		= false;
		this.distX		= 0;
		this.distY		= 0;
		this.directionX = 0;
		this.directionY = 0;
		this.directionLocked = 0;

		this._transitionTime();

		this.startTime = utils.getTime();

		if ( this.options.useTransition && this.isInTransition ) {
			this.isInTransition = false;
			pos = this.getComputedPosition();
			this._translate(Math.round(pos.x), Math.round(pos.y));
			this._execEvent('scrollEnd');
		} else if ( !this.options.useTransition && this.isAnimating ) {
			this.isAnimating = false;
			this._execEvent('scrollEnd');
		}

		this.startX    = this.x;
		this.startY    = this.y;
		this.absStartX = this.x;
		this.absStartY = this.y;
		this.pointX    = point.pageX;
		this.pointY    = point.pageY;

		this._execEvent('beforeScrollStart');
	},

	_move: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}

		if ( this.options.preventDefault ) {	// increases performance on Android? TODO: check!
			e.preventDefault();
		}

		var point		= e.touches ? e.touches[0] : e,
			deltaX		= point.pageX - this.pointX,
			deltaY		= point.pageY - this.pointY,
			timestamp	= utils.getTime(),
			newX, newY,
			absDistX, absDistY;

		this.pointX		= point.pageX;
		this.pointY		= point.pageY;

		this.distX		+= deltaX;
		this.distY		+= deltaY;
		absDistX		= Math.abs(this.distX);
		absDistY		= Math.abs(this.distY);

		// We need to move at least 10 pixels for the scrolling to initiate
		if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
			return;
		}

		// If you are scrolling in one direction lock the other
		if ( !this.directionLocked && !this.options.freeScroll ) {
			if ( absDistX > absDistY + this.options.directionLockThreshold ) {
				this.directionLocked = 'h';		// lock horizontally
			} else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
				this.directionLocked = 'v';		// lock vertically
			} else {
				this.directionLocked = 'n';		// no lock
			}
		}

		if ( this.directionLocked == 'h' ) {
			if ( this.options.eventPassthrough == 'vertical' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'horizontal' ) {
				this.initiated = false;
				return;
			}

			deltaY = 0;
		} else if ( this.directionLocked == 'v' ) {
			if ( this.options.eventPassthrough == 'horizontal' ) {
				e.preventDefault();
			} else if ( this.options.eventPassthrough == 'vertical' ) {
				this.initiated = false;
				return;
			}

			deltaX = 0;
		}

		deltaX = this.hasHorizontalScroll ? deltaX : 0;
		deltaY = this.hasVerticalScroll ? deltaY : 0;

		newX = this.x + deltaX;
		newY = this.y + deltaY;

		// Slow down if outside of the boundaries
		if ( newX > 0 || newX < this.maxScrollX ) {
			newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
		}
		if ( newY > 0 || newY < this.maxScrollY ) {
			newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
		}

		this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		if ( !this.moved ) {
			this._execEvent('scrollStart');
		}

		this.moved = true;

		this._translate(newX, newY);

/* REPLACE START: _move */

		if ( timestamp - this.startTime > 300 ) {
			this.startTime = timestamp;
			this.startX = this.x;
			this.startY = this.y;
		}

/* REPLACE END: _move */

	},

	_end: function (e) {
		if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
			return;
		}

		if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
			e.preventDefault();
		}

		var point = e.changedTouches ? e.changedTouches[0] : e,
			momentumX,
			momentumY,
			duration = utils.getTime() - this.startTime,
			newX = Math.round(this.x),
			newY = Math.round(this.y),
			distanceX = Math.abs(newX - this.startX),
			distanceY = Math.abs(newY - this.startY),
			time = 0,
			easing = '';

		this.isInTransition = 0;
		this.initiated = 0;
		this.endTime = utils.getTime();

		// reset if we are outside of the boundaries
		if ( this.resetPosition(this.options.bounceTime) ) {
			return;
		}

		this.scrollTo(newX, newY);	// ensures that the last position is rounded

		// we scrolled less than 10 pixels
		if ( !this.moved ) {
			if ( this.options.tap ) {
				utils.tap(e, this.options.tap);
			}

			if ( this.options.click ) {
				utils.click(e);
			}

			this._execEvent('scrollCancel');
			return;
		}

		if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 ) {
			this._execEvent('flick');
			return;
		}

		// start momentum animation if needed
		if ( this.options.momentum && duration < 300 ) {
			momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
			momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
			newX = momentumX.destination;
			newY = momentumY.destination;
			time = Math.max(momentumX.duration, momentumY.duration);
			this.isInTransition = 1;
		}


		if ( this.options.snap ) {
			var snap = this._nearestSnap(newX, newY);
			this.currentPage = snap;
			time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(newX - snap.x), 1000),
						Math.min(Math.abs(newY - snap.y), 1000)
					), 300);
			newX = snap.x;
			newY = snap.y;

			this.directionX = 0;
			this.directionY = 0;
			easing = this.options.bounceEasing;
		}

// INSERT POINT: _end

		if ( newX != this.x || newY != this.y ) {
			// change easing function when scroller goes out of the boundaries
			if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
				easing = utils.ease.quadratic;
			}

			this.scrollTo(newX, newY, time, easing);
			return;
		}

		this._execEvent('scrollEnd');
	},

	_resize: function () {
		var that = this;

		clearTimeout(this.resizeTimeout);

		this.resizeTimeout = setTimeout(function () {
			that.refresh();
		}, this.options.resizePolling);
	},

	resetPosition: function (time) {
		var x = this.x,
			y = this.y;

		time = time || 0;

		if ( !this.hasHorizontalScroll || this.x > 0 ) {
			x = 0;
		} else if ( this.x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( !this.hasVerticalScroll || this.y > 0 ) {
			y = 0;
		} else if ( this.y < this.maxScrollY ) {
			y = this.maxScrollY;
		}

		if ( x == this.x && y == this.y ) {
			return false;
		}

		this.scrollTo(x, y, time, this.options.bounceEasing);

		return true;
	},

	disable: function () {
		this.enabled = false;
	},

	enable: function () {
		this.enabled = true;
	},

	refresh: function () {
		var rf = this.wrapper.offsetHeight;		// Force reflow

		this.wrapperWidth	= this.wrapper.clientWidth;
		this.wrapperHeight	= this.wrapper.clientHeight;

/* REPLACE START: refresh */

		this.scrollerWidth	= this.scroller.offsetWidth;
		this.scrollerHeight	= this.scroller.offsetHeight;

		this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
		this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;

/* REPLACE END: refresh */

		this.hasHorizontalScroll	= this.options.scrollX && this.maxScrollX < 0;
		this.hasVerticalScroll		= this.options.scrollY && this.maxScrollY < 0;

		if ( !this.hasHorizontalScroll ) {
			this.maxScrollX = 0;
			this.scrollerWidth = this.wrapperWidth;
		}

		if ( !this.hasVerticalScroll ) {
			this.maxScrollY = 0;
			this.scrollerHeight = this.wrapperHeight;
		}

		this.endTime = 0;
		this.directionX = 0;
		this.directionY = 0;

		this.wrapperOffset = utils.offset(this.wrapper);

		this._execEvent('refresh');

		this.resetPosition();

// INSERT POINT: _refresh

	},

	on: function (type, fn) {
		if ( !this._events[type] ) {
			this._events[type] = [];
		}

		this._events[type].push(fn);
	},

	off: function (type, fn) {
		if ( !this._events[type] ) {
			return;
		}

		var index = this._events[type].indexOf(fn);

		if ( index > -1 ) {
			this._events[type].splice(index, 1);
		}
	},

	_execEvent: function (type) {
		if ( !this._events[type] ) {
			return;
		}

		var i = 0,
			l = this._events[type].length;

		if ( !l ) {
			return;
		}

		for ( ; i < l; i++ ) {
			this._events[type][i].apply(this, [].slice.call(arguments, 1));
		}
	},

	scrollBy: function (x, y, time, easing) {
		x = this.x + x;
		y = this.y + y;
		time = time || 0;

		this.scrollTo(x, y, time, easing);
	},

	scrollTo: function (x, y, time, easing) {
		easing = easing || utils.ease.circular;

		this.isInTransition = this.options.useTransition && time > 0;

		if ( !time || (this.options.useTransition && easing.style) ) {
			this._transitionTimingFunction(easing.style);
			this._transitionTime(time);
			this._translate(x, y);
		} else {
			this._animate(x, y, time, easing.fn);
		}
	},

	scrollToElement: function (el, time, offsetX, offsetY, easing) {
		el = el.nodeType ? el : this.scroller.querySelector(el);

		if ( !el ) {
			return;
		}

		var pos = utils.offset(el);

		pos.left -= this.wrapperOffset.left;
		pos.top  -= this.wrapperOffset.top;

		// if offsetX/Y are true we center the element to the screen
		if ( offsetX === true ) {
			offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
		}
		if ( offsetY === true ) {
			offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
		}

		pos.left -= offsetX || 0;
		pos.top  -= offsetY || 0;

		pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
		pos.top  = pos.top  > 0 ? 0 : pos.top  < this.maxScrollY ? this.maxScrollY : pos.top;

		time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x-pos.left), Math.abs(this.y-pos.top)) : time;

		this.scrollTo(pos.left, pos.top, time, easing);
	},

	_transitionTime: function (time) {
		time = time || 0;

		this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

		if ( !time && utils.isBadAndroid ) {
			this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
		}


		if ( this.indicators ) {
			for ( var i = this.indicators.length; i--; ) {
				this.indicators[i].transitionTime(time);
			}
		}


// INSERT POINT: _transitionTime

	},

	_transitionTimingFunction: function (easing) {
		this.scrollerStyle[utils.style.transitionTimingFunction] = easing;


		if ( this.indicators ) {
			for ( var i = this.indicators.length; i--; ) {
				this.indicators[i].transitionTimingFunction(easing);
			}
		}


// INSERT POINT: _transitionTimingFunction

	},

	_translate: function (x, y) {
		if ( this.options.useTransform ) {

/* REPLACE START: _translate */

			this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

/* REPLACE END: _translate */

		} else {
			x = Math.round(x);
			y = Math.round(y);
			this.scrollerStyle.left = x + 'px';
			this.scrollerStyle.top = y + 'px';
		}

		this.x = x;
		this.y = y;


	if ( this.indicators ) {
		for ( var i = this.indicators.length; i--; ) {
			this.indicators[i].updatePosition();
		}
	}


// INSERT POINT: _translate

	},

	_initEvents: function (remove) {
		var eventType = remove ? utils.removeEvent : utils.addEvent,
			target = this.options.bindToWrapper ? this.wrapper : window;

		eventType(window, 'orientationchange', this);
		eventType(window, 'resize', this);

		if ( this.options.click ) {
			eventType(this.wrapper, 'click', this, true);
		}

		if ( !this.options.disableMouse ) {
			eventType(this.wrapper, 'mousedown', this);
			eventType(target, 'mousemove', this);
			eventType(target, 'mousecancel', this);
			eventType(target, 'mouseup', this);
		}

		if ( utils.hasPointer && !this.options.disablePointer ) {
			eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
			eventType(target, utils.prefixPointerEvent('pointermove'), this);
			eventType(target, utils.prefixPointerEvent('pointercancel'), this);
			eventType(target, utils.prefixPointerEvent('pointerup'), this);
		}

		if ( utils.hasTouch && !this.options.disableTouch ) {
			eventType(this.wrapper, 'touchstart', this);
			eventType(target, 'touchmove', this);
			eventType(target, 'touchcancel', this);
			eventType(target, 'touchend', this);
		}

		eventType(this.scroller, 'transitionend', this);
		eventType(this.scroller, 'webkitTransitionEnd', this);
		eventType(this.scroller, 'oTransitionEnd', this);
		eventType(this.scroller, 'MSTransitionEnd', this);
	},

	getComputedPosition: function () {
		var matrix = window.getComputedStyle(this.scroller, null),
			x, y;

		if ( this.options.useTransform ) {
			matrix = matrix[utils.style.transform].split(')')[0].split(', ');
			x = +(matrix[12] || matrix[4]);
			y = +(matrix[13] || matrix[5]);
		} else {
			x = +matrix.left.replace(/[^-\d.]/g, '');
			y = +matrix.top.replace(/[^-\d.]/g, '');
		}

		return { x: x, y: y };
	},

	_initIndicators: function () {
		var interactive = this.options.interactiveScrollbars,
			customStyle = typeof this.options.scrollbars != 'string',
			indicators = [],
			indicator;

		var that = this;

		this.indicators = [];

		if ( this.options.scrollbars ) {
			// Vertical scrollbar
			if ( this.options.scrollY ) {
				indicator = {
					el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
					interactive: interactive,
					defaultScrollbars: true,
					customStyle: customStyle,
					resize: this.options.resizeScrollbars,
					shrink: this.options.shrinkScrollbars,
					fade: this.options.fadeScrollbars,
					listenX: false
				};

				this.wrapper.appendChild(indicator.el);
				indicators.push(indicator);
			}

			// Horizontal scrollbar
			if ( this.options.scrollX ) {
				indicator = {
					el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
					interactive: interactive,
					defaultScrollbars: true,
					customStyle: customStyle,
					resize: this.options.resizeScrollbars,
					shrink: this.options.shrinkScrollbars,
					fade: this.options.fadeScrollbars,
					listenY: false
				};

				this.wrapper.appendChild(indicator.el);
				indicators.push(indicator);
			}
		}

		if ( this.options.indicators ) {
			// TODO: check concat compatibility
			indicators = indicators.concat(this.options.indicators);
		}

		for ( var i = indicators.length; i--; ) {
			this.indicators.push( new Indicator(this, indicators[i]) );
		}

		// TODO: check if we can use array.map (wide compatibility and performance issues)
		function _indicatorsMap (fn) {
			for ( var i = that.indicators.length; i--; ) {
				fn.call(that.indicators[i]);
			}
		}

		if ( this.options.fadeScrollbars ) {
			this.on('scrollEnd', function () {
				_indicatorsMap(function () {
					this.fade();
				});
			});

			this.on('scrollCancel', function () {
				_indicatorsMap(function () {
					this.fade();
				});
			});

			this.on('scrollStart', function () {
				_indicatorsMap(function () {
					this.fade(1);
				});
			});

			this.on('beforeScrollStart', function () {
				_indicatorsMap(function () {
					this.fade(1, true);
				});
			});
		}


		this.on('refresh', function () {
			_indicatorsMap(function () {
				this.refresh();
			});
		});

		this.on('destroy', function () {
			_indicatorsMap(function () {
				this.destroy();
			});

			delete this.indicators;
		});
	},

	_initWheel: function () {
		utils.addEvent(this.wrapper, 'wheel', this);
		utils.addEvent(this.wrapper, 'mousewheel', this);
		utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

		this.on('destroy', function () {
			utils.removeEvent(this.wrapper, 'wheel', this);
			utils.removeEvent(this.wrapper, 'mousewheel', this);
			utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
		});
	},

	_wheel: function (e) {
		if ( !this.enabled ) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		var wheelDeltaX, wheelDeltaY,
			newX, newY,
			that = this;

		if ( this.wheelTimeout === undefined ) {
			that._execEvent('scrollStart');
		}

		// Execute the scrollEnd event after 400ms the wheel stopped scrolling
		clearTimeout(this.wheelTimeout);
		this.wheelTimeout = setTimeout(function () {
			that._execEvent('scrollEnd');
			that.wheelTimeout = undefined;
		}, 400);

		if ( 'deltaX' in e ) {
			if (e.deltaMode === 1) {
				wheelDeltaX = -e.deltaX * this.options.mouseWheelSpeed;
				wheelDeltaY = -e.deltaY * this.options.mouseWheelSpeed;
			} else {
				wheelDeltaX = -e.deltaX;
				wheelDeltaY = -e.deltaY;
			}
		} else if ( 'wheelDeltaX' in e ) {
			wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
			wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
		} else if ( 'wheelDelta' in e ) {
			wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
		} else if ( 'detail' in e ) {
			wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
		} else {
			return;
		}

		wheelDeltaX *= this.options.invertWheelDirection;
		wheelDeltaY *= this.options.invertWheelDirection;

		if ( !this.hasVerticalScroll ) {
			wheelDeltaX = wheelDeltaY;
			wheelDeltaY = 0;
		}

		if ( this.options.snap ) {
			newX = this.currentPage.pageX;
			newY = this.currentPage.pageY;

			if ( wheelDeltaX > 0 ) {
				newX--;
			} else if ( wheelDeltaX < 0 ) {
				newX++;
			}

			if ( wheelDeltaY > 0 ) {
				newY--;
			} else if ( wheelDeltaY < 0 ) {
				newY++;
			}

			this.goToPage(newX, newY);

			return;
		}

		newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
		newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

		if ( newX > 0 ) {
			newX = 0;
		} else if ( newX < this.maxScrollX ) {
			newX = this.maxScrollX;
		}

		if ( newY > 0 ) {
			newY = 0;
		} else if ( newY < this.maxScrollY ) {
			newY = this.maxScrollY;
		}

		this.scrollTo(newX, newY, 0);

// INSERT POINT: _wheel
	},

	_initSnap: function () {
		this.currentPage = {};

		if ( typeof this.options.snap == 'string' ) {
			this.options.snap = this.scroller.querySelectorAll(this.options.snap);
		}

		this.on('refresh', function () {
			var i = 0, l,
				m = 0, n,
				cx, cy,
				x = 0, y,
				stepX = this.options.snapStepX || this.wrapperWidth,
				stepY = this.options.snapStepY || this.wrapperHeight,
				el;

			this.pages = [];

			if ( !this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight ) {
				return;
			}

			if ( this.options.snap === true ) {
				cx = Math.round( stepX / 2 );
				cy = Math.round( stepY / 2 );

				while ( x > -this.scrollerWidth ) {
					this.pages[i] = [];
					l = 0;
					y = 0;

					while ( y > -this.scrollerHeight ) {
						this.pages[i][l] = {
							x: Math.max(x, this.maxScrollX),
							y: Math.max(y, this.maxScrollY),
							width: stepX,
							height: stepY,
							cx: x - cx,
							cy: y - cy
						};

						y -= stepY;
						l++;
					}

					x -= stepX;
					i++;
				}
			} else {
				el = this.options.snap;
				l = el.length;
				n = -1;

				for ( ; i < l; i++ ) {
					if ( i === 0 || el[i].offsetLeft <= el[i-1].offsetLeft ) {
						m = 0;
						n++;
					}

					if ( !this.pages[m] ) {
						this.pages[m] = [];
					}

					x = Math.max(-el[i].offsetLeft, this.maxScrollX);
					y = Math.max(-el[i].offsetTop, this.maxScrollY);
					cx = x - Math.round(el[i].offsetWidth / 2);
					cy = y - Math.round(el[i].offsetHeight / 2);

					this.pages[m][n] = {
						x: x,
						y: y,
						width: el[i].offsetWidth,
						height: el[i].offsetHeight,
						cx: cx,
						cy: cy
					};

					if ( x > this.maxScrollX ) {
						m++;
					}
				}
			}

			this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

			// Update snap threshold if needed
			if ( this.options.snapThreshold % 1 === 0 ) {
				this.snapThresholdX = this.options.snapThreshold;
				this.snapThresholdY = this.options.snapThreshold;
			} else {
				this.snapThresholdX = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold);
				this.snapThresholdY = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold);
			}
		});

		this.on('flick', function () {
			var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.x - this.startX), 1000),
						Math.min(Math.abs(this.y - this.startY), 1000)
					), 300);

			this.goToPage(
				this.currentPage.pageX + this.directionX,
				this.currentPage.pageY + this.directionY,
				time
			);
		});
	},

	_nearestSnap: function (x, y) {
		if ( !this.pages.length ) {
			return { x: 0, y: 0, pageX: 0, pageY: 0 };
		}

		var i = 0,
			l = this.pages.length,
			m = 0;

		// Check if we exceeded the snap threshold
		if ( Math.abs(x - this.absStartX) < this.snapThresholdX &&
			Math.abs(y - this.absStartY) < this.snapThresholdY ) {
			return this.currentPage;
		}

		if ( x > 0 ) {
			x = 0;
		} else if ( x < this.maxScrollX ) {
			x = this.maxScrollX;
		}

		if ( y > 0 ) {
			y = 0;
		} else if ( y < this.maxScrollY ) {
			y = this.maxScrollY;
		}

		for ( ; i < l; i++ ) {
			if ( x >= this.pages[i][0].cx ) {
				x = this.pages[i][0].x;
				break;
			}
		}

		l = this.pages[i].length;

		for ( ; m < l; m++ ) {
			if ( y >= this.pages[0][m].cy ) {
				y = this.pages[0][m].y;
				break;
			}
		}

		if ( i == this.currentPage.pageX ) {
			i += this.directionX;

			if ( i < 0 ) {
				i = 0;
			} else if ( i >= this.pages.length ) {
				i = this.pages.length - 1;
			}

			x = this.pages[i][0].x;
		}

		if ( m == this.currentPage.pageY ) {
			m += this.directionY;

			if ( m < 0 ) {
				m = 0;
			} else if ( m >= this.pages[0].length ) {
				m = this.pages[0].length - 1;
			}

			y = this.pages[0][m].y;
		}

		return {
			x: x,
			y: y,
			pageX: i,
			pageY: m
		};
	},

	goToPage: function (x, y, time, easing) {
		easing = easing || this.options.bounceEasing;

		if ( x >= this.pages.length ) {
			x = this.pages.length - 1;
		} else if ( x < 0 ) {
			x = 0;
		}

		if ( y >= this.pages[x].length ) {
			y = this.pages[x].length - 1;
		} else if ( y < 0 ) {
			y = 0;
		}

		var posX = this.pages[x][y].x,
			posY = this.pages[x][y].y;

		time = time === undefined ? this.options.snapSpeed || Math.max(
			Math.max(
				Math.min(Math.abs(posX - this.x), 1000),
				Math.min(Math.abs(posY - this.y), 1000)
			), 300) : time;

		this.currentPage = {
			x: posX,
			y: posY,
			pageX: x,
			pageY: y
		};

		this.scrollTo(posX, posY, time, easing);
	},

	next: function (time, easing) {
		var x = this.currentPage.pageX,
			y = this.currentPage.pageY;

		x++;

		if ( x >= this.pages.length && this.hasVerticalScroll ) {
			x = 0;
			y++;
		}

		this.goToPage(x, y, time, easing);
	},

	prev: function (time, easing) {
		var x = this.currentPage.pageX,
			y = this.currentPage.pageY;

		x--;

		if ( x < 0 && this.hasVerticalScroll ) {
			x = 0;
			y--;
		}

		this.goToPage(x, y, time, easing);
	},

	_initKeys: function (e) {
		// default key bindings
		var keys = {
			pageUp: 33,
			pageDown: 34,
			end: 35,
			home: 36,
			left: 37,
			up: 38,
			right: 39,
			down: 40
		};
		var i;

		// if you give me characters I give you keycode
		if ( typeof this.options.keyBindings == 'object' ) {
			for ( i in this.options.keyBindings ) {
				if ( typeof this.options.keyBindings[i] == 'string' ) {
					this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
				}
			}
		} else {
			this.options.keyBindings = {};
		}

		for ( i in keys ) {
			this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
		}

		utils.addEvent(window, 'keydown', this);

		this.on('destroy', function () {
			utils.removeEvent(window, 'keydown', this);
		});
	},

	_key: function (e) {
		if ( !this.enabled ) {
			return;
		}

		var snap = this.options.snap,	// we are using this alot, better to cache it
			newX = snap ? this.currentPage.pageX : this.x,
			newY = snap ? this.currentPage.pageY : this.y,
			now = utils.getTime(),
			prevTime = this.keyTime || 0,
			acceleration = 0.250,
			pos;

		if ( this.options.useTransition && this.isInTransition ) {
			pos = this.getComputedPosition();

			this._translate(Math.round(pos.x), Math.round(pos.y));
			this.isInTransition = false;
		}

		this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

		switch ( e.keyCode ) {
			case this.options.keyBindings.pageUp:
				if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
					newX += snap ? 1 : this.wrapperWidth;
				} else {
					newY += snap ? 1 : this.wrapperHeight;
				}
				break;
			case this.options.keyBindings.pageDown:
				if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
					newX -= snap ? 1 : this.wrapperWidth;
				} else {
					newY -= snap ? 1 : this.wrapperHeight;
				}
				break;
			case this.options.keyBindings.end:
				newX = snap ? this.pages.length-1 : this.maxScrollX;
				newY = snap ? this.pages[0].length-1 : this.maxScrollY;
				break;
			case this.options.keyBindings.home:
				newX = 0;
				newY = 0;
				break;
			case this.options.keyBindings.left:
				newX += snap ? -1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.up:
				newY += snap ? 1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.right:
				newX -= snap ? -1 : 5 + this.keyAcceleration>>0;
				break;
			case this.options.keyBindings.down:
				newY -= snap ? 1 : 5 + this.keyAcceleration>>0;
				break;
			default:
				return;
		}

		if ( snap ) {
			this.goToPage(newX, newY);
			return;
		}

		if ( newX > 0 ) {
			newX = 0;
			this.keyAcceleration = 0;
		} else if ( newX < this.maxScrollX ) {
			newX = this.maxScrollX;
			this.keyAcceleration = 0;
		}

		if ( newY > 0 ) {
			newY = 0;
			this.keyAcceleration = 0;
		} else if ( newY < this.maxScrollY ) {
			newY = this.maxScrollY;
			this.keyAcceleration = 0;
		}

		this.scrollTo(newX, newY, 0);

		this.keyTime = now;
	},

	_animate: function (destX, destY, duration, easingFn) {
		var that = this,
			startX = this.x,
			startY = this.y,
			startTime = utils.getTime(),
			destTime = startTime + duration;

		function step () {
			var now = utils.getTime(),
				newX, newY,
				easing;

			if ( now >= destTime ) {
				that.isAnimating = false;
				that._translate(destX, destY);

				if ( !that.resetPosition(that.options.bounceTime) ) {
					that._execEvent('scrollEnd');
				}

				return;
			}

			now = ( now - startTime ) / duration;
			easing = easingFn(now);
			newX = ( destX - startX ) * easing + startX;
			newY = ( destY - startY ) * easing + startY;
			that._translate(newX, newY);

			if ( that.isAnimating ) {
				rAF(step);
			}
		}

		this.isAnimating = true;
		step();
	},
	handleEvent: function (e) {
		switch ( e.type ) {
			case 'touchstart':
			case 'pointerdown':
			case 'MSPointerDown':
			case 'mousedown':
				this._start(e);
				break;
			case 'touchmove':
			case 'pointermove':
			case 'MSPointerMove':
			case 'mousemove':
				this._move(e);
				break;
			case 'touchend':
			case 'pointerup':
			case 'MSPointerUp':
			case 'mouseup':
			case 'touchcancel':
			case 'pointercancel':
			case 'MSPointerCancel':
			case 'mousecancel':
				this._end(e);
				break;
			case 'orientationchange':
			case 'resize':
				this._resize();
				break;
			case 'transitionend':
			case 'webkitTransitionEnd':
			case 'oTransitionEnd':
			case 'MSTransitionEnd':
				this._transitionEnd(e);
				break;
			case 'wheel':
			case 'DOMMouseScroll':
			case 'mousewheel':
				this._wheel(e);
				break;
			case 'keydown':
				this._key(e);
				break;
			case 'click':
				if ( !e._constructed ) {
					e.preventDefault();
					e.stopPropagation();
				}
				break;
		}
	}
};
function createDefaultScrollbar (direction, interactive, type) {
	var scrollbar = document.createElement('div'),
		indicator = document.createElement('div');

	if ( type === true ) {
		scrollbar.style.cssText = 'position:absolute;z-index:9999';
		indicator.style.cssText = '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
	}

	indicator.className = 'iScrollIndicator';

	if ( direction == 'h' ) {
		if ( type === true ) {
			scrollbar.style.cssText += ';height:7px;left:2px;right:2px;bottom:0';
			indicator.style.height = '100%';
		}
		scrollbar.className = 'iScrollHorizontalScrollbar';
	} else {
		if ( type === true ) {
			scrollbar.style.cssText += ';width:7px;bottom:2px;top:2px;right:1px';
			indicator.style.width = '100%';
		}
		scrollbar.className = 'iScrollVerticalScrollbar';
	}

	scrollbar.style.cssText += ';overflow:hidden';

	if ( !interactive ) {
		scrollbar.style.pointerEvents = 'none';
	}

	scrollbar.appendChild(indicator);

	return scrollbar;
}

function Indicator (scroller, options) {
	this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
	this.wrapperStyle = this.wrapper.style;
	this.indicator = this.wrapper.children[0];
	this.indicatorStyle = this.indicator.style;
	this.scroller = scroller;

	this.options = {
		listenX: true,
		listenY: true,
		interactive: false,
		resize: true,
		defaultScrollbars: false,
		shrink: false,
		fade: false,
		speedRatioX: 0,
		speedRatioY: 0
	};

	for ( var i in options ) {
		this.options[i] = options[i];
	}

	this.sizeRatioX = 1;
	this.sizeRatioY = 1;
	this.maxPosX = 0;
	this.maxPosY = 0;

	if ( this.options.interactive ) {
		if ( !this.options.disableTouch ) {
			utils.addEvent(this.indicator, 'touchstart', this);
			utils.addEvent(window, 'touchend', this);
		}
		if ( !this.options.disablePointer ) {
			utils.addEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
			utils.addEvent(window, utils.prefixPointerEvent('pointerup'), this);
		}
		if ( !this.options.disableMouse ) {
			utils.addEvent(this.indicator, 'mousedown', this);
			utils.addEvent(window, 'mouseup', this);
		}
	}

	if ( this.options.fade ) {
		this.wrapperStyle[utils.style.transform] = this.scroller.translateZ;
		this.wrapperStyle[utils.style.transitionDuration] = utils.isBadAndroid ? '0.001s' : '0ms';
		this.wrapperStyle.opacity = '0';
	}
}

Indicator.prototype = {
	handleEvent: function (e) {
		switch ( e.type ) {
			case 'touchstart':
			case 'pointerdown':
			case 'MSPointerDown':
			case 'mousedown':
				this._start(e);
				break;
			case 'touchmove':
			case 'pointermove':
			case 'MSPointerMove':
			case 'mousemove':
				this._move(e);
				break;
			case 'touchend':
			case 'pointerup':
			case 'MSPointerUp':
			case 'mouseup':
			case 'touchcancel':
			case 'pointercancel':
			case 'MSPointerCancel':
			case 'mousecancel':
				this._end(e);
				break;
		}
	},

	destroy: function () {
		if ( this.options.interactive ) {
			utils.removeEvent(this.indicator, 'touchstart', this);
			utils.removeEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
			utils.removeEvent(this.indicator, 'mousedown', this);

			utils.removeEvent(window, 'touchmove', this);
			utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
			utils.removeEvent(window, 'mousemove', this);

			utils.removeEvent(window, 'touchend', this);
			utils.removeEvent(window, utils.prefixPointerEvent('pointerup'), this);
			utils.removeEvent(window, 'mouseup', this);
		}

		if ( this.options.defaultScrollbars ) {
			this.wrapper.parentNode.removeChild(this.wrapper);
		}
	},

	_start: function (e) {
		var point = e.touches ? e.touches[0] : e;

		e.preventDefault();
		e.stopPropagation();

		this.transitionTime();

		this.initiated = true;
		this.moved = false;
		this.lastPointX	= point.pageX;
		this.lastPointY	= point.pageY;

		this.startTime	= utils.getTime();

		if ( !this.options.disableTouch ) {
			utils.addEvent(window, 'touchmove', this);
		}
		if ( !this.options.disablePointer ) {
			utils.addEvent(window, utils.prefixPointerEvent('pointermove'), this);
		}
		if ( !this.options.disableMouse ) {
			utils.addEvent(window, 'mousemove', this);
		}

		this.scroller._execEvent('beforeScrollStart');
	},

	_move: function (e) {
		var point = e.touches ? e.touches[0] : e,
			deltaX, deltaY,
			newX, newY,
			timestamp = utils.getTime();

		if ( !this.moved ) {
			this.scroller._execEvent('scrollStart');
		}

		this.moved = true;

		deltaX = point.pageX - this.lastPointX;
		this.lastPointX = point.pageX;

		deltaY = point.pageY - this.lastPointY;
		this.lastPointY = point.pageY;

		newX = this.x + deltaX;
		newY = this.y + deltaY;

		this._pos(newX, newY);

// INSERT POINT: indicator._move

		e.preventDefault();
		e.stopPropagation();
	},

	_end: function (e) {
		if ( !this.initiated ) {
			return;
		}

		this.initiated = false;

		e.preventDefault();
		e.stopPropagation();

		utils.removeEvent(window, 'touchmove', this);
		utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
		utils.removeEvent(window, 'mousemove', this);

		if ( this.scroller.options.snap ) {
			var snap = this.scroller._nearestSnap(this.scroller.x, this.scroller.y);

			var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.scroller.x - snap.x), 1000),
						Math.min(Math.abs(this.scroller.y - snap.y), 1000)
					), 300);

			if ( this.scroller.x != snap.x || this.scroller.y != snap.y ) {
				this.scroller.directionX = 0;
				this.scroller.directionY = 0;
				this.scroller.currentPage = snap;
				this.scroller.scrollTo(snap.x, snap.y, time, this.scroller.options.bounceEasing);
			}
		}

		if ( this.moved ) {
			this.scroller._execEvent('scrollEnd');
		}
	},

	transitionTime: function (time) {
		time = time || 0;
		this.indicatorStyle[utils.style.transitionDuration] = time + 'ms';

		if ( !time && utils.isBadAndroid ) {
			this.indicatorStyle[utils.style.transitionDuration] = '0.001s';
		}
	},

	transitionTimingFunction: function (easing) {
		this.indicatorStyle[utils.style.transitionTimingFunction] = easing;
	},

	refresh: function () {
		this.transitionTime();

		if ( this.options.listenX && !this.options.listenY ) {
			this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
		} else if ( this.options.listenY && !this.options.listenX ) {
			this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
		} else {
			this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
		}

		if ( this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ) {
			utils.addClass(this.wrapper, 'iScrollBothScrollbars');
			utils.removeClass(this.wrapper, 'iScrollLoneScrollbar');

			if ( this.options.defaultScrollbars && this.options.customStyle ) {
				if ( this.options.listenX ) {
					this.wrapper.style.right = '8px';
				} else {
					this.wrapper.style.bottom = '8px';
				}
			}
		} else {
			utils.removeClass(this.wrapper, 'iScrollBothScrollbars');
			utils.addClass(this.wrapper, 'iScrollLoneScrollbar');

			if ( this.options.defaultScrollbars && this.options.customStyle ) {
				if ( this.options.listenX ) {
					this.wrapper.style.right = '2px';
				} else {
					this.wrapper.style.bottom = '2px';
				}
			}
		}

		var r = this.wrapper.offsetHeight;	// force refresh

		if ( this.options.listenX ) {
			this.wrapperWidth = this.wrapper.clientWidth;
			if ( this.options.resize ) {
				this.indicatorWidth = Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8);
				this.indicatorStyle.width = this.indicatorWidth + 'px';
			} else {
				this.indicatorWidth = this.indicator.clientWidth;
			}

			this.maxPosX = this.wrapperWidth - this.indicatorWidth;

			if ( this.options.shrink == 'clip' ) {
				this.minBoundaryX = -this.indicatorWidth + 8;
				this.maxBoundaryX = this.wrapperWidth - 8;
			} else {
				this.minBoundaryX = 0;
				this.maxBoundaryX = this.maxPosX;
			}

			this.sizeRatioX = this.options.speedRatioX || (this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX));	
		}

		if ( this.options.listenY ) {
			this.wrapperHeight = this.wrapper.clientHeight;
			if ( this.options.resize ) {
				this.indicatorHeight = Math.max(Math.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1)), 8);
				this.indicatorStyle.height = this.indicatorHeight + 'px';
			} else {
				this.indicatorHeight = this.indicator.clientHeight;
			}

			this.maxPosY = this.wrapperHeight - this.indicatorHeight;

			if ( this.options.shrink == 'clip' ) {
				this.minBoundaryY = -this.indicatorHeight + 8;
				this.maxBoundaryY = this.wrapperHeight - 8;
			} else {
				this.minBoundaryY = 0;
				this.maxBoundaryY = this.maxPosY;
			}

			this.maxPosY = this.wrapperHeight - this.indicatorHeight;
			this.sizeRatioY = this.options.speedRatioY || (this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY));
		}

		this.updatePosition();
	},

	updatePosition: function () {
		var x = this.options.listenX && Math.round(this.sizeRatioX * this.scroller.x) || 0,
			y = this.options.listenY && Math.round(this.sizeRatioY * this.scroller.y) || 0;

		if ( !this.options.ignoreBoundaries ) {
			if ( x < this.minBoundaryX ) {
				if ( this.options.shrink == 'scale' ) {
					this.width = Math.max(this.indicatorWidth + x, 8);
					this.indicatorStyle.width = this.width + 'px';
				}
				x = this.minBoundaryX;
			} else if ( x > this.maxBoundaryX ) {
				if ( this.options.shrink == 'scale' ) {
					this.width = Math.max(this.indicatorWidth - (x - this.maxPosX), 8);
					this.indicatorStyle.width = this.width + 'px';
					x = this.maxPosX + this.indicatorWidth - this.width;
				} else {
					x = this.maxBoundaryX;
				}
			} else if ( this.options.shrink == 'scale' && this.width != this.indicatorWidth ) {
				this.width = this.indicatorWidth;
				this.indicatorStyle.width = this.width + 'px';
			}

			if ( y < this.minBoundaryY ) {
				if ( this.options.shrink == 'scale' ) {
					this.height = Math.max(this.indicatorHeight + y * 3, 8);
					this.indicatorStyle.height = this.height + 'px';
				}
				y = this.minBoundaryY;
			} else if ( y > this.maxBoundaryY ) {
				if ( this.options.shrink == 'scale' ) {
					this.height = Math.max(this.indicatorHeight - (y - this.maxPosY) * 3, 8);
					this.indicatorStyle.height = this.height + 'px';
					y = this.maxPosY + this.indicatorHeight - this.height;
				} else {
					y = this.maxBoundaryY;
				}
			} else if ( this.options.shrink == 'scale' && this.height != this.indicatorHeight ) {
				this.height = this.indicatorHeight;
				this.indicatorStyle.height = this.height + 'px';
			}
		}

		this.x = x;
		this.y = y;

		if ( this.scroller.options.useTransform ) {
			this.indicatorStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
		} else {
			this.indicatorStyle.left = x + 'px';
			this.indicatorStyle.top = y + 'px';
		}
	},

	_pos: function (x, y) {
		if ( x < 0 ) {
			x = 0;
		} else if ( x > this.maxPosX ) {
			x = this.maxPosX;
		}

		if ( y < 0 ) {
			y = 0;
		} else if ( y > this.maxPosY ) {
			y = this.maxPosY;
		}

		x = this.options.listenX ? Math.round(x / this.sizeRatioX) : this.scroller.x;
		y = this.options.listenY ? Math.round(y / this.sizeRatioY) : this.scroller.y;

		this.scroller.scrollTo(x, y);
	},

	fade: function (val, hold) {
		if ( hold && !this.visible ) {
			return;
		}

		clearTimeout(this.fadeTimeout);
		this.fadeTimeout = null;

		var time = val ? 250 : 500,
			delay = val ? 0 : 300;

		val = val ? '1' : '0';

		this.wrapperStyle[utils.style.transitionDuration] = time + 'ms';

		this.fadeTimeout = setTimeout((function (val) {
			this.wrapperStyle.opacity = val;
			this.visible = +val;
		}).bind(this, val), delay);
	}
};

IScroll.utils = utils;

if ( typeof module != 'undefined' && module.exports ) {
	module.exports = IScroll;
} else {
	window.IScroll = IScroll;
}

})(window, document, Math);
void function (window) {
    var $doc = document
    var AutoPicture = function ($box, option) {
        this.$el = $box
        this.option = option
        this.load(option.images);
    }
    AutoPicture.prototype = {
        load: function (images) {
            var me = this
            var imgs = []
            var loadedNum = 0
            var wrapper = function (el, w, h) {
                var wrap = document.createElement('DIV')
                wrap.style.position = 'absolute'
                wrap.style.overflow = 'hidden'
                el.style.cssText = 'display:block; height: 100%;width: 100%;'
                wrap.appendChild(el)
                return wrap
            }
            me.each(images, function (val, key) {
                var img = document.createElement('IMG')
                img.src = val
                var obj = {
                    index: key
                }
                img.onload = function () {
                    this.onload = null
                    var width = this.width
                    var height = this.height
                    obj.node = wrapper(img, width, height)
                    obj.realHeight = height
                    obj.realWidth = width
                    if (++loadedNum === images.length) {
                        me.adjust(imgs)
                        me.bindEvent()
                    }
                };
                imgs.push(obj)
            })
            this.imgs = imgs
        },
        adjust: function (imgs) {
            var totalWidth = 0, me = this , boxWidth
            var margin = me.option.margin
            imgs = imgs.slice(0)
            var unit = me.option.unit || me.getUnit(imgs)
            var totalWidht = 0
            me.each(imgs, function (val, key) {
                var scale = unit / val.realHeight
                val.height = unit
                val.width = val.realWidth * scale
                totalWidth += val.width + margin
            })
            //show scroll bar
            document.body.style.height = '2000px'
            boxWidth = me.$el.clientWidth - margin
            document.body.style.height = ''
            var remainder = totalWidth % boxWidth
            var goalWidth = remainder > boxWidth / 2 ? totalWidth + boxWidth - remainder : totalWidth - remainder
            var rowNum = Math.floor(goalWidth / boxWidth)
            var scale = goalWidth / totalWidth
            this.each(imgs, function (val, key) {
                val.height = (val.height + margin) * scale
                val.width = (val.width + margin) * scale
            })

            unit = unit * scale
            var baseLeft = 0
            var baseTop = margin
            var offsetLeft = 0
            //scroll bar
            if( (unit+ margin) * rowNum < document.documentElement.clientHeight){
                offsetLeft += 10
            }
            var fragment = document.createDocumentFragment()
            while (rowNum-- && imgs.length) {
                var wid = 0
                baseLeft = margin + offsetLeft
                var curAry
                me.each(imgs, function (val, key) {
                    wid += val.width
                    if (!imgs[key + 1] || Math.abs(boxWidth - wid) < Math.abs(boxWidth - wid - imgs[key + 1].width)) {
                        curAry = imgs.splice(0, key + 1)
                        return false
                    }
                })
                me.each(curAry, function (val, key) {
                    val.width *= boxWidth / wid
                    val.height *= boxWidth / wid
                    me.setPos(val.node, {
                        width: val.width - margin,
                        height: val.height - margin,
                        left: baseLeft,
                        top: baseTop
                    })
                    baseLeft += val.width
                    fragment.appendChild(val.node)
                })
                baseTop += curAry[0].height
            }
            me.$el.innerHTML = ''
            me.$el.appendChild(fragment)
        },

        getUnit: function (imgs) {
            var me = this
            var middleHeight = 0
            me.each(imgs, function (val, key) {
                middleHeight += val.realHeight
            })
            //平均数
            middleHeight = middleHeight / imgs.length
            var distanceAry = []
            me.each(imgs, function (val, key) {
                distanceAry.push(Math.abs(val.realHeight - middleHeight))
            })
            distanceAry.sort(function (a, b) {
                return a - b
            })
            var distance = distanceAry[Math.floor(distanceAry.length / 4)]
            var unit = 0
            me.each(imgs, function (val, key) {
                if (Math.abs(val.realHeight - middleHeight) == distance) {
                    unit = val.realHeight
                    return false
                }
            })
            return unit
        },
        each: function (ary, fn, start) {
            start = start || 0
            for (var i = start; i < ary.length; i++) {
                if (fn(ary[i], i) === false) break;
            }
        },

        //设置left、top、width、height
        setPos: function ($node, css) {
            var style = $node.style.cssText;
            style += ';'
            for (var i in css) {
                style += i + ':' + css[i] + 'px;'
            }
            return $node.style.cssText = style
        },
        bindEvent: function () {
            //这里事件不是重点,处理不全面，一般不建议使用attachEvent方法
            var bind = window.addEventListener || window.attachEvent
            var me = this
            var handler = this.throttle(120, function () {
                me.adjust(me.imgs)
            }, false)
            bind('resize', handler, false)
        },
        //稀释方法，连续短时间内多次执行仅仅执行一次
        //debounce_mode 选择起初执行(true)还是末尾执行(false)
        throttle: function (delay, fn, debounce_mode) {
            var last = 0,
                timeId;

            if (typeof fn !== 'function') {
                debounce_mode = fn;
                fn = delay;
                delay = 250;
            }

            function wrapper() {
                var that = this,
                    period = Date.now() - last,
                    args = arguments;

                function exec() {
                    last = Date.now();
                    fn.apply(that, args);
                };

                function clear() {
                    timeId = undefined;
                };

                if (debounce_mode && !timeId) {
                    // debounce模式 && 第一次调用
                    exec();
                }

                timeId && clearTimeout(timeId);
                if (debounce_mode === undefined && period > delay) {
                    // throttle, 执行到了delay时间
                    exec();
                } else {
                    // debounce, 如果是start就clearTimeout
                    timeId = setTimeout(debounce_mode ? clear : exec, debounce_mode === undefined ? delay - period : delay);
                }
            };
            return wrapper;
        }
    };

    window.AutoPicture = AutoPicture;

}(window);



(function($) {

$.extend(rocket, {
    init: function() {
        // loading object
        rocket.$globalLoading = $('#wrapper .global-loading');
        rocket.$pageLoading = $('#wrapper .page-loading');

        var router = new rocket.router.summary();

        // globalview init
        // new rocket.globalview.gotop({}, router);
        webappandroid.levelnav
            = new rocket.globalview.levelnav({}, router);        

        Backbone.history.start();

        function scroll(e){
            $(document.body).height(600);

            // http://remysharp.com/2010/08/05/doing-it-right-skipping-the-iphone-url-bar/
            setTimeout(function(){
                //window.scrollTo(0, 0);
                setTimeout(function(){
                    $(document.body).height($(window).height());
                }, 0);
                rocket.isLoaded = true;
                
            }, 1000); 

        }

        $(function(e){
            //scroll();
        });
        
        new rocket.globalview.ui_shareWx({}, router);
    }

});

})(Zepto);    


(function($) {

function decode(param){
    return 'undefined' == typeof param                                                                        
        ? '' 
        // 1.0版本开始，路由参数已经decode
        : parseInt(Backbone.VERSION) < 1
            ? decodeURIComponent(param)
            : param;
}       
            
function encode(param){                                                                                       
    return 'undefined' == typeof param
        ? ''    
        : parseInt(Backbone.VERSION) < 1
            ? param                                                                                           
            : encodeURIComponent(param);                                                                      
}                   

rocket.router.summary = rocket.router.extend({

    // 路由配置
    routes: {
        /**
         * 'index/:param1/:param2': '_ROUTEHANDLER_'
         */

        '': 'index'
        , 'index':'index'
        , 'home':'home'
        , 'detail/:cid':'detail'
        , 'result':'result'
    }

    // 页面切换顺序配置
    ,pageOrder: [
        /*
        'home'
        ,'detail'
        */
    ]

    // 位置记忆，默认为false，不进行位置记忆
    ,enablePositionRestore: true

    // 默认页面切换动画
    ,defaultPageTransition: 'fade'

    // 页面切换动画配置
    ,pageTransition: {
        /**
         * @note: slide比较适用于固高切换，fade比较适用DOM树较小的两个页面切换，simple性能最好，但效果最一般，合理选择配置
         */
        // 'index-sayhello': 'slide' 

    }

    , setTitle:function(title){
        title && (
            document.title = title
        );  
    }

    , index: function(){
        this.isShared = true;
        this.doAction('index', {});
    }

    , home: function(){
        if(!this.isShared){
            window.location.href = window.location.href.replace('home', 'index');
        }
        this.doAction('home', {});
    }

    , detail: function(cid){
        if(!this.isShared){
            window.location.href = window.location.href.replace(/detail\/.*/, 'index');
        }
        this.doAction('detail', {cid:cid});
    }

    , result: function(){
        if(!this.isShared){
            window.location.href = window.location.href.replace('result', 'index');
        }
        this.doAction('result');
    }

    /**
     * action处理逻辑
     * @{param} action {string} action名称
     * @{param} params {object} action参数
     * @{param} statOptions {object} 统计选项{disable:是否屏蔽统计,默认开启;param:{key: value,key: value}}]统计参数}
     */
    ,doAction: function(action, params, statOptions){
        var me = this;
        // 必须延时，否则动画性能大打折扣
        setTimeout(function(){
            var opts = statOptions ? statOptions : {}
            if(!opts.disable){
                var statObj = _.extend({
                    "wa_type": action,
                    "act" : "switch"
                }, opts.params ? opts.params : {});
                
                //webappandroid.helper.sendStatistics(statObj);
            }
            //me.setTitle( statOptions.params && statOptions.params.title || "2014世界杯");
        }, 0);

        rocket.router.prototype.doAction.apply(this, arguments);
    }
}); 

})(Zepto);





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
(function($){

var webappandroid = window.webappandroid = window.webappandroid || {},
    conf = webappandroid.conf 
        = webappandroid.conf || {};

var classMap = [
    {id: "focus", title: "焦点",index: 0}

    // 默认北京
    ,{id: 'localnews:0:%E5%8C%97%E4%BA%AC', title: '本地', /*loc*/index: 0}

    ,{id: "enternews", title: "娱乐",index: 4}
    ,{id: "socianews", title: "社会",index: 5}
    ,{id: "mil", title: "军事",index: 14}
    ,{id: "healthnews", title: "女人",index: 21}
    ,{id: "fun", title: "搞笑",index: 19,newFlag: true}
    ,{id: "internet", title: "互联网",index: 7}
    ,{id: "technnews", title: "科技",index: 8}
    ,{id: "life", title: "生活",index: 16,newFlag: true}
    ,{id: "internews", title: "国际",index: 1}
    ,{id: "civilnews", title: "国内",index: 2}
    ,{id: "sportnews", title: "体育",index: 3}
    ,{id: "autonews", title: "汽车",index: 10}
    ,{id: "finannews", title: "财经",index: 6}
    ,{id: "housenews", title: "房产",index: 9}
    ,{id: "fashion", title: "时尚",index: 12,newFlag: true}
    ,{id: "edunews", title: "教育",index: 11}

    ,{id: "gamenews", title: "游戏",index: 13, newFlag: true}
    ,{id: "lvyou", title: "旅游",index: 15, newFlag: true}
    ,{id: "renwen", title: "人文",index: 17, newFlag: true}
    ,{id: "creative", title: "创意",index: 18, newFlag: true}

];



/**
 * 焦点： 0
 * 频道： 1-500
 * 专题： 501-999
 * 轮播图实时统计： 1000
 */
function isTopic(categoryId){
    return categoryId > 500 && categoryId < 1000;
}

function isLocalNews(type){
    return /^localnews/.test(type);
}

function getLocalId(type){
    return /^localnews:(\d+)/.test(type)
        ? RegExp.$1
        : webappandroid.local.getCityInfo().localid;
}

function getLocalName(type){
    return /^localnews:\d+:(.+)$/.test(type)
        ? RegExp.$1
        : webappandroid.local.getCityInfo().displayname;
}

function getClassMap(){
    return classMap;
}

function getClassById(id) {
    var m, cityInfo;
    for(var i = 0, iLen = classMap.length; i < iLen; i++) {
        m = classMap[i];
        if(m.id == id) {
            return m;
        }
    }

    if(isLocalNews(id)){
        m = $.extend({}, classMap[1]);
        cityInfo = webappandroid.local.getCityInfo();
        m.id = 'localnews'
            + ':' + cityInfo.localid
            // @note: 必须编码，含有中文
            + ':' + encodeURIComponent(cityInfo.displayname)

        return m;
    }


    return {};
};

function getClassTitleById(id) {
    return getClassById(id).title
        || null;
};


function getClassOrderById(id) {
    var m;
    for(var i = 0, iLen = classMap.length; i < iLen; i++) {
        m = classMap[i];
        if(m.id == id) {
            return i;
        }
    }

    if(isLocalNews(id)){
        return 1;
    }

    return 0;
};







var shareConf = {
    weibo: {
        title: "新浪微博",
        urlTemplate: [
            'http://service.weibo.com/share/share.php?url=<%=url%>'
            , 'appkey='
            , 'title=<%=title%>'
            , 'pic=&language=zh_cn'
        ].join('&')
    },
    renren: {
        title: "人人网",
        urlTemplate: [
            'http://widget.renren.com/dialog/share?resourceUrl=<%=url%>'
            , 'srcUrl=<%=url%>'
            , 'title=<%=title%>'
            , 'description='
        ].join('&')
    },
    douban: {
        title: "豆瓣",
        urlTemplate: [
            'http://shuo.douban.com/!service/share?href=<%=url%>'
            , 'name=<%=title%>'
        ].join('&')
    },
    qweibo: {
        title: "腾讯微博",
        urlTemplate: [
            'http://share.v.t.qq.com/index.php?c=share'
            , 'a=index'
            , 'url=<%=url%>'
            , 'title=<%=title%>'
        ].join('&')
    },
    qzone: {
        title: "QQ空间",
        urlTemplate: [
            'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=<%=url%>'
            , 'title=<%=title%>'
            , 'desc=&summary=&site='
        ].join('&')
    }
};

function getShareConf(){
    return shareConf;
}


// black or white list

// 首页浮层广告展现配置
// 仅在以下情况展示
var adWhiteList =[
    {name: "ald"},
    {name: "ald02"},
    {name: "mohome"},
    {name: "sohusearch"},
    {name: "wuxiandaquan"},
    {name: "ffmarket"}
];

// 支持的浏览器品牌
var browserWhitePattern = /UC|MQQBrowser|baidubrowser/i;

// 应用推广链接地址配置
var newRecUrlList = [
    {name: "uc01"}
];

// 轮播图上方、正文页上方、搜索结果页上方banner展现配置
var bannerADBlackList = [
    "newsclient"
];

// 首页底部推广黑名单
var indexFooterADBlackList = [
    "newsclient"
];

// 无图模式按钮黑名单
var noImageBtnBlackList = [
    "newsclient"
];

// 无图模式按钮黑名单
var carouselADBlackList = [
    "newsclient"
];

function _isInArray(value, array){
    return array.indexOf(value) >= 0
        ? true : false;
}

function hasNoImageBtn(){
    var fr = webappandroid.helper.queryParam('fr');
    return !_isInArray(fr, noImageBtnBlackList);
}


// 初始化无图模式
function initNoImageMode(){
    var speed = window.userSpeed,
        numFlag,
        field= 'NEWS_NO_IMAGE',

        // 获取是否已经显示过的标记1为显示过，否则没显示
        // showImage是否有图， noticetxt提示文本， lifetime提示周期(分钟)
        MODE_ARRAY= {
            // 无图模式,用户主动点击
            '0': { showImage: 0, noticetxt: '无图模式', lifetime: 24* 60* 30},
            // 有图模式,用户主动点击
            '1': { showImage: 1, noticetxt: '有图模式', lifetime: 24* 60* 30},
            
            // 2g网络无图模式且有提示,根据网络判断
            '2g': { showImage: 0, noticetxt: '您的网速较慢，已经为您切换到省流量模式', lifetime: 24* 60},
            // 3g有图模式且有提示,根据网络判断
            '3g': { showImage: 1, noticetxt: '您可以切换为无图模式，更省流量', lifetime: 24* 60},
            // wifi有图模式,根据网络判断
            'wifi': { showImage: 1, noticetxt: '', lifetime: 24* 60}
        },
        mode;

    // 默认有图模式
    mode = MODE_ARRAY[1];
    numFlag = parseInt($.localStorage(field));

    // 如果是数字则用户已经点击过
    if(!isNaN(numFlag)){
        // 这一步为了兼容老版本===>-1：有图；0：切换有图；1：切换无图；2：无图
        numFlag = numFlag == -1 ? 1 : numFlag == 2 ? 0 : numFlag;
        mode = MODE_ARRAY[numFlag];
    // 根据网络环境给提示
    }else if(speed && !isNaN(+speed) ){
        // 用来判断是否已经显示过notice
        // 设置24小时
        // 网速信息 <300为 wifi\<300为3g\<300为2G
        numFlag = speed < 300 ? 'wifi' : speed  < 800 ? '3g' : '2g';
        mode = MODE_ARRAY[numFlag];
    }

    webappandroid.MODE_NOIMAGE = mode;
}



// search products list

var searchProductList = [
    {
        id: "wangye",
        text: "网页",
        key : "word",
        url: "http://m.baidu.com/s?bd_page_type=1&ssid=0&from=0&uid=&fr=news"
    },
    {
        id: "tupian",
        text: "图片",
        key : "word",
        url: "http://m.baidu.com/img?tn=bdlistiphone&itj=41&bd_page_type=1&ssid=0&from=0&fr=news"
    },
    {
        id: "shipin",
        text: "视频",
        key : "word",
        url: "http://m.baidu.com/video?bd_page_type=1&ssid=0&uid=&from=0&fr=news"
    },
    {
        id: "tieba",
        text: "贴吧",
        key : "kw",
        url: "http://wapp.baidu.com/s?bd_page_type=1&ssid=&uid=&from=0&fr=news"
    },
    {
        id: "zhidao",
        text: "知道",
        key : "word",
        url: "http://wapiknow.baidu.com/index?st=3&bd_page_type=1&ssid=&uid=&from=0&fr=news"
    },
    {
        id: "wenku",
        text: "文库",
        key : "word",
        url: "http://wk.baidu.com/search?st=3&bd_page_type=1&ssid=&uid=&from=0&fr=news"
    },
    {
        id: "baike",
        text: "百科",
        key : "word",
        url: "http://wapbaike.baidu.com/search?st=3&bd_page_type=1&ssid=&uid=&from=0&fr=news"
    },
    {
        id: "kongjian",
        text: "空间",
        key : "",
        url: "http://i.hi.baidu.com/?bd_page_type=1&ssid=0&from=0&uid=&fr=news"
    },
    {
        id: "yinyue",
        text: "音乐",
        key : "key",
        url: "http://music.baidu.com/s?itn=baidump3mobile&ct=671088640&rn=20&gate=33&ie=utf-8&bd_page_type=1&ssid=&uid=&from=0&fr=news"
    },
    {
        id: "ditu",
        text: "地图",
        key : "word",
        url: "http://map.baidu.com/m?itj=45&ssid=0&from=0&bd_page_type=1&uid="
    },
    {
        id: "yingyong",
        text: "应用",
        key : "word",
        url: "http://m.baidu.com/ssid=0/from=0/bd_page_type=1/s?st=10a001"
    },
    {
        id: "lvyou",
        text: "旅游",
        key : "word",
        url: "http://lvyou.baidu.com/search/webapp/scene?fr=news&ssid=0&from=0&bd_page_type=1&uid=&font=0&step=1"
    }
];

function getSearchProductList(){
    return searchProductList;
}



/**
 * weather icons config
 */

var weatherIcons = {
    'heavy_snow': /^暴雪|^大雪/
    , 'moderate_snow': /^中雪/ 
    , 'light_snow': /^小雪/
    , 'snow_shower': /^阵雪/

    , 'heavy_rain': /^暴雨|^大暴雨|^大雨|^特大暴雨/
    , 'moderate_rain': /^中雨/
    , 'shower': /^阵雨/
    , 'light_rain': /^小雨/
    , 'thunder_shower': /^雷阵雨/

    , 'sleet': /^雨夹雪|冻雨/

    , 'cloudy': /^多云/
    , 'overcast': /^阴$|^阴天|^晴转/
    , 'sunny': /^晴$|^晴天|^阴转/
    , 'fog': /^雾/
    , 'dust': /^扬尘|^浮尘|^霾转/
    , 'sand_storm': /^沙尘暴|^强沙尘暴/
    , 'weather_default': /.*/
};

var iconRoot = '/static/news/webapp/webappandroid/page/index/img/weather-icons/';
var defaultCityImage = 'http://d.hiphotos.baidu.com/news'
        + '/pic/item/8cb1cb1349540923174783549058d109b3de49ea.jpg';

function getWeatherIcon(info){
    var icons = weatherIcons;

    for(var i in icons){
        if(icons[i].test(info)){
            return iconRoot + i + '.png';
        }
    }

    return iconRoot + 'weather_default' + '.png';
}

function getDefaultCityImage(){
    return defaultCityImage;
}


// 添加评论相关操作
var commentContentKey = 'NEWS_COMMENT_CONTENT',
    commentIdKey = 'NEWS_COMMENT_ID',
    commentContentOvertime = 30 * 60 * 1000,
    commentContent;

var commentPraiseKey = 'NEWS_COMMENT_PRAISE',
    commentPraiseOvertime = 24 * 60 * 60 * 1000,
    commentPraise;

function getCommentContent () {
    var commentData
        = webappandroid.helper.storageGet(commentContentKey);

    if(commentData){
        commentContent = JSON.parse(
            webappandroid.helper.storageGet(commentContentKey)
        );
    }

    if (!commentContent) {
        commentContent = $.extend({
            time: new Date().getTime()
        }, commentContent);
    }
    else if ((commentContent.time + commentContentOvertime) < new Date().getTime()) {
        commentContent = $.extend({
            time: new Date().getTime()
        }, {});
    }
    return commentContent;
}

function getCommentContentInfo (key) {
    getCommentContent();
    return commentContent[key];
}

function _saveCommentContent () {
    webappandroid.helper.storageSet(
        commentContentKey, JSON.stringify(commentContent)
    );
}

function setCommentContent (key, val) {
    getCommentContent();
    commentContent[key] = val;
    _saveCommentContent();
}

function delCommentContentInfo (key) {
    getCommentContent();
    delete commentContent[key];
    _saveCommentContent();
}

function getCommentPraise () {
    var commentData
        = webappandroid.helper.storageGet(commentPraiseKey);

    if(commentData){
        commentPraise = JSON.parse(
            webappandroid.helper.storageGet(commentPraiseKey)
        );
    }

    if (!commentPraise) {
        commentPraise = $.extend({
            time: new Date().getTime()
        }, commentPraise);
    }
    else if ((commentPraise.time + commentPraiseOvertime) < new Date().getTime()) {
        commentPraise = $.extend({
            time: new Date().getTime()
        }, {});
    }
    return commentPraise;
}

function _saveCommentPraise () {
    webappandroid.helper.storageSet(
        commentPraiseKey, JSON.stringify(commentPraise)
    );
}

function addCommentPraise (key) {
    getCommentPraise();
    commentPraise[key] = true;
    _saveCommentPraise();
}





    


// interface
$.extend(conf, {
    getClassMap: getClassMap 
    ,getClassById: getClassById 
    ,getClassTitleById: getClassTitleById
    ,getClassOrderById: getClassOrderById
    ,isTopic: isTopic
    ,isLocalNews: isLocalNews
    ,getLocalId: getLocalId
    ,getLocalName: getLocalName

    ,getShareConf: getShareConf

    ,hasNoImageBtn: hasNoImageBtn

    ,initNoImageMode: initNoImageMode

    ,getSearchProductList: getSearchProductList

    ,getWeatherIcon: getWeatherIcon
    ,getDefaultCityImage: getDefaultCityImage

    ,getCommentContent: getCommentContent
    ,getCommentContentInfo: getCommentContentInfo
    ,setCommentContent:setCommentContent
    ,delCommentContentInfo: delCommentContentInfo

    ,getCommentPraise: getCommentPraise
    ,addCommentPraise: addCommentPraise

});


})(Zepto);

(function($){

var webappandroid = window.webappandroid = window.webappandroid || {},
    helper = webappandroid.helper 
        = webappandroid.helper || {};

function _zeroPadding(num){
    return ( num < 10 ? '0' : '' ) + num; 
}

function getFormatedDate(ms) {
    if(String(ms).length < 13){
        ms = Number(ms) * 1000;
    }
    var d_minutes, d_hours, d_days, d_secend;
    var timeNow = new Date().getTime();
    var d = (timeNow - ms)/1000;
        d_days = Math.round(d / (24*60*60));
        d_hours = Math.round(d / (60*60));
        d_minutes = Math.round(d / 60);
        d_secend = Math.round(d);
    if ( d < 0 ){
        return "1分钟前";
    }else if (d_days > 0 && d_days < 4) {
        return d_days + "天前";
    } else if (d_days <= 0 && d_hours > 0) {
        return d_hours + "小时前";
    } else if (d_hours <= 0 && d_minutes > 0) {
        return d_minutes + "分钟前";
    } else if (d_minutes <= 0 && d_secend > 0) {
        return d_secend + "秒钟前";
    } else if (d_secend == 0) {
        return "刚刚";
    } else {
        var s = new Date();
            s.setTime(ms);
        return s.getFullYear() 
            + "-" + _zeroPadding( s.getMonth() + 1 ) 
            + "-" + _zeroPadding( s.getDate() ) 
            + " " + _zeroPadding( s.getHours() ) 
            + ":" + _zeroPadding( s.getMinutes() );
    }
}

function getFormatedDate2(ms) {
    if(String(ms).length < 13){
        ms = Number(ms) * 1000;
    }
    var d_minutes, d_hours, d_days, d_secend;
    var timeNow = new Date().getTime();
    var d = (timeNow - ms)/1000;
        d_days = Math.round(d / (24*60*60));
        d_hours = Math.round(d / (60*60));
        d_minutes = Math.round(d / 60);
        d_secend = Math.round(d);
    
    var s = new Date();
        s.setTime(ms);
    return s.getFullYear() 
        + "-" + _zeroPadding( s.getMonth() + 1 ) 
        + "-" + _zeroPadding( s.getDate() ) 
        + " " + _zeroPadding( s.getHours() ) 
        + ":" + _zeroPadding( s.getMinutes() );
    
}

/**
 * 1. 使用同一个link标签发送统计请求，如果两个统计请求几乎同时发出，
 *   可能导致其中一个pending，从而丢失。
 * 2. 使用image对象，每个请求单独使用一个image，能解决1描述的问题，但image统计可能
 *   受无图模式影响，根本发送不出去
 * 3. 使用队列方式，设定一个时间间隔，该间隔内，后续的请求需等待。不过这存在一个问题，
 *   为了让请求尽快发送出去，这个时间间隔会比较小，网络状态较差情况下，仍然可能存在丢失
 * 4. 使用link标签，每个请求单独使用一个link标签，指定时间后将link标签删除。该时间间隔
 *   可以设置得较大，尽可能使较差网络环境下也能发送出去
 */
function _sendStatData(params){

    setTimeout(function(){

        var $statLink = $('<link rel="stylesheet" />');
        $('head').append($statLink);

        $statLink.attr(
            'href'
            ,[
                'http://nsclick.baidu.com/v.gif?pid=107&wise=1&from=webapp_ipad'
                ,$.param(params)
                ,(new Date()).getTime()
            ].join('&')
        );

        setTimeout(function(){
            $statLink.remove();
        }, 5000);

    },0);

}

function _sendStat(params, instantly/*optional*/){

    if(!instantly){
        setTimeout(function(){
            _sendStatData(params);
        }, 0);
    }
    else{
        _sendStatData(params);
    }

}

function _sendStatByType(type, params, instantly/*optional*/){
    _sendStat(
        $.extend(
            {
                'stat_type': type 
            }
            ,params
        )
        ,instantly
    );
}

function sendPVStat(params, instantly/*optional*/){
    _sendStatByType('pv', params, instantly);
}

function sendClickStat(params, instantly/*optional*/){
    _sendStatByType('click', params, instantly);
}

function sendActStat(params, instantly/*optional*/){
    _sendStatByType('act', params, instantly);
}

function sendInfoStat(params, instantly/*optional*/){
    _sendStatByType('info', params, instantly);
}






//cookie methods from Tangram
function cookieIsValidKey(key) {
    // http://www.w3.org/Protocols/rfc2109/rfc2109
    // Syntax:  General
    // The two state management headers, Set-Cookie and Cookie, have common
    // syntactic properties involving attribute-value pairs.  The following
    // grammar uses the notation, and tokens DIGIT (decimal digits) and
    // token (informally, a sequence of non-special, non-white space
    // characters) from the HTTP/1.1 specification [RFC 2068] to describe
    // their syntax.
    // av-pairs   = av-pair *(";" av-pair)
    // av-pair    = attr ["=" value] ; optional value
    // attr       = token
    // value      = word
    // word       = token | quoted-string
    
    // http://www.ietf.org/rfc/rfc2068.txt
    // token      = 1*<any CHAR except CTLs or tspecials>
    // CHAR       = <any US-ASCII character (octets 0 - 127)>
    // CTL        = <any US-ASCII control character
    //              (octets 0 - 31) and DEL (127)>
    // tspecials  = "(" | ")" | "<" | ">" | "@"
    //              | "," | ";" | ":" | "\" | <">
    //              | "/" | "[" | "]" | "?" | "="
    //              | "{" | "}" | SP | HT
    // SP         = <US-ASCII SP, space (32)>
    // HT         = <US-ASCII HT, horizontal-tab (9)>
        
    return (new RegExp("^[^\\x00-\\x20\\x7f\\(\\)<>@,;:\\\\\\\"\\[\\]\\?=\\{\\}\\/\\u0080-\\uffff]+\x24")).test(key);
};

function cookieGetRaw(key) {
    if (cookieIsValidKey(key)) {
        var reg = new RegExp("(^| )" + key + "=([^;]*)(;|\x24)"),
            result = reg.exec(document.cookie);
            
        if (result) {
            return result[2] || null;
        }
    }

    return null;
};

function cookieGet(key) {
    var value = cookieGetRaw(key);
    if ('string' == typeof value) {
        value = decodeURIComponent(value);
        return value;
    }
    return null;
};


function cookieSetRaw(key, value, options) {
    if (!cookieIsValidKey(key)) {
        return;
    }
    
    options = options || {};
    //options.path = options.path || "/"; // meizz 20100402 设定一个初始值，方便后续的操作
    //berg 20100409 去掉，因为用户希望默认的path是当前路径，这样和浏览器对cookie的定义也是一致的
    
    // 计算cookie过期时间
    var expires = options.expires;
    if ('number' == typeof options.expires) {
        expires = new Date();
        expires.setTime(expires.getTime() + options.expires);
    }
    
    document.cookie =
        key + "=" + value
        + (options.path ? "; path=" + options.path : "")
        + (expires ? "; expires=" + expires.toGMTString() : "")
        + (options.domain ? "; domain=" + options.domain : "")
        + (options.secure ? "; secure" : ''); 
};

function cookieSet(key, value, options) {
    cookieSetRaw(key, encodeURIComponent(value), options);
};

function cookieRemove(key, options) {
    options = options || {};
    options.expires = new Date(0);
    cookieSetRaw(key, '', options);
};

function cookieTest(){
    var key = '_webappandroid_cookie_test',
        value = 'ok';

    cookieSet(key, value);
    if(value == cookieGet(key)){
        cookieRemove(key);
        return true;
    }

    return false;
}



//设置localstorage/cookie值
function storageSet(key, value, options){
    try {
        window.localStorage.setItem(key, value);
    }
    catch(e) {
        cookieSet(key, value, options);
    }
}

//获取localstorage/cookie值
function storageGet(key){
    try {
        return window.localStorage.getItem(key);
    }
    catch(e) {
        return cookieGet(key);
    }
}

function storageRemove(key){
    try {
        window.localStorage.removeItem(key);
    }
    catch(e) {
        cookieRemove(key);
    }
}

function storageTest(){
    var key = '_webappandroid_storage_test',
        value = 'ok';

    storageSet(key, value);
    if(value == storageGet(key)){
        storageRemove(key);
        return true;
    }

    return false;
}




function localStorageSet(key, value){
    try {
        window.localStorage.setItem(key, value);
        return true;
    }
    catch(e){
        return false;
    }
}

function localStorageGet(key){
    try {
        return window.localStorage.getItem(key);
    }
    catch(e){
        return '@@--not_from_localstorage--@@';
    }
}

function localStorageRemove(key){
    try {
        window.localStorage.removeItem(key);
        return true;
    }
    catch(e) {
        return false;
    }
}

function localStorageTest(){
    var key = '_webappandroid_localstorage_test',
        value = 'ok';

    if(!localStorageSet(key, value)) return false;
    if(value == localStorageGet(key)){
        localStorageRemove(key);
        return true;
    }

    return false;
}



function generateTransform(x, y, z) {
    return "translate" + (rocket.has3d ? "3d" : "") + "(" + x + "px, " + y + "px" + (rocket.has3d ? (", " + z + "px)") : ")");
};

function slideAnimate(
    currentEle, nextEle, dir, 
    callback) {

    if(dir === 0) {
        if(currentEle != nextEle) {
            // @note: 先隐藏当前，避免当前页面残留，确保切换效果
            currentEle && $(currentEle).hide();
            setTimeout(function(){
                nextEle && $(nextEle).show();
            }, 0);
        }

        callback && callback();
        return;
    }

    // 准备位置
    nextEle = $(nextEle);
    currentEle = $(currentEle);
    
    var clientWidth = document.documentElement.clientWidth;

    currentEle.css({
        "-webkit-transition-property": "-webkit-transform",
        "-webkit-transform": generateTransform(0, 0, 0), 
        "-webkit-transition-duration": "0ms",
        "-webkit-transition-timing-function": "ease-out",
        "-webkit-transition-delay": "initial",
    });
    nextEle.css({
        "-webkit-transition-property": "-webkit-transform",
        "-webkit-transform": generateTransform((dir === 1 ? "" : "-") + clientWidth, 0, 0), 
        "-webkit-transition-duration": "0ms",
        "-webkit-transition-timing-function": "ease-out",
        "-webkit-transition-delay": "initial",
        "display": "block",
    });

    setTimeout(function() {

        function endAllTransition(){

            currentEle.css({
                "display": "none",
                "-webkit-transform": generateTransform(0, 0, 0), 
                "-webkit-transition-duration": "0ms"
            });
            nextEle.css({
                "display": "block",
                "-webkit-transform": generateTransform(0, 0, 0), 
                "-webkit-transition-duration": "0ms"
            });

        }

        // 开始动画
        nextEle.css({
            "-webkit-transform": generateTransform(0, 0, 0), 
            "-webkit-transition-duration": "350ms"
        });

        currentEle.css({
            "-webkit-transform": generateTransform((dir === 1 ? "-" : "") + clientWidth, 0, 0), 
            "-webkit-transition-duration": "350ms"
        });

        setTimeout(function(){
            setTimeout(function(){
                endAllTransition();
                callback && callback();
            }, 0);
        }, 400);

    }, 0);
    
};


// 根据浏览器区分高低端版,true高端版。fasle低端版
function checkSoe(){
    return /Android.*baidubrowser/.test(navigator.userAgent);
};

function getCarouselImageUrl(item){
    if(!item){
        return '';
    }

    return [
        '#page'
        //1000：轮播图正文实时统计（弃用）
        //2：原创新闻类型并支持正文实时监控
        , "2"
        // 支持原创新闻空URL
        , item.url == '' 
            ? 'emptyurl:' + item.nid 
            : encodeURIComponent(item.url) 
        , encodeURIComponent(item.title)
        , encodeURIComponent(item.site || "-")
        , item.ts 
        , item.nid 
    ].join('/');
}


// 保留b标签，其他<>全部转义，解决正文页内容可能包含html标签的问题
function filterHTMLTag(data){
    data = data.replace(/<([ac-z]|\w{2,})/gi, "&lt;$1");
    return data.replace(/([ac-z]|\w{2,})>/gi, "$1&gt;");
}


function getAngle(x1, y1, x2, y2) {
    // 直角的边长
    var x = Math.abs(x1 - x2);
    var y = Math.abs(y1 - y2);
    // 斜边长
    var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    // 余弦
    var cos = y / z;
    // 弧度
    var radina = Math.acos(cos);
    // 角度
    var angle =  180 / (Math.PI / radina);
    return angle;
}

function queryParam(key){
    return (document.location.search.match(new RegExp("(?:^\\?|&)"+key+"=(.*?)(?=&|$)"))||['',null])[1];
}

function fixStartupImage(){
    if ($.os.ios
        && window.devicePixelRatio >= 2 
        && $.browser.version >= 5){
        $('head').append($(
'<link rel="apple-touch-startup-image" href="http://wap.baidu.com/static/news/webapp/img/startup_640_920.jpg" />'
        ));
    }
}






// native app related

function invoke(method, queryString, onsuccess, onfail) {
    var responsed = false,
        hostUrl = 'http://127.0.0.1:6259/',
        url = hostUrl + method + '?' + queryString;

    $.ajax({
        url: url,
        dataType: 'jsonp',
        success: function(data){
            responsed = true;
            if(data.error == 0) {
                typeof(onsuccess) == "function" && onsuccess(data);
            }
            else {
                typeof(onfail) == "function" && onfail();
            }
        },
        error: function(xhr, type){
            if(!responsed) {
                responsed = true;
                typeof(onfail) == "function" && onfail();
            }
        }
    });

    //超时策略
    var tid = setTimeout(function(){
        if(!responsed) {
            responsed = true;
            typeof(onfail) == "function" && onfail();
            if(tid) {
                clearTimeout(tid);
                tid = null;
            }
        }
    }, 2000);
}

function checkNewsClient (onsuccess, onfail) {
    invoke(
        "getpackageinfo"
        , "packagename=com.baidu.news"
        , onsuccess
        , onfail
    );
} 

function invokeApp(intent, appURL) {
    invoke('sendintent', 'intent='+encodeURIComponent(intent), null,
        function(){
            if(appURL){
                location.href = appURL;
            }
        });
}

// app.helper.invokeGame
function setupInvokeGame(selector, act, downloadURL, siteURL) {
    $(selector).off("click");
    $(selector).on("click", function() {
        var $el = $(selector),
            intent = "#Intent;launchFlags=0x10000000;component=com.baidu.gamebox/.SplashActivity;end",
            _act = act || $el.data("act"),
            _downloadURL = downloadURL || $el.data("app"),
            url = siteURL || $el.data("url");

        //apk不存在，直接打开网页
        if(!_downloadURL) {
            window.open(url);
            return;
        }
        invokeApp(intent, _downloadURL);

        //点击量统计
        if(_act) {
            _ss({act: _act});
        }
    });
}
    
// app.helper.openapp
function setupInvokeApp(selector, act, downloadURL, newsURL) {
    $(selector).off("click");
    $(selector).on("click", function(){
        var $el = $(selector),
            _act = act || $el.data("act"),
            _downloadURL = downloadURL || $el.data("app"),
            searchurl = newsURL || $el.data("url"),
            intent = '#Intent;action=com.baidu.news.detail;launchFlags=0x10000000;component=com.baidu.news/.ui.NewsDetailActivity;S.topic=搜索;S.news_url=' + encodeURIComponent(searchurl) + ';i.news_from=15;S.nid=1;end';

        //console.log(searchurl);
        //不存在客户端url时，以外链方式打开新闻url
        if(!_downloadURL) {
            window.open(searchurl);
            return;
        }

        invokeApp(intent, _downloadURL);

        //点击量统计
        if(_act) {
            _ss({act: _act});
        }
    });
}

function _openNewsClient(appURL){
    var intent = '#Intent;action=android.intent.action.MAIN;launchFlags=0x10000000;component=com.baidu.news/.ui.IndexActivity';
    invoke('sendintent', 'intent='+encodeURIComponent(intent), null,
        function(){
            if(appURL){
                location.href = appURL;
            }
        });
}



/**
 * statistics related
 */

function clickHandler(el, e, newWindow){
    var el = $(el);
        src = el.data("href"),
        act = el.data("act");

    sendStatistics({act: act});
    
    // 若新窗口打开，可以指定非false的newWindow
    if(newWindow) {
        window.open(src);
    }
    else {
        setTimeout(function(){
            location.href = src;
        }, 300);
    }
    
    // 若要阻止事件冒泡，可以指定事件参数
    if(e) {
        e.stopPropagation();
    }
}

var sendStatistics = (function(){
    var cache = {}, c_length = 0, lock = false;


    // @note: options的value需自行做URL编码
    return function(options) {
        // 避免短时间内多次修改css link造成之前的统计发不出去
        var cache_id = (new Date()).getTime();
        cache[cache_id] = options;
        c_length++;

        exe();
    }
    function exe() {
        if(!c_length) return;

        var t;
        if(!lock) {
            lock = true;
            for(var key in cache) {
                (function(){
                    t = setTimeout(function(){
                        stat(key);
                        delete(cache[key]);
                        c_length--;
                        lock = false;
                        exe();
                        delete(t);
                    }, 100);
                })();
                break;
            }
        }
    }

    function stat(cache_id) {
        if(!cache[cache_id]) return;
        var link = $("#statLink"),
            time = cache_id,
            fr = queryParam("fr"), 
            fr = fr ? fr : "",
            queryString = "",
            soe = (checkSoe() ? 1 : 2),
            //no image mode
            //m_ni = "0",
            options = cache[cache_id];

        for(opt in options) {
            // 注意：参数不再进行URL编码
            queryString += (opt + "=" + options[opt] + "&");
        }
        queryString = queryString.replace(/&$/, '');

        // 无图模式状态
        /*if(webappandroid.MODE_NOIMAGE.showImage === 0) {
            m_ni = "1";
        }*/

        link.attr(
            'href', 
            [
                'http://nsclick.baidu.com/v.gif?pid=107&wise=1'
                , 'from=' 
                    + ( webappandroid.helper.isBdbox
                        ? 'shijiebeibdbox' : 'shijiebeiwebapp' ) 
                , queryString
                , 'fr=' + fr 
                //, 'soe=' + soe
                //, 'm_ni=' + m_ni  //有图无图模式切换
                , 't=' + time
            ].join('&')
        );
    }

})();


/**
 * baiduloc related
 * Cookie格式： BAIDULOC=12936521_4580521_1000_149_1383542366651
 *                       墨卡托X_墨卡托Y_精度_CityCode_时间戳
 *    百度墨卡托坐标系(bd09mc)：X: 12936521
 *                              Y: 4580521
 */

function getLocInfoFromCookie(){
    var locStr = cookieGet('BAIDULOC'),
        tmp, 
        info = {};

    if(locStr){
        tmp = locStr.split('_');
        if(tmp.length == 5){
            info.mcx = tmp[0];
            info.mcy = tmp[1];
            info.citycode = tmp[3];
            info.ts = tmp[4];
            return info;
        }
        else{
            return null;
        }
    }
    else{
        return null;
    }
}

// 走终端适配
function _isIOS(){
    if(typeof window.showType != 'undefined'
        && 'iphone' == window.showType){
        return true;
    }
    return false;
}

var _isBdbox = (function(){
    return navigator.userAgent.indexOf("baiduboxapp") != -1;
    //return true;
})();




// interface
$.extend(helper, {
    getFormatedDate: getFormatedDate 
    ,getFormatedDate2: getFormatedDate2       
    ,sendPV: sendPVStat
    ,sendClick: sendClickStat
    ,sendAct: sendActStat
    ,sendInfo: sendInfoStat

    ,storageSet: storageSet
    ,storageGet: storageGet
    ,storageRemove: storageRemove
    ,storageTest: storageTest

    ,cookieSet: cookieSet
    ,cookieGet: cookieGet
    ,cookieRemove: cookieRemove

    ,localStorageSet: localStorageSet
    ,localStorageGet: localStorageGet
    ,localStorageRemove: localStorageRemove
    ,localStorageTest: localStorageTest

    ,slideAnimate: slideAnimate

    ,checkSoe: checkSoe
    ,getCarouselImageUrl: getCarouselImageUrl

    ,filterHTMLTag: filterHTMLTag
    ,getAngle: getAngle
    ,queryParam: queryParam
    ,fixStartupImage: fixStartupImage

    ,invokeApp: invokeApp
    ,setupInvokeGame: setupInvokeGame
    ,setupInvokeApp: setupInvokeApp
    ,checkNewsClient: checkNewsClient
    ,openNewsClient: _openNewsClient 

    ,clickHandler: clickHandler
    ,sendStatistics: sendStatistics

    ,getLocInfoFromCookie: getLocInfoFromCookie

    ,isIOS: _isIOS

    ,isBdbox: _isBdbox
});


// 对应旧版app.vv
window._ch = webappandroid.helper.clickHandler;
// 对应旧版app.v
window._ss = webappandroid.helper.sendStatistics;

})(Zepto);

(function($){

var webappandroid = window.webappandroid = window.webappandroid || {},
    _local = webappandroid.local 
        = webappandroid.local || {};


/*********************************************** 
 * 定位城市信息相关
 */

// 默认城市信息
var _defaultCityInfo = {
    localid: '0'
    , displayname: '北京'
};

var _cityInfoKey = 'NEWS_CITY_INFO',
    _gpsCityInfoKey = 'NEWS_GPS_CITY_INFO';

// 推荐城市信息，初始化为默认城市信息
var _cityInfo = $.extend({}, _defaultCityInfo);

// GPS定位的城市信息
var _gpsCityInfo = null;

// GPS定位失败标志
var _gpsFailed = false;


/**
 * 1. 推荐城市信息可能随GPS定位而变化
 * 2. 使用getCityInfo函数获取最新的推荐城市信息
 * 3. 推荐城市将综合考虑用户设置、GPS定位、默认设置后得到
 */
function getCityInfo(){
    /**
     * 第一优先：用户设置
     * 第二优先：GPS定位
     * 第三优先：默认
     */
    if(isUserSetCityInfo()){
        return _cityInfo;
    }
    else{
        return _gpsCityInfo || _defaultCityInfo;
    }
}

// 设置城市信息，只影响当前会话
function setCityInfo(localId, displayName){
    _cityInfo.localid = localId;
    _cityInfo.displayname = displayName;
}

function getGpsCityInfo(){
    return _gpsCityInfo;
}

function setGpsCityInfo(localId, displayName){
    _gpsCityInfo = {
        localid: localId
        , displayname: displayName
    };
}

// 保存城市信息，保存至客户端存储
function saveCityInfo(localId, displayName){
    setCityInfo.apply(this, arguments);
    webappandroid.helper.localStorageSet(
        _cityInfoKey
        , JSON.stringify(_cityInfo)
    );
}

function saveGpsCityInfo(localId, displayName, timeStamp){
    setGpsCityInfo.apply(this, arguments);

    _gpsCityInfo.ts = timeStamp;
    webappandroid.helper.localStorageSet(
        _gpsCityInfoKey
        , JSON.stringify(_gpsCityInfo)
    );
}

// 从客户端存储同步城市信息，成功返回true，否则false 
function syncCityInfo(){
    var cityInfoStr;
            
    cityInfoStr 
        = webappandroid.helper.localStorageGet(_cityInfoKey);

    if(cityInfoStr){
        try{
            _cityInfo = JSON.parse(cityInfoStr);
            return true;
        }
        catch(e){
            _cityInfo = $.extend({}, _defaultCityInfo);
            webappandroid.helper.localStorageRemove(_cityInfoKey);
        }
    }

    return false;
}

function isUserSetCityInfo(){
    return syncCityInfo();
}

function getGpsCityInfoVersion(){
    var cityInfoStr,
        info = null;
            
    cityInfoStr 
        = webappandroid.helper.localStorageGet(_gpsCityInfoKey);

    if(cityInfoStr){
        try{
            info = JSON.parse(cityInfoStr);
        }
        catch(e){
            webappandroid.helper.localStorageRemove(_gpsCityInfoKey);
        }
    }

    return info && info.ts;
}

// 从客户端存储同步GPS城市信息，成功返回true，否则false 
function syncGpsCityInfo(){
    var cityInfoStr;
            
    cityInfoStr 
        = webappandroid.helper.localStorageGet(_gpsCityInfoKey);

    if(cityInfoStr){
        try{
            _gpsCityInfo = JSON.parse(cityInfoStr);
            return true;
        }
        catch(e){
            _gpsCityInfo = null;
            webappandroid.helper.localStorageRemove(_gpsCityInfoKey);
        }
    }

    return false;
}

function setGpsFailed(){
    _gpsFailed = true;
}

function getGpsFailed(){
    return _gpsFailed;
}

// interface
$.extend(_local, {

    getCityInfo: getCityInfo
    ,setCityInfo: setCityInfo
    ,getGpsCityInfo: getGpsCityInfo
    ,setGpsCityInfo: setGpsCityInfo
    ,saveCityInfo: saveCityInfo
    ,syncCityInfo: syncCityInfo
    ,isUserSetCityInfo: isUserSetCityInfo
    ,saveGpsCityInfo: saveGpsCityInfo
    ,getGpsCityInfoVersion: getGpsCityInfoVersion
    ,syncGpsCityInfo: syncGpsCityInfo
    ,setGpsFailed: setGpsFailed
    ,getGpsFailed: getGpsFailed

});


})(Zepto);

(function($){

var webappandroid = window.webappandroid = window.webappandroid || {},
    _login = webappandroid.login 
        = webappandroid.login || {};


function _getBDUSS(){
    return webappandroid.helper.cookieGet('BDUSS');
}

function _isLoggedIn(){
    return !!_getBDUSS();
}

// interface
$.extend(_login, {

    getBDUSS: _getBDUSS
    , isLoggedIn: _isLoggedIn

});


})(Zepto);


(function(){
    var webappandroid 
        = window.webappandroid = window.webappandroid || {};

    var touches,
        isBusy = false,

        isDrag = false,

        scrollThreshold = 46,

        lastTouchPos = {x:0, y:0},
        touchOffset = {x:0, y:0},
        
        lastPos = {top:0, left:0},
        limitPos = {minTop: 0, maxTop: 0},

        $placeholder = $('<li></li>'),
        $currentHandle = null,
        $currentBox = null,
        lastPlaceholderIndex = 0;

    function startDrag(evt, handle, box, onDropdown){
        var $handle = $(handle),
            $box = box ? $(box) : $handle;

        cleanDrag($currentHandle, $currentBox, onDropdown);
        $currentBox = $box;
        $currentHandle = $handle;
        isDrag = true;

        initLastPos($box);
        initLimitPos($box);
        initLastPlaceholderIndex($box);
        initScrollThreshold($box);
        initTouchOffset();

        updateLastTouchPos(evt.targetTouches);

        addPlaceholder($box);
        updatePos($box, touchOffset);
        $box.addClass('moving');
        evt.preventDefault();

        $handle
        .on('touchmove', function(e){
            if(!isBusy){
                isBusy = true;
                touches = e.targetTouches;
                updateTouchOffset(touches);

                updateLastTouchPos(touches);
                updatePos($box, touchOffset);
                movePlaceholder();

                scrollIntoView($box, touches);

                // throttle processing
                setTimeout(function(){
                    isBusy = false;
                }, 30);
            }
            e.preventDefault();
        })
        .on('touchend', function(e){
            touches = e.changedTouches;
            e.preventDefault();
            cleanDrag($handle, $box, onDropdown);
        });
    }

    function cleanDrag($handle, $box, onDropdown){
        if(isDrag){
            $handle.off('touchmove touchend');
            removePlaceholder($box);
            $box.removeClass('moving');
            onDropdown && onDropdown($box, $box.index());
            isDrag = false;
        }
    }

    function addPlaceholder($box){
        $placeholder.insertBefore($box);
    }

    function movePlaceholder(){
        var index 
                = Math.floor(lastPos.top / scrollThreshold + 0.5),
            i;

        // console.log(index + ' ' + lastPlaceholderIndex);
        if(index > lastPlaceholderIndex){
            i = index - lastPlaceholderIndex;
            $next = $placeholder.next();
            if($next.hasClass('moving')){
                $next = $next.next();
            }

            while(--i > 0){
                $next = $next.next();
                if($next.hasClass('moving')){
                    $next = $next.next();
                }
            }
            $placeholder.insertAfter($next);
            lastPlaceholderIndex = index;
        }
        else if(index < lastPlaceholderIndex){
            i = lastPlaceholderIndex - index;
            $prev = $placeholder.prev();
            if($prev.hasClass('moving')){
                $prev = $prev.prev();
            }
            while(--i > 0){
                $prev = $prev.prev();
                if($prev.hasClass('moving')){
                    $prev = $prev.prev();
                }
            }
            $placeholder.insertBefore($prev);
            lastPlaceholderIndex = index;
        }
    }

    function removePlaceholder($box){
        $box.insertBefore($placeholder);
        $placeholder.remove();
        $box.css({
            position: 'relative'
            , top: '0px'
        });

    }

    function initScrollThreshold($box){
        scrollThreshold = $box.height();
    }

    function initLastPlaceholderIndex($box){
        lastPlaceholderIndex = $box.index();
    }

    function initLimitPos($box){
        limitPos.minTop = 0; 
        limitPos.maxTop 
            = $box.parent().children().last()[0].offsetTop; 
    }

    function initLastPos($box){
        // lastPos.top = parseInt( $box.css('top') ) || 0;
        // lastPos.top = parseInt( $box.offset().top ) || 0;
        lastPos.top = parseInt( $box[0].offsetTop ) || 0;

        // lastPos.left = parseInt( $box.css('left') ) || 0;
    }

    function initTouchOffset(){
        touchOffset.x = 0;
        touchOffset.y = 0;
    }

    function updatePos($box, touchOffset){
        lastPos.top += touchOffset.y;
        lastPos.left += touchOffset.x;

        if(lastPos.top < limitPos.minTop){
            lastPos.top = limitPos.minTop;
        }

        if(lastPos.top > limitPos.maxTop){
            lastPos.top = limitPos.maxTop;
        }

        $box.css({
            top: lastPos.top + 'px'
            // , left: lastPos.left + 'px'

            , left: '0px'
            , right: '0px'
            , position: 'absolute'
        });
    }

    function updateLastTouchPos(touches){
        var touch = touches[0];

        lastTouchPos.x = touch.clientX;
        lastTouchPos.y = touch.clientY;
    }

    function updateTouchOffset(touches){
        var touch = touches[0];

        touchOffset.x = touch.clientX - lastTouchPos.x;
        touchOffset.y = touch.clientY - lastTouchPos.y;
    }

    /**
     * @note: 使用实时计算scrollY的变化来决定fixPos的值的方式
     *   在iOS下可行，但由于在Android下不能实时计算，故放弃
     */
    function scrollIntoView($box, touches){
        var touch = touches[0];
            // oldScrollY = window.scrollY,
            // newScrollY = oldScrollY;

        if(touch.clientY <= scrollThreshold + 5){
            window.scrollBy(0, -10);
            // newScrollY = window.scrollY;
            // fixPos($box, 0, newScrollY - oldScrollY);
            fixPos($box, 0, -10);
        }
        else if(touch.clientY >= window.innerHeight - scrollThreshold - 5){
            window.scrollBy(0, 10);
            // newScrollY = window.scrollY;
            // fixPos($box, 0, newScrollY - oldScrollY);
            fixPos($box, 0, 10);
        }
    }

    function fixPos($box, x, y){
        lastPos.top += y;
        lastPos.left += x;

        if(lastPos.top < limitPos.minTop){
            lastPos.top = limitPos.minTop;
        }

        if(lastPos.top > limitPos.maxTop){
            lastPos.top = limitPos.maxTop;
        }

        $box.css({
            top: lastPos.top + 'px'
            // , left: lastPos.left + 'px'
        });
        movePlaceholder();
    }

    webappandroid.startdrag = startDrag;

})();


(function($){

var webappandroid = window.webappandroid = window.webappandroid || {},
    _subscribe = webappandroid.subscribe 
        = webappandroid.subscribe || {};

// 默认订阅
var _defaultSubscribes = [

    // 频道
    { name: '头条', type: 'focus' }
    , { name: '百家', type: 'news', id: 478 }
    , { name: '本地', type: 'local' }
    , { name: '娱乐', type: 'info' }
    , { name: '社会', type: 'info' }
    , { name: '军事', type: 'info' }
    , { name: '女人', type: 'info' }
    , { name: '搞笑', type: 'info' }
    , { name: '互联网', type: 'info' }
    , { name: '科技', type: 'info' }
    , { name: '生活', type: 'info' }
    , { name: '国际', type: 'info' }
    , { name: '国内', type: 'info' }
    , { name: '体育', type: 'info' }
    , { name: '汽车', type: 'info' }
    , { name: '财经', type: 'info' }
    , { name: '房产', type: 'info' }
    , { name: '时尚', type: 'info' }
    , { name: '教育', type: 'info' }
    , { name: '游戏', type: 'info' }
    , { name: '旅游', type: 'info' }
    , { name: '人文', type: 'info' }
    , { name: '创意', type: 'info' }

    /*
    // 媒体订阅
    , { name: '腾讯娱乐', type: 'news', id: 136 }
    , { name: '央视新闻', type: 'news', id: 360 }

    // 专栏订阅
    , { name: '黄嵩', type: 'author', id: 327 }
    , { name: '李燕fighting', type: 'author', id: 313 }
    , { name: '郭静', type: 'author', id: 316 }
    , { name: '李书航', type: 'author', id: 312 }
    , { name: '胡泳', type: 'author', id: 318 }
    , { name: '尹生', type: 'author', id: 321 }
    , { name: '雍忠玮', type: 'author', id: 319 }
    , { name: '付亮', type: 'author', id: 315 }

    // 话题订阅
    , { name: 'NBA', type: 'tag' }
    , { name: '中国互联网大佬', type: 'tag' }
    , { name: '马云', type: 'tag' }
    , { name: '马化腾', type: 'tag' }
    , { name: '李彦宏', type: 'tag' }
    , { name: '小米', type: 'tag' }
    , { name: '移动互联网', type: 'tag' }
    */

];

var _defaultSubscribeName = 'focus:'
    + encodeURIComponent('头条');

function _getNameInRouter(subscribe){
    var name = _defaultSubscribeName;

    if(!subscribe){
        return name;
    }

    switch(subscribe.type){
        case 'focus':
        case 'info':
        case 'tag':
        case 'search':
        case 'chosen':
            name = subscribe.type 
                + ':' + encodeURIComponent(subscribe.name);
            break;

        case 'local':
            var cityInfo = webappandroid.local.getCityInfo();
            name = subscribe.type 
                + ':' + cityInfo.localid 
                + ':' + encodeURIComponent(cityInfo.displayname);
            break;

        case 'news':
        case 'author':
            name = subscribe.type 
                + ':' + encodeURIComponent(subscribe.id)
                + ':' + encodeURIComponent(subscribe.name);
            break;

        default: 
            break;
    }

    return name;
}

function _getSubscribes(){
    var subscribes;

    subscribes = $.map(_getSubscribeData(), function(item, index){
        return $.extend({}, item, {
            nameinrouter: _getNameInRouter(item)
        });
    });

    return subscribes;
}

function _isLocalNews(nameInRouter){
    return /^local/.test(nameInRouter);
}

function _getLocalId(nameInRouter){
    return /^local:(\d+)/.test(nameInRouter)
        ? RegExp.$1
        : webappandroid.local.getCityInfo().localid;
}

function _getLocalName(nameInRouter){
    return /^local:\d+:(.+)$/.test(nameInRouter)
        ? RegExp.$1
        : webappandroid.local.getCityInfo().displayname;
}

function _getNewsType(nameInRouter){

    // 兼容旧版数字type
    if(/^\d+$/.test(nameInRouter)){
        nameInRouter -= 0;
        switch(nameInRouter){
            // 旧版本中可能为检索或相关新闻
            case 0:
                return 'default';
            case 1:
                return 'hotnews';
            case 2:
                return 'focuspic';
        }
    }

    return /^([^:]+):.*$/.test(nameInRouter)
        ? RegExp.$1
        : 'local' == nameInRouter
            ? 'local'
            : 'focus';
}

function _getDisplayType(nameInRouter){
    var newsType = _getNewsType(nameInRouter),
        ret;

    switch(newsType){
        case 'tag':
            ret = '话题';
            break;

        case 'news':
            ret = '媒体';
            break;

        case 'author':
            ret = '专栏';
            break;

        default:
            ret = '新闻';
            break;
    }
    return ret;
}

function _getSubscribeName(nameInRouter){
    // 都是最后一个字段
    return /:([^:]+)$/.test(nameInRouter)
        ? RegExp.$1
        : '';
}

function _getSubscribeId(nameInRouter){
    // 中间字段
    return /:([^:]+):/.test(nameInRouter)
        ? RegExp.$1
        : '0';
}

function _getSubscribeInfo(nameInRouter){
    return {
        type: _getNewsType(nameInRouter)
        , name: _getSubscribeName(nameInRouter)
        , id: _getSubscribeId(nameInRouter) 
        , displaytype: _getDisplayType(nameInRouter)
    };
}

function _getDefaultSubscribeData(){
    return _defaultSubscribes.slice(0);
}

function _filterType(tags){
    var i = tags.length - 1;
    while(i >= 0){
        if(tags[i].type == 'chosen'
            || tags[i].type == 'beauty'
            || tags[i].type == 'meizitu'){
            tags.splice(i, 1);
        }
        i--;
    }
    return tags;
}

function _getSubscribeData(){
    var s = webappandroid.subdata,
        d, ret;

    if(s && ( d = s.getData() ) 
        && d.tag 
        && d.tag.length){
        ret = d.tag.slice(0); 
    }
    else{
        ret =  _getDefaultSubscribeData();
    }
    return _filterType(ret);
}

function _isSubscribeExist(type, name, id){
    var subs = _getSubscribeData();

    for(var i=0; i<subs.length; i++){
        if(subs[i].type == type
            && subs[i].name == name
            && ( type != 'tag' 
                    && type != 'info'
                    && type != 'search'
                    && id && subs[i].id == id
                // tag、info以及search订阅的id没有意义
                || type == 'tag'
                || type == 'info'
                || type == 'search'
                || id == "-1" 
                || id == undefined
               )

            ||
            // 本地新闻的name不严格要求
            type == 'local'
            && subs[i].type == 'local'

            || 
            // 焦点新闻的name不严格要求
            type == 'focus'
            && subs[i].type == 'focus'

            ){
            return true;
        }
    }
    return false;
}


// interface
$.extend(_subscribe, {

    getSubscribes: _getSubscribes
    , getDefaultSubscribeData: _getDefaultSubscribeData
    , isLocalNews: _isLocalNews
    , isSubscribeExist: _isSubscribeExist
    , getLocalId: _getLocalId
    , getLocalName: _getLocalName 
    , getNameInRouter: _getNameInRouter 
    , getNewsType: _getNewsType 
    , getDisplayType: _getDisplayType 
    , getSubscribeName: _getSubscribeName 
    , getSubscribeId: _getSubscribeId 
    , getSubscribeInfo: _getSubscribeInfo 

});


})(Zepto);

(function($){
 
rocket.globalview.gotop = rocket.globalview.extend({
     
    el: '#gotop_globalview'

    ,events: {
        'click': 'onclick'
    }

    ,init: function(options){
        var me = this;

        me.isEnabled = true;
        me.initGoTop();
    }

    ,initGoTop: function(){
        var me = this,
            gotopTimeOut;

        $.ui.gotop(me.$el, {
            useAnim: false
            , touchendHandler: function(){
                var self = this;
                clearTimeout(gotopTimeOut);
                if(window.pageYOffset > $(window).height()
                    && me.isEnabled){
                    gotopTimeOut = setTimeout(function(){
                        self.show();
                    },1000);
                }else{
                    self.hide();
                }
                return false;
            }
        }).fix({
            bottom:60
            , right:10
        });
    }

    ,registerEvents: function(){
        var me = this, ec = me.ec;

        me.on('routechange', me.onroutechange, me);
    }

    ,onroutechange: function(params){
        var me = this,
            from = params.from || null,
            to = params.to || null,
            fromAction = from && from.action || null,
            toAction = to && to.action || null,
            pageviews = params.pageviews;

        if(toAction == 'managesubscribe'){
            me.isEnabled = false;
        }
        else{
            me.isEnabled = true;
        }
    }

    ,onclick: function(e){
        var me = this;

        me.$el.addClass('press');

        setTimeout(function(){
            me.$el.removeClass('press');
        }, 300);

        _ss({"act": "gotop"});

    }

});

 })(Zepto);


(function($){
 
/**
 * 提供层级导航需要的数据结构和API接口
 * 由于记录了完整的用户的浏览轨迹，后续可用于用户浏览轨迹的数据分析
 */
rocket.globalview.levelnav = rocket.globalview.extend({
     
    init: function(options){
        var me = this;

        me.routeTrail = [];

        me.readConfig();
    }

    ,readConfig: function(){
        var me = this;

        // 上级路由模式配置表，以页面类型为key
        me.upLevelRoutePattern = {
            index: []

            // 频道新闻、地区新闻、话题新闻等
            , page_other: [
                /^index/
                , /^team/
                , /^news/
                , /^$/
                , /^discuss/
            ]

            // 检索新闻
            , page_search: [
                /^index/
                , /^team/
                , /^news/
                , /^$/
                , /^discuss/
            ]

            // 轮播图新闻
            , page_focuspic: [
                /^index/
                , /^team/
                , /^news/
                , /^$/
                , /^discuss/
            ]

            // 相关新闻
            , page_0: [
                /^index/
                , /^$/
                , /^team/
                , /^news/
                , /^page\/[a-z]+/
                , /^discuss/
            ]

            // 热点新闻
            , page_1: [
                /^index/
                , /^$/
                , /^team/
                , /^page\/[a-z]+/
                , /^news/
                , /^discuss/
            ]

            , image: [
                /^page/
                , /^index/
                , /^$/
                , /^team/
            ]

            , comment: [
                /^index/
                , /^$/
                , /^page/
            ]

            , team: [
                /^index/
                , /^$/
                , /^searchresult/
            ]

            , team_team: [
                /^index/
                , /^$/
                , /^searchresult/
            ]

            , team_player: [
                /^index/
                , /^$/
                , /^searchresult/
                , /^team\/team/
            ]

            , news: [
                /^index/
                , /^$/
                , /^team/
            ]
            , discuss:[
                /^index/
                , /^$/
            ]

            , rank: [
                /^index/
                , /^$/
            ]

            , searchresult: [
                /^index/
                , /^$/
                , /^search_country/
                , /^search_position/
            ]

            , search_country: [
                /^index/
                , /^$/
            ]

            , search_position: [
                /^index/
                , /^$/
            ]


        };
    }

    ,registerEvents: function(){
        var me = this, ec = me.ec;

        me.on('routechange', me.onroutechange, me);
    }

    ,onroutechange: function(params){
        var me = this,
            from = params.from || null,
            to = params.to || null,
            fromAction = from && from.action || null,
            toAction = to && to.action || null,
            pageviews = params.pageviews;

        if(to){
            // 每次路由变化，均记录route信息
            me.addRoute();
            // me.showRouteTrail();
        }
    }

    ,getUpLevel: function(){
        return this.getNearestUpLevelRoute
            .apply(this, arguments);
    }

    ,getNearestUpLevelRoute: function(pageType){
        if(!pageType){
            return null;
        }

        var me = this,
            pat,
            routeTrail = me.routeTrail; 

        pat = me.upLevelRoutePattern[pageType];

        if(!pat || pat.length == 0){
            return null;
        }

        for(var i=routeTrail.length-1; i>=0; i--){
            for(var j=0; j<pat.length; j++){
                if(pat[j].test(routeTrail[i])){
                    routeTrail.splice(i + 1, routeTrail.length - i - 1);
                    return {
                        index: i
                        , route: routeTrail[i]
                    };
                }
            }
        }

        return null;
    }

    ,addRoute: function(){
        var me = this;

        me.routeTrail.push(
            location.hash.replace(/^#/, '')
        );
    }

    ,showRouteTrail: function(){
        var me = this,
            i = me.routeTrail.length;

        console.log('');
        console.log('[ route trail stack ]');
        while(i > 0){
            console.log('    ' + me.routeTrail[i - 1]);
            i--;
        }
    }

});

 })(Zepto);



;(function($) {

rocket.model.ui_shareWx = rocket.model.extend({

    initialize: function(attributes, options){
        var me = this,
            opt = options,
            classInfo, catId;

        me.options = options;

        me.type = opt.type;

    }

    ,getRequestInfo: function(nameInRouter){
        var me = this,
            info = {
                method: 'GET'
                ,querystring: '?tn=bdapiweixin_auth&appid=wxf3c5150a1ba3beb5&url='+ 
                    encodeURIComponent(location.href.split('#')[0])
            }
        return info;
    }
    
    ,urlHandler: function() {
        var handler = location.host.toLowerCase() 
            == 'news.baidu.com'
            ? '/i' : '/news';

        return handler;
    }

    ,fetch: function(options){
        var me = this,
            info = me.getRequestInfo(me.type),
            opt = $.extend({
                type: info.method 
                , url: me.urlHandler() + (info.querystring || '') 
                , data: {} 
            }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});

})(Zepto);

;(function($){
	
rocket.globalview.ui_shareWx = rocket.globalview.extend({
	init:function(options){
		var me = this;

		me.model = new rocket.model.ui_shareWx(
			null,
			$.extend({}, options)
		);

		me.model.fetch({
			success: function(data){
				
				var data = data.toJSON();
				wx.config({
					debug: false,
					appId: 'wxf3c5150a1ba3beb5',
					timestamp: data.timestamp,
					nonceStr: data.nonceStr,
					signature: data.signature,
					jsApiList: [
						'onMenuShareTimeline',
						'onMenuShareAppMessage'
					]
				});
			}
		});
	}
})

})(Zepto);
(function($) {

rocket.model.detail = rocket.model.extend({

    initialize: function(attributes, options){
        var me = this;

        me.options = options;
        me.curCid = options.cid;
    }

    , cidList:{
        "1001":"baidu",
        "1002":"alibaba",
        "1003":"tengxun",
        "1004":"xiaomi",
        "1005":"jd",
        "1006":"lenovo",
        "1007":"360",
        "1008":"huawei",
        "1009":"jumei",
        "10010":"momo",
        "10011":"chuizi"
    }

    ,getCidList:function(){
        return this.cidList;
    }

    ,fetch: function(options){
        var me = this;
    
        var opt = $.extend({
            type: 'get'
            , dataType:'jsonp'
            , url: 'http://baijia.baidu.com/ajax/kpi' + '&t=list&file='+me.cidList[me.curCid]
            , data: {
                t: "list"
                , file: me.cidList[me.curCid]
            } 
        }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});



})(Zepto);




(function($) {

rocket.model.score = rocket.model.extend({

    initialize: function(attributes, options){
        var me = this;

        me.options = options;
        me.curCid = options.cid;
    }

    , cidList:{
        "1001":"baidu",
        "1002":"alibaba",
        "1003":"tengxun",
        "1004":"xiaomi",
        "1005":"jd",
        "1006":"lenovo",
        "1007":"360",
        "1008":"huawei",
        "1009":"jumei",
        "10010":"momo",
        "10011":"chuizi"
    }

    ,getCidList:function(){
        return this.cidList;
    }

    ,fetch: function(options, data){
        var me = this;
        
        var opt = $.extend({
            type: 'get'
            , dataType: 'jsonp'
            , url: 'http://baijia.baidu.com/ajax/kpi' + '&t=score&' + $.param(data)
            , data: $.extend({
                t: "score"
            }, data) 
        }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});



})(Zepto);




(function($){

rocket.pageview.detail = rocket.pageview.extend({

    el: '#detail_page'

    ,init: function(options){
        var me = this;
        //dom 存在，使用setup
        me.setup(new rocket.subview.detail_header(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.detail_content(
            $.extend({}, options)
            , me
        ));
        
        /*me.setup( new rocket.subview.detail_footer(
            $.extend({}, options)
            , me
        ));*/
    }

});

})(Zepto);

(function($){

	rocket.subpageview.detail_content = rocket.subpageview.extend({
		
		className: 'detail-view-subpage'

		, cidList:{
	        "1001":"baidu",
	        "1002":"ali",
	        "1003":"qq",
	        "1004":"xiaomi",
	        "1005":"jd",
	        "1006":"lenovo",
	        "1007":"360",
	        "1008":"huawei",
	        "1009":"jumei",
	        "10010":"momo",
	        "10011":"chuizi"
	    }

		, tpl: "<div class=\"c-name\"><span class=\"logo-icon logo-<%=logoIcon%>\">待评公司</span></div>\n<div class=\"c-content\">\n\t<div class=\"c-content-scroll\">\n\n\t\t<table class=\"c-content-table\">\n\t\t\t<tr class=\"first-tr\">\n\t\t\t\t<th class=\" c-content-table-title\"><span>【自评】</span>业绩回顾</th>\n\t\t\t\t<th class=\"even\">得分</th>\n\t\t\t</tr>\n\t\t\t<% if(errno == 0){%>\n\t\t\t\t<% _.each(data.self.list, function(item, i){ %>\n\t\t\t\t<tr>\n\t\t\t\t\t<td data-content=\"<%=item.content%>\" \n\t\t\t\t\t\tdata-imgsrc=\"<%=item.imgsrc%>\"\n\t\t\t\t\t\tdata-title=\"<%=item.title%>\"\n\t\t\t\t\t\tclass=\"c-content-title\">\n\t\t\t\t\t\t<%=item.title%> &gt;\n\t\t\t\t\t</td>\n\t\t\t\t\t<% if(i == 0){ %>\n\t\t\t\t\t<td class=\"even c-content-self-score\" rowspan=\"<%=data.self.list.length%>\"><%=data.self.score%></td>\n\t\t\t\t\t<% } %>\n\t\t\t\t</tr>\n\t\t\t\t<% }) %>\t\n\t\t\t<% } %>\n\t\t</table>\n\n\t\t<table class=\"c-content-table\">\n\t\t\t<tr>\n\t\t\t\t<th class=\"c-content-table-title\"><span>【他评】</span>同行&媒体观点</th>\n\t\t\t\t<th class=\"even\">得分</th>\n\t\t\t</tr>\n\t\t\t<% if(errno == 0){%>\n\t\t\t\t<% _.each(data.other, function(item, i){ %>\n\t\t\t\t<tr>\n\t\t\t\t\t<td data-content=\"<%=item.content%>\" \n\t\t\t\t\t\tdata-imgsrc=\"<%=item.imgsrc%>\"\n\t\t\t\t\t\tdata-title=\"<%=item.title%>\"\n\t\t\t\t\t\tclass=\"c-content-title\">\n\t\t\t\t\t\t<img src=\"<%= item.avatarsrc %>\"><%=item.title%> &gt;\n\t\t\t\t\t</td>\n\t\t\t\t\t<td class=\"even c-content-self-score\"><%= item.score %></td>\t\n\t\t\t\t</tr>\n\t\t\t\t<% }) %>\t\n\t\t\t<% } %>\n\t\t</table>\n\t\t\n\t</div>\n</div>\n\n\n"

        ,events:{
            "click .c-content-title":"onPlayerClick"

        }

		, init : function(options){
			var me = this;

			me.isFirstLoad = true;

			me.model = new rocket.model.detail(
	            null,
	            $.extend({}, options)
	        )

	        me.cidList = me.model.getCidList();

			me.show();
			me.showLoading(me.$el);
		}

		,registerEvents: function(){
	        var me = this,
	            ec = me.ec;

	        // @note: 子页面级别的事件，避免使用页面级别事件中心ec
	        me.model.on('change', me.render, me);
	        ec.on("pagebeforechange", me.onpagebeforechange, me)
	    }

	    , unregisterEvents: function(){
	        var me = this,
	            ec = me.ec;

	        me.model.off('change', me.render, me);
	    }

	    , onsubpagebeforechange: function(params){
	        var me = this, 
	            from = params.from,
	            to = params.to,
	            param = params.params,
	            featureString = me.getFeatureString(param);

	        if(to == me.ec 
	            && featureString == me.featureString){

	            if(me.isFirstLoad){
	                if(me.loadingLock){
	                    return;
	                }
	                me.loadingLock = true;
	                me.model.fetch({
	                	type:"POST"
	                    , success: function(model){
	                        //debugger;
	                        me.isFirstLoad = false;
	                        me.loadingLock = false;
	                    }        
	                    , error: function(){
	                        me.loadingLock = false;
	                    }
	                });
	            }
	            else{
	                //me.ec.trigger('titlechange', {title: me.zTitle});
	            }

	            // @note: 平滑子页面，显示不隐藏
	            me.$el.show();
	        }

	    }

	    ,onPlayerClick:function(e){
	    	var me = this,
	    		$el = $(e.currentTarget),
	    		data = $el.data();
	    	me.scrollY = window.scrollY;
	    	
	    	var $content = $("<p></p>").text(data.content),
	    		$title = $("<h3></h3>").addClass("detail-content-dialog-title").text(data.title)
	    		$img = $("<img/>").attr("src", data.imgsrc),
	    		$close = $("<span></span>").addClass("detail-content-dialog-close"),
	    		$dialogInner = $("<div></div>").addClass("detail-content-dialog-inner")
	    		.append($title).append($img).append($content).append($close),
	    		$dialog = $("<div></div>").append($dialogInner);
	    	$dialog.addClass("detail-content-dialog");
	    	$dialog.on('click', function(){
	    		$dialog.remove();
	    		window.scrollTo(0, me.scrollY);
	    	});
	    	me.$el.append($dialog);
	    	window.scrollTo(0, 0);
	    }

		, render: function(result){
			var me = this,
				_logoIcon = me.cidList[me.options.cid];

			var data = result.toJSON();
			me.ec.detailData = data;
			me.$el.html(
				_.template(
					me.tpl
					, $.extend({logoIcon:_logoIcon}, data, me.options)
				)
			)

			me.append( new rocket.subview.detail_footer(
		        $.extend({}, me.options)
		        , me
		    ));

			me.hideLoading();
		}
	})
})(Zepto);
(function($){

	rocket.subview.detail_content = rocket.subview.extend({
		el : '#detail_page_content'

		, init : function(options){
			var me = this,
				subview, 
				spm;

			spm = me.getSubpageManager({
				subpageClass : rocket.subpageview.detail_content
				, maxSubpages: 11
				, subpageTransition: 'simple'
			})

			subView = new rocket.subpageview.detail_content(
				$.extend({}, options)
				, me
			);

			me.append(subView);
			spm.registerSubpage(me.featureString, subView);
		}

		,registerEvents: function(){
	        var me = this,
	            ec = me.ec;

	        // @note: 子页面级别的事件，避免使用页面级别事件中心ec
	        ec.on("pagebeforechange", me.onpagebeforechange, me)
	    }

	    , unregisterEvents: function(){
	        var me = this,
	            ec = me.ec;

	        ec.off("pagebeforechange", me.onpagebeforechange);
	    }

	    , onpagebeforechange: function(params){
	    	var me = this, 
	    		to = params.to, 
	    		param = params.params ;

	    	if( to == me.ec ){
	    		me.show();
	    	}

	    }
	})
})(Zepto);
(function($){

rocket.subview.detail_footer = rocket.subview.extend({

    //: '#detail_page > .page-footer'

    events: {
        
        "click .user-action-prev": "userActionPrev"
        , "click .user-action-next": "userActionNext"
        , "click .user-score-list li": "checkedScore"
        , "click .user-action-view": "viewRank"
    }

    ,tpl: "<div class=\"detail-footer\">\n\t<div class=\"user-score\">\n\t\t<div class=\"user-score-title\">你怎么看？</div>\n\t\t<ul class=\"user-score-list\">\n\t\t\t<li data-userScore=\"5\">\n\t\t\t\t<span class=\"score-checkbox\">5分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing5\">人生巅峰</span>\n\t\t\t</li>\n\t\t\t<li data-userScore=\"4\">\n\t\t\t\t<span class=\"score-checkbox\">4分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing4\">潜力股</span>\n\t\t\t</li>\n\t\t\t<li data-userScore=\"3\">\n\t\t\t\t<span class=\"score-checkbox\">3分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing3\">马马虎虎</span>\n\t\t\t</li>\n\t\t\t<li data-userScore=\"2\">\n\t\t\t\t<span class=\"score-checkbox\">2分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing2\">瞎混</span>\n\t\t\t</li>\n\t\t\t<li data-userScore=\"1\" class=\"last-item\">\n\t\t\t\t<span class=\"score-checkbox\">1分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing1\">no zuo no die</span>\n\t\t\t</li>\n\t\t</ul>\n\t</div>\t\n\t<div class=\"user-action\">\n\t\t<span class=\"user-action-btn user-action-prev\">上一个</span>\n\t\t<span class=\"user-action-btn user-action-next\">下一个</span>\n\t\t<span class=\"user-action-btn user-action-view\">提交</span>\n\t</div>\n</div>\n"

    ,init: function(options){
        var me = this, 
            _curCidIndex, 
            _cids = window.cids || $.localStorage("cids") && $.localStorage("cids").split(",") || "";
        me.curCid = me.options.cid;
        me.model = new rocket.model.score(
            null,
            $.extend({}, options)
        );

        me.render();
        me.cids = _cids;

        _curCidIndex = me.cids.inArray(me.curCid);

        if( _curCidIndex !== -1 && _curCidIndex === me.cids.length - 1 ){
            me.$(".user-action-next").hide();
            me.$(".user-action-view").show();
        }else{
            me.$(".user-action-next").show();
            me.$(".user-action-view").hide();
        }
    }

    ,render: function(){
        var me = this;

        me.$el.append(
            _.template(
                me.tpl
                , {
                    pageName: '标题'        
                }
            )
        );

        me.show();
    } 
    , checkedScore: function(e){
        var me = this,
            _curCidIndex, 
            _cids = window.cids || $.localStorage("cids").split(",") || "",
            $el = $(e.currentTarget)
            data = $el.data();

        _curCidIndex = me.cids.inArray(me.curCid);

        me.$(".user-action-btn").addClass("able");
        
        if( _curCidIndex == 0){
            me.$(".user-action-prev").removeClass("able");
        }
        
        me.userscore = data.userscore;
        $el.addClass('checked').siblings().removeClass("checked");

        _detailData = me.ec.detailData.data;
        var other_score_arr = [];
        for (var i = 0; i < _detailData.other.length; i++) {
            other_score_arr.push(_detailData.other[i].score);
        };

        var postData = {
            cid:_detailData.cid,
            self_score:_detailData.self.score,
            other_score:other_score_arr.join(","),
            user_score:data.userscore
        }
        if( _curCidIndex == 0){
            postData.uid = new Date().getTime();
        }
        //debugger;
        me.model.fetch({}, postData);
    }

    , viewRank: function(){
        var me = this;
        if(me.userscore){
            me.navigate("#result");    
        }
        
    }

    , userActionPrev: function(){
        var me = this,
            _cids = me.cids,
            curCidIndex = _cids.inArray(me.curCid);

        if(curCidIndex !== -1 && curCidIndex !== 0 && me.userscore){
            route = "#detail/" + _cids[curCidIndex - 1];
            me.navigate(route);
        }
    }  
    , userActionNext: function(){
        var me = this,
            _cids = me.cids,
            curCidIndex = _cids.inArray(me.curCid);

        if( curCidIndex !== -1 && curCidIndex < _cids.length - 1 && me.userscore){
            route = "#detail/" + _cids[curCidIndex + 1];
            me.navigate(route);    
        }
        
    }

});

})(Zepto);

(function($){

rocket.subview.detail_header = rocket.subview.extend({

    el: '#detail_page > header'

    , events: {
        'click .btn-back': 'onBackButtonClick'
        ,'click .ui-toolbar-title': 'onTitleClick'
    }

    ,init: function(options){
        var me = this;

        me.$title = me.$('.ui-toolbar-title');
        me.show();
    }

    , registerEvents: function(){
        var me = this,
            ec = me.ec;

        ec.on('pagebeforechange', me.onpagebeforechange, me);
    }

    ,onpagebeforechange: function(params){
        var me = this,
            ec = me.ec,
            from = params.from, 
            to = params.to, 
            param = params.params;

        if(to == ec){
            me.from = from;
            me.type = param.type;
        }
    }

    ,onBackButtonClick: function(e){
        var me = this,
            upRoute = webappandroid.levelnav.getUpLevel(
                me.ec.action
            ),
            route;

        // 应用内导航过来，回到上一级页面
        if(upRoute){
            me.navigate(upRoute.route);
        }
        // 页面第一次打开，比如微信中分享，回首页
        else if(history.length <= 1){
            me.navigate('#index');
        }
        // 第三方页面或者当前页面被刷新（history.length > 1），使用历史返回
        else{
            history.back();
        }
    }

    ,onTitleClick: function(e) {
        var me = this,
            upRoute = webappandroid.levelnav.getUpLevel(
                me.ec.action
            ),
            route;

        // 应用内导航过来，回到上一级页面
        if(upRoute){
            route = upRoute.route;
        }
        else{
            route = 'index';
        }

        me.navigate(route);
    }

});

})(Zepto);

(function($) {

rocket.model.home = rocket.model.extend({

    initialize: function(attributes, options){
        var me = this,
            opt = options,
            classInfo, catId;

        me.options = options;

        me.type = opt.type;

    }

    ,getRequestInfo: function(nameInRouter){
        // debugger;
        var me = this,
            info = {
                method: 'POST'
                , querystring: '?tn=bdapiworldcup&from=' +
                    ( webappandroid.helper.isBdbox ? "shijiebeibdbox" : "shijiebeiwebapp" )
            }

        return info;
    }
    
    ,urlHandler: function() {
        var handler = location.host.toLowerCase() 
            == 'news.baidu.com'
            ? '/i' : '/news';

        return handler;
    }

    ,parseLive: function(liveData){
        
        _.each(liveData, function(item, home){
            
            item._txt = item.status == 0 ? '即将开始': item.status == 1 ? '正在直播' : '已结束';
            item._status = item.status != 1 ? 'lived': 'living';
        })
        
        return liveData;
    }
    
    ,parseRank:function(data){
        var _t = data.type;
        data._type = _t.substr(3, _t.length - 4);;
        return data;
    }


    ,parse: function(data){
        if(!data){
            return {};
        }
        var me = this;
        data.data.live = me.parseLive(data.data.zhibo || []);
        data.data.rank = data.data.rank.map(me.parseRank);
        //debugger;
        
        return data;
    }

    ,fetch: function(options){
        // debugger;
        var me = this,
            info = me.getRequestInfo(me.type),
            opt = $.extend({
                type: info.method 
                , url: me.urlHandler() + (info.querystring || '') //me.urlHandler() + ( info.querystring || '' )
                , data: {} 
            }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});



})(Zepto);




(function($){

rocket.pageview.home = rocket.pageview.extend({

    el: '#home_page'

    ,init: function(options){
        var me = this;
        
        //dom 存在，使用setup
        me.setup(new rocket.subview.home_header(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.home_footer(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.home_content(
            $.extend({}, options)
            , me
        ));
    }
});

})(Zepto);

;(function($){

rocket.subview.home_content = rocket.subview.extend({

	el : '#home_page_content'

	, init : function(options){
		var me = this;

		me.isFirstLoad = true;
		
		me.model = new rocket.model.home(
            null,
            $.extend({}, options)
        )
		me.show();
		me.showLoading();
		me.render();
	}

	,registerEvents: function(){
        var me = this,
            ec = me.ec;

        $("#music-btn").on("click", me.onMusicBtnClick, me);
        // @note: 子页面级别的事件，避免使用页面级别事件中心ec
        //me.model.on('change', me.render, me);
        // ec.on("pagebeforechange", me.onpagebeforechange, me)
        
        //$(window).on("resize", $.proxy(me.resize, me));
    }

    , unregisterEvents: function(){
        var me = this,
            ec = me.ec;

        //me.model.off('change', me.render, me);
        //ec.off("pagebeforechange", me.onpagebeforechange);
        //$(window).off("resize", $.proxy(me.resize, me));
        
    }

    ,selectCompany:function(){
        var me = this;
    }

    , onpagebeforechange: function(params){

        var me = this, 
            from = params.from,
            to = params.to,
            param = params.params;

        if(to == me.ec ){

            if(me.isFirstLoad){
                if(me.loadingLock){
                    return;
                }
                me.loadingLock = true;
                me.model.fetch({
                	type:"POST"
                    , success: function(model){
                        //me.scrollSection(param);
                        me.isFirstLoad = false;
                        me.loadingLock = false;
                        
                    }        
                    , error: function(){
                        me.loadingLock = false;
                    }
                });
            }
            else{
                //me.ec.trigger('titlechange', {title: me.zTitle});
                //me.scrollSection(param);
            }

            // @note: 平滑子页面，显示不隐藏
            me.$el.show();
        }

    }

    , onMusicBtnClick: function(e){
        var me = this,
            $el = $(e.currentTarget),
            status = $el.hasClass('play');
        var audioBackgroundMusic = window.audioBackgroundMusic || document.getElementById("audioBackgroundMusic");
        if(!status){
            $("#music-btn").addClass("play");
            audioBackgroundMusic.play(); 
        }else{
            $("#music-btn").removeClass("play");
            audioBackgroundMusic.pause();
        }
        $("#music-text").text(status ? "开启" : "关闭");
    }

	, render: function(result){

		var me = this;

		var options = me.options || {};
        
        me.append( new rocket.subview.home_content_clist(
            $.extend({}, options)
            , me
        ));
        

		me.hideLoading();
	}
})
})(Zepto);

;(function($){

rocket.subview.home_content_clist = rocket.subview.extend({

	className : 'company-list'

    , tagName: 'ul'

    , events:{
        "click li":"selectCompany"
    }

    , tpl:"<li data-cid='1001' class='logo-baidu'></li>\n<li data-cid='1002' class='logo-ali'></li>\n<li data-cid='1003' class='logo-qq'></li>\n<li data-cid='1004' class='logo-xiaomi'></li>\n<li data-cid='1005' class='logo-jd'></li>\n<li data-cid='1006' class='logo-lenovo'></li>\n<li data-cid='1007' class='logo-360'></li>\n<li data-cid='1008' class='logo-huawei'></li>\n<li data-cid='1009' class='logo-jumei'></li>\n<li data-cid='10010' class='logo-momo'></li>\n<li data-cid='10011' class='logo-chuizi'></li>\n"

	, init : function(options){
		var me = this;

		me.x = 0;
        me.y = 0;
        me.tw = $('body').width();
		me.show();
		me.render();
        window.cids = window.cids || [];
        
	}

    , selectCompany:function(e){
        var me = this,
            $ele = $(e.currentTarget),
            data = $ele.data();

        if($ele.hasClass("checked")){
            for (var i = cids.length - 1; i >= 0; i--) {
                if(cids[i] == data.cid){
                    $ele.removeClass("checked");
                    cids.splice(i, 1);
                    break;
                }
            }
        }else{
            $ele.addClass("checked");
            cids.push(data.cid);
        }

        if(cids.length >= 3){
            me.ec.trigger("homeStartAble")
        }else{
            me.ec.trigger("homeStartDisable")
        }
    }

	, render: function(result){

		var me = this;

		var options = me.options || {};
        
        me.$el.html(
                _.template(me.tpl, {})
        );

		me.hideLoading();
	}
})
})(Zepto);

(function($){

rocket.subview.home_footer = rocket.subview.extend({

    el: '#home_page > .page-footer'

    , events: {
        "click .home-start" : "onHomeStart"
    }

    ,tpl: ""

    ,init: function(options){
        var me = this;

        me.showLoading(me.$el);
        me.render();
    }

    , registerEvents: function(){
        var me = this;
        me.ec.on("homeStartAble", me.homeStartAble, me);
        me.ec.on("homeStartDisable", me.homeStartDisable, me);
    }

    , homeStartAble: function(){
        var me = this;
        me.$(".home-start").addClass("able");
    }

    , homeStartDisable: function(){
        var me = this;
        me.$(".home-start").removeClass("able");
    }

    ,render: function(){
        var me = this;

        me.$el.append(
            _.template(
                me.tpl
                , {
                    pageName: '标题'        
                }
            )
        );

        me.show();

        me.hideLoading(-1);
    }
    ,onHomeStart:function(){
        var me = this,
            route = "#detail/"+cids[0];
        $.localStorage("cids", cids.join(","));
        if(cids.length >= 3){
            me.navigate(route);
        }

    } 

});

})(Zepto);

(function($){

rocket.subview.home_header = rocket.subview.extend({

    el: '#home_page header'

    , events: {
        "click" : "onheaderclick"
    }

    ,init: function(options){
        var me = this;

        me.options = options;
        me.show();
    }

    , registerEvents: function(){
        var me = this;
    }

    , onheaderclick:function(){
        
        var me = this
            , router = "" ;
        
        me.navigate(router);
    } 

});

})(Zepto);

(function($){

rocket.pageview.index = rocket.pageview.extend({

    el: '#index_page'


    ,init: function(options){
        var me = this;
        
        //dom 存在，使用setup
        me.setup(new rocket.subview.index_header(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.index_footer(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.index_content(
            $.extend({}, options)
            , me
        ));

        //添加自定义分享。
        //new rocket.subview.ui_shareWx({}, me);
    }
});

})(Zepto);

;(function($){

rocket.subview.index_content = rocket.subview.extend({

	el : '#index_page_content'

    ,events:{
        "click .index-btn-score":"gohome",
        "click .show-rule":"showRule"
    }

	, init : function(options){
		var me = this;
        me.dialog = $(".show-rule-dialog").hide();
        me.dialog.find(".show-rule-dialog-inner-close").on("click", function(){
            me.dialog.hide();
        })
		me.show();
		
	}
    , gohome: function(){
        var me = this;
        window.audioBackgroundMusic = document.getElementById("audioBackgroundMusic");
        audioBackgroundMusic.play();
        me.navigate("#home");
    }
    , showRule: function(){
        this.dialog.show();
    }

})
})(Zepto);

(function($){

rocket.subview.index_footer = rocket.subview.extend({

    el: '#index_page > .page-footer'

    , events: {

    }

    ,tpl: ""

    ,init: function(options){
        var me = this;

        me.showLoading(me.$el);
        me.render();
    }

    , registerEvents: function(){
        var me = this;
    }

    ,render: function(){
        var me = this;

        me.$el.append(
            _.template(
                me.tpl
                , {
                    pageName: '标题'        
                }
            )
        );

        me.show();

        me.hideLoading(-1);
    }   

});

})(Zepto);

(function($){

rocket.subview.index_header = rocket.subview.extend({

    el: '#index_page header'

    , events: {
        "click" : "onheaderclick"
    }

    ,init: function(options){
        var me = this;

        me.options = options;
        me.show();
    }

    , registerEvents: function(){
        var me = this;
    }

    , onheaderclick:function(){
        
        var me = this
            , router = "" ;
        
        me.navigate(router);
    } 

});

})(Zepto);

(function($) {

rocket.model.result = rocket.model.extend({

    initialize: function(attributes, options){
        var me = this;

        me.options = options;
        me.curCid = options.cid;
    }

    , cidList:{
        "1001":"baidu",
        "1002":"alibaba",
        "1003":"tengxun",
        "1004":"xiaomi",
        "1005":"jd",
        "1006":"lenovo",
        "1007":"360",
        "1008":"huawei",
        "1009":"jumei",
        "10010":"momo",
        "10011":"chuizi"
    }

    ,getCidList:function(){
        return this.cidList;
    }

    ,getCidListKeys:function(){
        var _arr = [];
        _.each(this.cidList, function(item, i){
            _arr.push(i);
        })
        return _arr;
    }

    ,parse: function(data){
        var me = this,  
            _cids = window.cids || $.localStorage("cids") && $.localStorage("cids").split(",") || [];

        data.data.user = Number(data.data.user) + 30000;
        _.each(data.data.list, function(item, i){
            item.logobg = me.cidList[item.cid];
            item.commented = _cids.length && _cids.inArray(item.cid) != -1 ? true: false;
        })
        return data;
    }

    ,fetch: function(options){
        var me = this;
    
        var opt = $.extend({
            type: 'POST'
            , dataType:'jsonp'
            , url: 'http://baijia.baidu.com/ajax/kpi' + '&t=ranking&cids='+me.getCidListKeys().join(",")
            , data: {
                t: "ranking"
                , cids: me.getCidListKeys().join(",")
            } 
        }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});

})(Zepto);




(function($){

rocket.pageview.result = rocket.pageview.extend({

    el: '#result_page'

    ,init: function(options){
        var me = this;

        //$.localStorage("SUMMARY_isShared", true);

        me.setup( new rocket.subview.result_footer(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.result_content(
            $.extend({}, options)
            , me
        ));
    }

    ,registerEvents: function(){
        var me = this,
            ec = me.ec;

        ec.on('pagebeforechange', me.onpagebeforechange, me);
    }

    ,onpagebeforechange: function(params){
        var me = this,
            ec = me.ec,
            from = params.from,
            to = params.to,
            param = params.params;
        
        if(to == me){
            me.$dialog && me.$dialog.hide();
        }
    }
});

})(Zepto);

;(function($){

rocket.subview.result_content = rocket.subview.extend({

	el : '#result_page_content'

    ,events:{
        "click .result-btn-score":"goShare"
    }

    , cidNameList:{
        "1001":"百度",
        "1002":"阿里巴巴",
        "1003":"腾讯",
        "1004":"小米",
        "1005":"京东",
        "1006":"联想",
        "1007":"360",
        "1008":"华为",
        "1009":"聚美",
        "10010":"陌陌",
        "10011":"锤子"
    }

    , tpl : "<div class=\"show-join-people\">已有<span class=\"people-number\"><%=data.user%></span>位网友参与</div>\n<div class=\"result-content\">\n\t<table class=\"result-content-table\">\n\t\t<tr>\n\t\t\t<th class=\"result-content-table-title\"><span>被评估的公司</span></th>\n\t\t\t<th class=\"even\">绩效总分</th>\n\t\t</tr>\n\t\t<% if(errno == 0){ %>\n\t\t<% _.each(data.list, function(item, i){%>\n\t\t<tr class=\"<%= item.commented ? 'commented' : '' %>\">\n\t\t\t<td class=\"logo-icon logo-<%=item.logobg%>\">\n\t\t\t\t<% if(i < 3){ %>\n\t\t\t\t<span class=\"logo-number\"><%=i+1%></span>\n\t\t\t\t<% } %>\n\t\t\t</td>\n\t\t\t<td class=\"even overall-score\"><%= item.score %>分</td>\n\t\t</tr>\n\n\t\t<% }) %>\n\t\t<% } %>\n\t</table>\n\t\n</div>\n\n\n"
    
	, init : function(options){
		var me = this,  
            _cids = window.cids || $.localStorage("cids") && $.localStorage("cids").split(",") || [],
            _cnames = [],
            _title;

        me.model = new rocket.model.result(
            null,
            $.extend({}, options)
        )

        for (var i = 0; i < 3; i++) {
            _cnames.push( me.cidNameList[ _cids[i] ] );
        };

        _title = "我刚给" + _cnames.join(",") + "等几家公司评了年终绩效，你也来爽一爽吧！";

        setTimeout(function(){
            // 2.1 监听“分享给朋友”，按钮点击、自定义分享内容及分享结果接
            wx.onMenuShareAppMessage({
                title: document.title,
                desc: _title,
                link: location.href.split('?')[0],
                imgUrl: 'http://m.baidu.com/static/news/webapp/webappandroid/img/webapp-news-logo.png'
            });
          

            // 2.2 监听“分享到朋友圈”按钮点击、自定义分享内容及分享结果接口
            wx.onMenuShareTimeline({
                title: _title,
                link: location.href.split('?')[0],
                imgUrl: 'http://m.baidu.com/static/news/webapp/webappandroid/img/webapp-news-logo.png'
            });
        }, 100);

        me.isFirstLoad = true;
		me.show();
	}

    ,registerEvents: function(){
        var me = this,
            ec = me.ec;

        // @note: 子页面级别的事件，避免使用页面级别事件中心ec
        me.model.on('change', me.render, me);
        ec.on("pagebeforechange", me.onpagebeforechange, me)
    }

    , unregisterEvents: function(){
        var me = this,
            ec = me.ec;

        me.model.off('change', me.render, me);
    }

    , onpagebeforechange: function(params){
        var me = this, 
            from = params.from,
            to = params.to,
            param = params.params;

        if(to == me.ec){
            if(me.isFirstLoad){
                if(me.loadingLock){
                    return;
                }
                me.loadingLock = true;
                me.model.fetch({
                    type:"POST"
                    , success: function(model){
                        me.isFirstLoad = false;
                        me.loadingLock = false;
                    }        
                    , error: function(){
                        me.loadingLock = false;
                    }
                });
            }
            // @note: 平滑子页面，显示不隐藏
            me.$el.show();
        }

    }
    , render: function(result){
            var me = this;

            var data = result.toJSON();
            //debugger;
            //var data = {};
            me.$el.html(
                _.template(
                    me.tpl
                    , $.extend({}, data, me.options)
                )
            )

            /*me.append( new rocket.subview.detail_footer(
                $.extend({}, me.options)
                , me
            ));*/

            me.hideLoading();
        }
    , goShare: function(){
        var me = this;
        
    }

})
})(Zepto);

(function($){

rocket.subview.result_footer = rocket.subview.extend({

    el: '#result_page > .result-footer'

    , events: {
        "click .share-btn":"shareRank"
    }

    ,tpl: ""

    ,init: function(options){
        var me = this;
        me.showLoading(me.$el);
        me.render();
    }

    , registerEvents: function(){
        var me = this;
        me.on('pagebeforechagne', me.onpagebeforechange, me);
    }

    , unregisterEvents: function(){
        me.off('pagebeforechagne', me.onpagebeforechange, me);
    }

    , shareRank: function(){
        var me = this;
        function _isWeiXin(){
            return /micromessenger/i.test(navigator.userAgent);
        }
        
        var addClassName = _isWeiXin() ? "share-rank-dialog":"share-rank-dialog-other";
        me.ec.$dialog = $("<div><div>").addClass(addClassName);
        me.ec.$dialog.on('click', function(){
            this.remove();
        })
        me.ec.$el.append(me.ec.$dialog);
    }

    , onpagebeforechange:function(){
        var me = this;
        me.$dialog.hide();
    }

    ,render: function(){
        var me = this;

        me.$el.append(
            _.template(
                me.tpl
                , {
                    pageName: '标题'        
                }
            )
        );

        me.show();

        me.hideLoading(-1);
    }   

});

})(Zepto);

