/*!
 * iScroll v4.2.2 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
(function(window, doc){
    var m = Math,_bindArr = [],
        dummyStyle = doc.createElement('div').style,
        vendor = (function () {
            var vendors = 't,webkitT,MozT,msT,OT'.split(','),
                t,
                i = 0,
                l = vendors.length;

            for ( ; i < l; i++ ) {
                t = vendors[i] + 'ransform';
                if ( t in dummyStyle ) {
                    return vendors[i].substr(0, vendors[i].length - 1);
                }
            }

            return false;
        })(),
        cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',


    // Style properties
        transform = prefixStyle('transform'),
        transitionProperty = prefixStyle('transitionProperty'),
        transitionDuration = prefixStyle('transitionDuration'),
        transformOrigin = prefixStyle('transformOrigin'),
        transitionTimingFunction = prefixStyle('transitionTimingFunction'),
        transitionDelay = prefixStyle('transitionDelay'),

    // Browser capabilities
        isAndroid = (/android/gi).test(navigator.appVersion),
        isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),

        has3d = prefixStyle('perspective') in dummyStyle,
        hasTouch = 'ontouchstart' in window && !isTouchPad,
        hasTransform = !!vendor,
        hasTransitionEnd = prefixStyle('transition') in dummyStyle,

        RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
        START_EV = hasTouch ? 'touchstart' : 'mousedown',
        MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
        END_EV = hasTouch ? 'touchend' : 'mouseup',
        CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
        TRNEND_EV = (function () {
            if ( vendor === false ) return false;

            var transitionEnd = {
                ''			: 'transitionend',
                'webkit'	: 'webkitTransitionEnd',
                'Moz'		: 'transitionend',
                'O'			: 'otransitionend',
                'ms'		: 'MSTransitionEnd'
            };

            return transitionEnd[vendor];
        })(),

        nextFrame = (function() {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) { return setTimeout(callback, 1); };
        })(),
        cancelFrame = (function () {
            return window.cancelRequestAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||
                window.mozCancelRequestAnimationFrame ||
                window.oCancelRequestAnimationFrame ||
                window.msCancelRequestAnimationFrame ||
                clearTimeout;
        })(),

    // Helpers
        translateZ = has3d ? ' translateZ(0)' : '',

    // Constructor
        iScroll = function (el, options) {
            var that = this,
                i;

            that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
            that.wrapper.style.overflow = 'hidden';
            that.scroller = that.wrapper.children[0];

            that.translateZ = translateZ;
            // Default options
            that.options = {
                hScroll: true,
                vScroll: true,
                x: 0,
                y: 0,
                bounce: true,
                bounceLock: false,
                momentum: true,
                lockDirection: true,
                useTransform: true,
                useTransition: false,
                topOffset: 0,
                checkDOMChanges: false,		// Experimental
                handleClick: true,


                // Events
                onRefresh: null,
                onBeforeScrollStart: function (e) { e.preventDefault(); },
                onScrollStart: null,
                onBeforeScrollMove: null,
                onScrollMove: null,
                onBeforeScrollEnd: null,
                onScrollEnd: null,
                onTouchEnd: null,
                onDestroy: null

            };

            // User defined options
            for (i in options) that.options[i] = options[i];

            // Set starting position
            that.x = that.options.x;
            that.y = that.options.y;

            // Normalize options
            that.options.useTransform = hasTransform && that.options.useTransform;

            that.options.useTransition = hasTransitionEnd && that.options.useTransition;



            // Set some default styles
            that.scroller.style[transitionProperty] = that.options.useTransform ? cssVendor + 'transform' : 'top left';
            that.scroller.style[transitionDuration] = '0';
            that.scroller.style[transformOrigin] = '0 0';
            if (that.options.useTransition) that.scroller.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';

            if (that.options.useTransform) that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px)' + translateZ;
            else that.scroller.style.cssText += ';position:absolute;top:' + that.y + 'px;left:' + that.x + 'px';



            that.refresh();

            that._bind(RESIZE_EV, window);
            that._bind(START_EV);


            if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
                that._checkDOMChanges();
            }, 500);
        };

// Prototype
    iScroll.prototype = {
        enabled: true,
        x: 0,
        y: 0,
        steps: [],
        scale: 1,
        currPageX: 0, currPageY: 0,
        pagesX: [], pagesY: [],
        aniTime: null,
        isStopScrollAction:false,

        handleEvent: function (e) {
            var that = this;
            switch(e.type) {
                case START_EV:
                    if (!hasTouch && e.button !== 0) return;
                    that._start(e);
                    break;
                case MOVE_EV: that._move(e); break;
                case END_EV:
                case CANCEL_EV: that._end(e); break;
                case RESIZE_EV: that._resize(); break;
                case TRNEND_EV: that._transitionEnd(e); break;
            }
        },

        _checkDOMChanges: function () {
            if (this.moved ||  this.animating ||
                (this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale)) return;

            this.refresh();
        },

        _resize: function () {
            var that = this;
            setTimeout(function () { that.refresh(); }, isAndroid ? 200 : 0);
        },

        _pos: function (x, y) {
            x = this.hScroll ? x : 0;
            y = this.vScroll ? y : 0;

            if (this.options.useTransform) {
                this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px) scale(' + this.scale + ')' + translateZ;
            } else {
                x = m.round(x);
                y = m.round(y);
                this.scroller.style.left = x + 'px';
                this.scroller.style.top = y + 'px';
            }

            this.x = x;
            this.y = y;

        },



        _start: function (e) {
            var that = this,
                point = hasTouch ? e.touches[0] : e,
                matrix, x, y,
                c1, c2;

            if (!that.enabled) return;

            if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);

            if (that.options.useTransition ) that._transitionTime(0);

            that.moved = false;
            that.animating = false;

            that.distX = 0;
            that.distY = 0;
            that.absDistX = 0;
            that.absDistY = 0;
            that.dirX = 0;
            that.dirY = 0;
            that.isStopScrollAction = false;

            if (that.options.momentum) {
                if (that.options.useTransform) {
                    // Very lame general purpose alternative to CSSMatrix
                    matrix = getComputedStyle(that.scroller, null)[transform].replace(/[^0-9\-.,]/g, '').split(',');
                    x = +matrix[4];
                    y = +matrix[5];
                } else {
                    x = +getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, '');
                    y = +getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, '');
                }

                if (x != that.x || y != that.y) {
                    that.isStopScrollAction = true;
                    if (that.options.useTransition) that._unbind(TRNEND_EV);
                    else cancelFrame(that.aniTime);
                    that.steps = [];
                    that._pos(x, y);
                    if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);
                }
            }



            that.startX = that.x;
            that.startY = that.y;
            that.pointX = point.pageX;
            that.pointY = point.pageY;

            that.startTime = e.timeStamp || Date.now();

            if (that.options.onScrollStart) that.options.onScrollStart.call(that, e);

            that._bind(MOVE_EV, window);
            that._bind(END_EV, window);
            that._bind(CANCEL_EV, window);
        },

        _move: function (e) {
            var that = this,
                point = hasTouch ? e.touches[0] : e,
                deltaX = point.pageX - that.pointX,
                deltaY = point.pageY - that.pointY,
                newX = that.x + deltaX,
                newY = that.y + deltaY,

                timestamp = e.timeStamp || Date.now();

            if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);

            that.pointX = point.pageX;
            that.pointY = point.pageY;

            // Slow down if outside of the boundaries
            if (newX > 0 || newX < that.maxScrollX) {
                newX = that.options.bounce ? that.x + (deltaX / 2) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
            }
            if (newY > that.minScrollY || newY < that.maxScrollY) {
                newY = that.options.bounce ? that.y + (deltaY / 2) : newY >= that.minScrollY || that.maxScrollY >= 0 ? that.minScrollY : that.maxScrollY;
            }

            that.distX += deltaX;
            that.distY += deltaY;
            that.absDistX = m.abs(that.distX);
            that.absDistY = m.abs(that.distY);

            if (that.absDistX < 6 && that.absDistY < 6) {
                return;
            }

            // Lock direction
            if (that.options.lockDirection) {
                if (that.absDistX > that.absDistY + 5) {
                    newY = that.y;
                    deltaY = 0;
                } else if (that.absDistY > that.absDistX + 5) {
                    newX = that.x;
                    deltaX = 0;
                }
            }

            that.moved = true;

            // internal for header scroll

            that._beforePos ? that._beforePos(newY, deltaY) && that._pos(newX, newY) : that._pos(newX, newY);

            that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if (timestamp - that.startTime > 300) {
                that.startTime = timestamp;
                that.startX = that.x;
                that.startY = that.y;
            }

            if (that.options.onScrollMove) that.options.onScrollMove.call(that, e);
        },

        _end: function (e) {
            if (hasTouch && e.touches.length !== 0) return;

            var that = this,
                point = hasTouch ? e.changedTouches[0] : e,
                target, ev,
                momentumX = { dist:0, time:0 },
                momentumY = { dist:0, time:0 },
                duration = (e.timeStamp || Date.now()) - that.startTime,
                newPosX = that.x,
                newPosY = that.y,
                newDuration;


            that._unbind(MOVE_EV, window);
            that._unbind(END_EV, window);
            that._unbind(CANCEL_EV, window);

            if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);


            if (!that.moved) {

                if (hasTouch && this.options.handleClick && !that.isStopScrollAction) {
                    that.doubleTapTimer = setTimeout(function () {
                        that.doubleTapTimer = null;

                        // Find the last touched element
                        target = point.target;
                        while (target.nodeType != 1) target = target.parentNode;

                        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
                            ev = doc.createEvent('MouseEvents');
                            ev.initMouseEvent('click', true, true, e.view, 1,
                                point.screenX, point.screenY, point.clientX, point.clientY,
                                e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                                0, null);
                            ev._fake = true;
                            target.dispatchEvent(ev);
                        }
                    },  0);
                }


                that._resetPos(400);

                if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
                return;
            }

            if (duration < 300 && that.options.momentum) {
                momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
                momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;

                newPosX = that.x + momentumX.dist;
                newPosY = that.y + momentumY.dist;

                if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist:0, time:0 };
                if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist:0, time:0 };
            }

            if (momentumX.dist || momentumY.dist) {
                newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);



                that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);

                if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
                return;
            }



            that._resetPos(200);
            if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
        },

        _resetPos: function (time) {
            var that = this,
                resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
                resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

            if (resetX == that.x && resetY == that.y) {
                if (that.moved) {
                    that.moved = false;
                    if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);		// Execute custom code on scroll end
                    if (that._afterPos) that._afterPos();
                }

                return;
            }

            that.scrollTo(resetX, resetY, time || 0);
        },



        _transitionEnd: function (e) {
            var that = this;

            if (e.target != that.scroller) return;

            that._unbind(TRNEND_EV);

            that._startAni();
        },


        /**
         *
         * Utilities
         *
         */
        _startAni: function () {
            var that = this,
                startX = that.x, startY = that.y,
                startTime = Date.now(),
                step, easeOut,
                animate;

            if (that.animating) return;

            if (!that.steps.length) {
                that._resetPos(400);
                return;
            }

            step = that.steps.shift();

            if (step.x == startX && step.y == startY) step.time = 0;

            that.animating = true;
            that.moved = true;

            if (that.options.useTransition) {
                that._transitionTime(step.time);
                that._pos(step.x, step.y);
                that.animating = false;
                if (step.time) that._bind(TRNEND_EV);
                else that._resetPos(0);
                return;
            }

            animate = function () {
                var now = Date.now(),
                    newX, newY;

                if (now >= startTime + step.time) {
                    that._pos(step.x, step.y);
                    that.animating = false;
                    if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that);			// Execute custom code on animation end
                    that._startAni();
                    return;
                }

                now = (now - startTime) / step.time - 1;
                easeOut = m.sqrt(1 - now * now);
                newX = (step.x - startX) * easeOut + startX;
                newY = (step.y - startY) * easeOut + startY;
                that._pos(newX, newY);
                if (that.animating) that.aniTime = nextFrame(animate);
            };

            animate();
        },

        _transitionTime: function (time) {
            time += 'ms';
            this.scroller.style[transitionDuration] = time;

        },

        _momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
            var deceleration = 0.0006,
                speed = m.abs(dist) * (this.options.speedScale||1) / time,
                newDist = (speed * speed) / (2 * deceleration),
                newTime = 0, outsideDist = 0;

            // Proportinally reduce speed if we are outside of the boundaries
            if (dist > 0 && newDist > maxDistUpper) {
                outsideDist = size / (6 / (newDist / speed * deceleration));
                maxDistUpper = maxDistUpper + outsideDist;
                speed = speed * maxDistUpper / newDist;
                newDist = maxDistUpper;
            } else if (dist < 0 && newDist > maxDistLower) {
                outsideDist = size / (6 / (newDist / speed * deceleration));
                maxDistLower = maxDistLower + outsideDist;
                speed = speed * maxDistLower / newDist;
                newDist = maxDistLower;
            }

            newDist = newDist * (dist < 0 ? -1 : 1);
            newTime = speed / deceleration;

            return { dist: newDist, time: m.round(newTime) };
        },

        _offset: function (el) {
            var left = -el.offsetLeft,
                top = -el.offsetTop;

            while (el = el.offsetParent) {
                left -= el.offsetLeft;
                top -= el.offsetTop;
            }

            if (el != this.wrapper) {
                left *= this.scale;
                top *= this.scale;
            }

            return { left: left, top: top };
        },



        _bind: function (type, el, bubble) {
            _bindArr.concat([el || this.scroller, type, this]);
            (el || this.scroller).addEventListener(type, this, !!bubble);
        },

        _unbind: function (type, el, bubble) {
            (el || this.scroller).removeEventListener(type, this, !!bubble);
        },


        /**
         *
         * Public methods
         *
         */
        destroy: function () {
            var that = this;

            that.scroller.style[transform] = '';



            // Remove the event listeners
            that._unbind(RESIZE_EV, window);
            that._unbind(START_EV);
            that._unbind(MOVE_EV, window);
            that._unbind(END_EV, window);
            that._unbind(CANCEL_EV, window);



            if (that.options.useTransition) that._unbind(TRNEND_EV);

            if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);

            if (that.options.onDestroy) that.options.onDestroy.call(that);

            //清除所有绑定的事件
            for (var i = 0, l = _bindArr.length; i < l;) {
                _bindArr[i].removeEventListener(_bindArr[i + 1], _bindArr[i + 2]);
                _bindArr[i] = null;
                i = i + 3
            }
            _bindArr = [];

            //干掉外边的容器内容
            var div = doc.createElement('div');
            div.appendChild(this.wrapper);
            div.innerHTML = '';
            that.wrapper = that.scroller = div = null;
        },

        refresh: function () {
            var that = this,
                offset;



            that.wrapperW = that.wrapper.clientWidth || 1;
            that.wrapperH = that.wrapper.clientHeight || 1;

            that.minScrollY = -that.options.topOffset || 0;
            that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
            that.scrollerH = m.round((that.scroller.offsetHeight + that.minScrollY) * that.scale);
            that.maxScrollX = that.wrapperW - that.scrollerW;
            that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
            that.dirX = 0;
            that.dirY = 0;

            if (that.options.onRefresh) that.options.onRefresh.call(that);

            that.hScroll = that.options.hScroll && that.maxScrollX < 0;
            that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);


            offset = that._offset(that.wrapper);
            that.wrapperOffsetLeft = -offset.left;
            that.wrapperOffsetTop = -offset.top;


            that.scroller.style[transitionDuration] = '0';
            that._resetPos(400);
        },

        scrollTo: function (x, y, time, relative) {
            var that = this,
                step = x,
                i, l;

            that.stop();

            if (!step.length) step = [{ x: x, y: y, time: time, relative: relative }];

            for (i=0, l=step.length; i<l; i++) {
                if (step[i].relative) { step[i].x = that.x - step[i].x; step[i].y = that.y - step[i].y; }
                that.steps.push({ x: step[i].x, y: step[i].y, time: step[i].time || 0 });
            }

            that._startAni();
        },

        scrollToElement: function (el, time) {
            var that = this, pos;
            el = el.nodeType ? el : that.scroller.querySelector(el);
            if (!el) return;

            pos = that._offset(el);
            pos.left += that.wrapperOffsetLeft;
            pos.top += that.wrapperOffsetTop;

            pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
            pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
            time = time === undefined ? m.max(m.abs(pos.left)*2, m.abs(pos.top)*2) : time;

            that.scrollTo(pos.left, pos.top, time);
        },

        scrollToPage: function (pageX, pageY, time) {
            var that = this, x, y;

            time = time === undefined ? 400 : time;

            if (that.options.onScrollStart) that.options.onScrollStart.call(that);


            x = -that.wrapperW * pageX;
            y = -that.wrapperH * pageY;
            if (x < that.maxScrollX) x = that.maxScrollX;
            if (y < that.maxScrollY) y = that.maxScrollY;


            that.scrollTo(x, y, time);
        },

        disable: function () {
            this.stop();
            this._resetPos(0);
            this.enabled = false;

            // If disabled after touchstart we make sure that there are no left over events
            this._unbind(MOVE_EV, window);
            this._unbind(END_EV, window);
            this._unbind(CANCEL_EV, window);
        },

        enable: function () {
            this.enabled = true;
        },

        stop: function () {
            if (this.options.useTransition) this._unbind(TRNEND_EV);
            else cancelFrame(this.aniTime);
            this.steps = [];
            this.moved = false;
            this.animating = false;
        },

        isReady: function () {
            return !this.moved &&  !this.animating;
        }
    };

    function prefixStyle (style) {
        if ( vendor === '' ) return style;

        style = style.charAt(0).toUpperCase() + style.substr(1);
        return vendor + style;
    }

    dummyStyle = null;	// for the sake of it

    if (typeof exports !== 'undefined') exports.iScroll = iScroll;
    else window.iScroll = iScroll;

    (function($){
        if(!$)return;
        var orgiScroll = iScroll,
            id = 0,
            cacheInstance = {};
        function createInstance(el,options){
            var uqid = 'iscroll' + id++;
            el.data('_iscroll_',uqid);
            return cacheInstance[uqid] = new orgiScroll(el[0],options)
        }
        window.iScroll = function(el,options){
            return createInstance($(typeof el == 'string' ? '#' + el : el),options)
        };
        $.fn.iScroll = function(method){
            var resultArr = [];
            this.each(function(i,el){
                if(typeof method == 'string'){
                    var instance = cacheInstance[$(el).data('_iscroll_')],pro;
                    if(instance && (pro = instance[method])){
                        var result = $.isFunction(pro) ? pro.apply(instance, Array.prototype.slice.call(arguments,1)) : pro;
                        if(result !== instance && result !== undefined){
                            resultArr.push(result);
                        }
                    }
                }else{
                    if(!$(el).data('_iscroll_'))
                        createInstance($(el),method)
                }
            });

            return resultArr.length ? resultArr : this;
        }
    })(window.Zepto || null)



})(window, document);
/**
 * Change list
 * 修改记录
 *
 * 1. 2012-08-14 解决滑动中按住停止滚动，松开后被点元素触发点击事件。
 *
 * 具体修改:
 * a. 202行 添加isStopScrollAction: false 给iScroll的原型上添加变量
 * b. 365行 _start方法里面添加that.isStopScrollAction = false; 默认让这个值为false
 * c. 390行 if (x != that.x || y != that.y)条件语句里面 添加了  that.isStopScrollAction = true; 当目标值与实际值不一致，说明还在滚动动画中
 * d. 554行 that.isStopScrollAction || (that.doubleTapTimer = setTimeout(function () {
 *          ......
 *          ......
 *          }, that.options.zoom ? 250 : 0));
 *   如果isStopScrollAction为true就不派送click事件
 *
 *
 * 2. 2012-08-14 给options里面添加speedScale属性，提供外部控制冲量滚动速度
 *
 * 具体修改
 * a. 108行 添加speedScale: 1, 给options里面添加speedScale属性，默认为1
 * b. 798行 speed = m.abs(dist) * this.options.speedScale / time, 在原来速度的基础上*speedScale来改变速度
 *
 * 3. 2012-08-21 修改部分代码，给iscroll_plugin墙用的
 *
 * 具体修改
 * a. 517行  在_pos之前，调用_beforePos,如果里面不返回true,  将不会调用_pos
 *  // internal for header scroll
 *  if (that._beforePos)
 *      that._beforePos(newY, deltaY) && that._pos(newX, newY);
 *  else
 *      that._pos(newX, newY);
 *
 * b. 680行 在滚动结束后调用 _afterPos.
 * // internal for header scroll
 * if (that._afterPos) that._afterPos();
 *
 * c. 106行构造器里面添加以下代码
 * // add var to this for header scroll
 * that.translateZ = translateZ;
 *
 * 为处理溢出
 * _bind 方法
 * destroy 方法
 * 最开头的 _bindArr = []
 *
 */
/**
 * @file GMU定制版iscroll，基于[iScroll 4.2.2](http://cubiq.org/iscroll-4), 去除zoom, pc兼容，snap, scrollbar等功能。同时把iscroll扩展到了Zepto的原型中。
 * @name iScroll
 * @import core/zepto.js
 * @desc GMU定制版iscroll，基于{@link[http://cubiq.org/iscroll-4] iScroll 4.2.2}, 去除zoom, pc兼容，snap, scrollbar等功能。同时把iscroll扩展到了***Zepto***的原型中。
 */

/**
 * @name iScroll
 * @grammar new iScroll(el,[options])  ⇒ self
 * @grammar $('selecotr').iScroll([options])  ⇒ zepto实例
 * @desc 将iScroll加入到了***$.fn***中，方便用Zepto的方式调用iScroll。
 * **el**
 * - ***el {String/ElementNode}*** iscroll容器节点
 *
 * **Options**
 * - ***hScroll*** {Boolean}: (可选, 默认: true)横向是否可以滚动
 * - ***vScroll*** {Boolean}: (可选, 默认: true)竖向是否可以滚动
 * - ***momentum*** {Boolean}: (可选, 默认: true)是否带有滚动效果
 * - ***checkDOMChanges*** {Boolean, 默认: false}: (可选)每个500毫秒判断一下滚动区域的容器是否有新追加的内容，如果有就调用refresh重新渲染一次
 * - ***useTransition*** {Boolean, 默认: false}: (可选)是否使用css3来来实现动画，默认是false,建议开启
 * - ***topOffset*** {Number}: (可选, 默认: 0)可滚动区域头部缩紧多少高度，默认是0， ***主要用于头部下拉加载更多时，收起头部的提示按钮***
 * @example
 * $('div').iscroll().find('selector').atrr({'name':'aaa'}) //保持链式调用
 * $('div').iScroll('refresh');//调用iScroll的方法
 * $('div').iScroll('scrollTo', 0, 0, 200);//调用iScroll的方法, 200ms内滚动到顶部
 */


/**
 * @name destroy
 * @desc 销毁iScroll实例，在原iScroll的destroy的基础上对创建的dom元素进行了销毁
 * @grammar destroy()  ⇒ undefined
 */

/**
 * @name refresh
 * @desc 更新iScroll实例，在滚动的内容增减时，或者可滚动区域发生变化时需要调用***refresh***方法来纠正。
 * @grammar refresh()  ⇒ undefined
 */

/**
 * @name scrollTo
 * @desc 使iScroll实例，在指定时间内滚动到指定的位置， 如果relative为true, 说明x, y的值是相对与当前位置的。
 * @grammar scrollTo(x, y, time, relative)  ⇒ undefined
 */
/**
 * @name scrollToElement
 * @desc 滚动到指定内部元素
 * @grammar scrollToElement(element, time)  ⇒ undefined
 * @grammar scrollToElement(selector, time)  ⇒ undefined
 */
/**
 * @name scrollToPage
 * @desc 跟scrollTo很像，这里传入的是百分比。
 * @grammar scrollToPage(pageX, pageY, time)  ⇒ undefined
 */
/**
 * @name disable
 * @desc 禁用iScroll
 * @grammar disable()  ⇒ undefined
 */
/**
 * @name enable
 * @desc 启用iScroll
 * @grammar enable()  ⇒ undefined
 */
/**
 * @name stop
 * @desc 定制iscroll滚动
 * @grammar stop()  ⇒ undefined
 */



///import ui.core.zepto;

/**
 * @name $.ui
 * @file
 * @desc ui库的基础，提供构建组件和定义模块相关的方法
 */

(function($) {
    //公共模块的集合
    var memoizedMods = [];

    /**
     * @namespace $.ui
     */
    $.ui = $.ui || {
        version: '1.0.4',

        defineProperty: Object.defineProperty,

        /**
         * @desc 定义组件，默认继承widget，需要实现_create及_init接口
         * @grammar create(name, [base], proto) ⇒ obj
         * @name create
         * @desc 参数
         * ***name*** {String}  组件名
         * ***base*** {Function} 组件父类
         * ***proto*** {Object}  原型扩展
         * @example  $.ui.create('button', {
         *     _data: {},
         *     _create: function(){},
         *     _init: function(){}
         * });
         */
        create: function(name, base, proto) {
            if (!proto) {
                proto = base;
                base = $.ui.widget;
            }

            var attachMods = [],
                baseProto = new base(),
                rcheck = /\b_super\b/,
                superProto = baseProto.__proto__,
                constructor = function(element, options){
                    if (element) {
                        var me = this,
                            args = $.slice(arguments);
                            
                        $.each(attachMods, function(index, mod) {
                            var paths = mod.split('.'),
                                mod = memoizedMods[paths.shift()] || {},
                                key, source = {};

                            $.each(paths, function(index, val) {
                                key = val;
                                mod = mod[key];
                            });

                            mod && (key ? source[key] = mod : source = mod);
                            _attach(me, source, 'delegate');
                        });
                        // invoke component's real _create
                        me._createWidget.apply(me, args);
                    }
                };

            $.ui[name] = function(element, options) {
                return new constructor(element, options);
            };

            constructor.prototype = $.extend(baseProto, {
                widgetName: name,
                widgetBaseClass: baseProto.widgetName || base
            }, $.each(proto, function(key, method) {
                if ($.isFunction(method) && $.isFunction(superProto[key]) && rcheck.test(method.toString())) {
                    proto[key] = function() {
                        this._super = superProto[key];
                        var ret = method.apply(this, arguments);
                        delete this._super;
                        return ret;
                    };
                }
            }));

            return {
                attach: function(paths) {
                    attachMods = attachMods.concat($.isArray(paths) ? paths : paths.split(','));
                }
            };
        },

        /**
         * 定义模块，支持传入function或object
         * @name define
         * @grammar define(name, [factory]) ⇒ undefined
         * @desc 参数
         * ***name*** {String} name 模块名
         * ***factory*** {Object}  模块构造器
         * @example $.ui.define('moduleA', {
         *     name: 'A',
         *     getName: function(){
         *         reurn this.name;
         *     }
         * });
         *
         * $.ui.define('moduleB', function(){
         *     var name = 'B';
         *     return {
         *         getName: function(){
         *             return name;
         *         }
         *     }
         * });
         */
        define: function(name, factory) {
            try {
                if(!factory){ // anonymous module
                    factory = name;
                    name = '_privateModule'
                }

                var ns = $.ui[name] || ($.ui[name] = {}),
                    exports = _checkDeps(factory);

                memoizedMods[name] = $.extend(ns, exports);
            } catch (e) {
                throw new Error(e);
            }
        }

    };

     /**
      * 加载配置项
      * @private
      */
     function _attach(target, source, mode) {
         switch (mode) {
         case 'attach':
             $.extend(target, source);
             break;

         case 'delegate':
             $.each(source, function(key, fn) {
                 if (target[key] === undefined) {
                     target[key] = function() {
                         var args = $.slice(arguments);
                         args.unshift(this.widget());
                         fn.apply(this, args);
                     };
                 }

             });
             break;
         }
     }

    /**
     * 获取模块api
     * @private
     */
    function require(module) {
        var exports = $.ui[module] || {},
            args = $.slice(arguments, 1),
            i = 0, temp;

        while( temp = exports[args[i]]){
            exports = temp;
            i++;
        }
        return args[i] ? temp : exports;
    }

    /**
     * 检查模块依赖
     * @private
     */
    function _checkDeps(factory) {
        var rdeps = /require\(\s*['"]?([^'")]*)/g,
            ret = [],
            code, match, module;

        if ($.isPlainObject(factory)) return factory;

        else if ($.isFunction(factory)) {
            code = factory.toString();

            while (match = rdeps.exec(code)) {
                if (module = match[1]) {
                    !$.ui[module] && ret.push('$.ui.' + module);
                }
            }

            if (ret.length) throw ('undefined modules: ' + ret.join(', '));
            return factory(require);
            
        } else throw ('type error: factory should be function or object');
    }

})(Zepto);
///import ui.mobile.mobile;
/**
 * @file
 * @name Extend
 * @desc 基于zepto的扩展, 添加了些常用的公共方法
 */

(function($, undefined) {
    $.ui.define('ex', function() {
        var class2type = {},
            toString = Object.prototype.toString,
            timer;

        $.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });

        /**
         * @name $.implement
         * @grammar $.implement(obj, [sm, [force]])  ⇒ Zepto
         * @desc 扩展方法，若***sm***为***true***，则***obj***扩展到***$***中，若***sm***不设或设为***false***，则默认扩展到***$.fn***中，
         * 若第二个参数传入的是对象，obj中的属性或方法将被扩展到此对象中
         * @example $.extend({    //foo和abc，将被扩展到$.fn中，即Zepto的原型中
         *     foo: 'bar',
         *     abc: function(){
         *         //...
         *     }
         * });
         *
         * $.extend({      //foo和abc扩展到$中，即Zepto中
         *     foo: 'bar',
         *     abc: function(){
         *         //...
         *     }
         * }, true);
         *
         * $.extend({       //foo和abc被扩展到$.os中
         *     foo: 'bar',
         *     abc: function(){
         *         //...
         *     }
         * }, $.os);
         */
        $.implement = function(obj, sm, force) {
            //可以扩展到sm制定的命名空间上
            var proto = $.isObject(sm) ? sm : sm ?  $ : $.fn;
            $.each(obj, function(name, method) {
                var previous = proto[name];
                if (previous == undefined || !previous.$ex || force) {
                    method.$ex = true;
                    proto[name] = method;
                }
            });
            return $;
        };

        //扩展ua,qq,chrome浏览器的识别
        var ua = navigator.userAgent,
            na = navigator.appVersion,
            br = $.browser;

        /**
         * @name $.os
         * @since 1.0.4+
         * @desc  扩展zepto中对android系统的检测
         *
         * **可用属性**
         * - ***android*** 扩展zepto中$.os.andriod，修复htc不能检测bug
         */
        $.implement({
            android :$.os.android||/HTC/.test(ua)
        }, $.os,true);

        /**
         * @name $.browser
         * @since 1.0.4+
         * @desc 扩展zepto中对browser的检测
         *
         * **可用属性**
         * - ***qq*** 检测qq浏览器
         * - ***chrome*** 检测chrome浏览器
         * - ***uc*** 检测uc浏览器
         * - ***version*** 检测浏览器版本
         *
         * @example
         * if ($.browser.qq) {      //在qq浏览器上打出此log
         *     console.log('this is qq browser');
         * }
         */
        $.implement({
            qq : /qq/i.test(ua),
            chrome : /chrome/i.test(ua) || /CriOS/i.test(ua),
            uc : /UC/i.test(ua) || /UC/i.test(na)
        }, $.browser,true);
        $.browser.uc = $.browser.uc || !$.browser.qq && !$.browser.chrome && !/safari/i.test(ua);

        try {
            $.browser.version = br.uc ? na.match(/UC(?:Browser)?\/([\d.]+)/)[1] :
                br.qq ? ua.match(/MQQBrowser\/([\d.]+)/)[1] :
                    br.chrome ? ua.match(/(?:CriOS|Chrome)\/([\d.]+)/)[1] : br.version;
        } catch (e) {
        }

        /**
         * @name $.support
         * @since 1.0.4+
         * @desc 检测设备对某些属性或方法的支持情况
         *
         * **可用属性**
         * - ***orientation*** 检测是否支持转屏事件，UC中存在orientaion，但不会转屏不会触发该事件，故UC属于不支持转屏事件
         * - ***touch*** 检测是否支持touch相关事件
         * - ***cssTransitions*** 测测是否支持css3的transition
         * - ***has3d*** 检测是否支持translate3d的硬件加速
         *
         * @example
         * if ($.support.has3d) {      //在支持3d的设备上使用
         *     console.log('you can use transtion3d');
         * }
         */
        $.support = $.support || {};
        $.extend( $.support, {
            orientation: !$.browser.uc && "orientation" in window && "onorientationchange" in window ,
            touch: "ontouchend" in document,
            cssTransitions: "WebKitTransitionEvent" in window,
            has3d: 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()
        });

        $.implement({ // static
            _guid: 0,

            emptyFn: function() {},

            /**
             * @name $.type
             * @grammar $.type(val)  ⇒ string
             * @desc 判断变量类型.
             * @example console.log($.type(new Boolean(true));// => "boolean"
             * console.log($.type(3));// => "number"
             * console.log($.type("abdcd"));// => "string"
             * console.log($.type(function(){}));// => "function"
             * console.log($.type([]));// => "array"
             * console.log($.type(new Date()));// => "date"
             * console.log($.type(/reg/));// => "regexp"
             * console.log($.type({}));// => "obj"
             */
            type: function(o) {
                return o == null ? String(o) : class2type[toString.call(o)] || "object";
            },

            /**
             * @name $.isNull
             * @grammar $.isNull(val)  ⇒ Boolean
             * @desc 判断变量类型是否为***null***
             * @example console.log($.isNull(false));// => false
             * console.log($.isNull(0));// => false
             * console.log($.isNull(null));// => true
             */
            isNull: function(o) {
                return o === null;
            },

            /**
             * @name $.isUndefined
             * @grammar $.isUndefined(val)  ⇒ Boolean
             * @desc 判断变量类型是否为***undefined***
             * @example
             * console.log($.isUndefined(false));// => false
             * console.log($.isUndefined(0));// => false
             * console.log($.isUndefined(a));// => true
             */
            isUndefined: function(o) {
                return o === undefined;
            },

            /**
             * @desc 从集合中截取部分数据，集合可以是数组，也可以是具有数组性质的对象，比如***arguments***
             * @name $.slice
             * @grammar $.slice(collection, [index])  ⇒ array
             * @example (function(){
             *     var args = $.slice(arguments, 2);
             *     console.log(args); // => [3]
             * })(1, 2, 3);
             */
            slice: function(array, index) {
                return Array.prototype.slice.call(array, index || 0);
            },

            /**
             * @desc 绑定函数. 将参数***context***作为fn的***this***. 同时***arguments***可以作为第三个参数传入
             * @name $.bind
             * @grammar $.bind(fn, context, [args])  ⇒ function
             * @example var obj = {name: 'Zepto'},
             * handler = function(){
             *   console.log("hello from + ", this.name) // => hello from + Zepto
             * };
             *
             * // 确保handler在obj的上下文中执行
             * $(document).on('click', $.bind(handler, obj));
             */
            bind: function(fn, context, args) {
                return function() {
                    fn.apply(context, (args || []).concat($.slice(arguments)));
                }
            },

            /**
             * @desc 生成递增id
             * @name $.guid
             * @grammar $.guid()  ⇒ number
             */
            guid: function() {
                return this._guid++;
            },

            /**
             * @name $.later
             * @grammar $.later(fn, [when, [periodic, [context, [data]]]])  ⇒ timer
             * @desc 延迟执行传入的方法
             * **参数:**
             * - ***fn*** {Function}: 将要延时执行的方法
             * - ***when*** {Number} *可选(默认 0)*: 什么时间后执行
             * - ***periodic*** {Boolean} *可选(默认 false)*: 设定是否是周期性的执行，相当于setInterval
             * - ***context*** {Object} *可选(默认 undefined)*: 给方法指定上下文
             * - ***data*** {Array} *可选(默认 undefined)*: 给方法指定传入参数
             * @example $.later(function(str){
             *     console.log(this.name + ' ' + str); // => Example hello
             * }, 250, false, {name:'Example'}, ['hello']);
             */
            later: function(fn, when, periodic, context, data) {
                var when = when || 0,
                    f = function() {
                        fn.apply(context, data);
                    };

                return periodic ? setInterval(f, when) : setTimeout(f, when);
            },

            /**
             * @desc 用系统弹出框弹出信息, 如果将one设置成true, 多次调用只有第一次才会执行
             * @deprecated
             * @name $.alert
             * @grammar $.alert(str, [one])  ⇒ undefined
             * @example
             * setInterval(      //只输出一次hello
             *     function (){
             *         $.alert('hello', 200);
             *     }, 100)
             */
            alert: function() {
                var isAlert = false;
                return function(str, once) {
                    if (!isAlert) {
                        window.alert(str);
                        once && (isAlert = true);
                    }
                };
            }(),

            /**
             * @desc 解析模版，在模板中可以使用变量，格式为***<%=varname%>***。字符串中的变量，将会替换成data中传入的对象中对应key值的变量值。
             * @grammar $.parseTpl(str, data)  ⇒ string
             * @name $.parseTpl
             * @example var str = "<p><%=name%></p>",
             * obj = {name: 'ajean'};
             * console.log($.parseTpl(str, data)); // => <p>ajean</p>
             */
            parseTpl: function(str, data) {
                var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' + 'with(obj||{}){__p.push(\'' + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/<%=([\s\S]+?)%>/g, function(match, code) {
                    return "'," + code.replace(/\\'/g, "'") + ",'";
                }).replace(/<%([\s\S]+?)%>/g, function(match, code) {
                    return "');" + code.replace(/\\'/g, "'").replace(/[\r\n\t]/g, ' ') + "__p.push('";
                }).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + "');}return __p.join('');";
                var func = new Function('obj', tmpl);
                return data ? func(data) : func;
            },

            /**
             * @desc 加载script或者css资源，其中script资源，支持加载完成方法回调。
             * @name $.loadFile
             * @grammar $.loadFile(url, [callback, [timeout]])  ⇒ undefined
             * @example $.loadFile('common.js', function(){//加载js文件
             *     console.log('complete');
             * });
             *
             * $.loadFile('style.css');//加载样式表
             */
            loadFile: function(url, cb, timeout) {
                var isCSS = /\.css(?:\?|$)/i.test(url),
                    head = document.head || document.getElementsByTagName('head')[0],
                    node = document.createElement(isCSS ? 'link' : 'script'),
                    cb = cb || $.emptyFn,
                    timer, onload;

                if (isCSS) {
                    node.rel = 'stylesheet';
                    node.href = url;
                    head.appendChild(node);
                } else {
                    onload = function() {
                        cb();
                        clearTimeout(timer);
                    };

                    timer = setTimeout(function() {
                        onload();
                        throw new Error('failed to load js file:' + url);
                    }, timeout || 50);

                    node.addEventListener('load', onload, false);
                    node.async = true;
                    node.src = url;
                    head.insertBefore(node, head.firstChild);
                }
            },

            /**
             * @desc 减少执行频率, 多次调用，在指定的时间内，只会执行一次。***delay*** 指定时间段，单位为毫秒，***fn*** 被稀释的方法
             *
             * <pre>||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
             * X    X    X    X    X    X      X    X    X    X    X    X</pre>
             *
             * @grammar $.throttle(delay, fn) ⇒ function
             * @name $.throttle
             * @since v1.0.4+
             * @example var touchmoveHander = function(){
             *     //....
             * }
             * //绑定事件
             * $(document).bind('touchmove', $.throttle(250, touchmoveHander));//频繁滚动，每250ms，执行一次touchmoveHandler
             *
             * //解绑事件
             * $(document).unbind('touchmove', touchmoveHander);//注意这里面unbind还是touchmoveHander,而不是$.throttle返回的function, 当然unbind那个也是一样的效果
             *
             */
            throttle: function(delay, fn, debounce_mode) {
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
                // for event bind | unbind
                wrapper._zid = fn._zid = fn._zid || $.proxy(fn)._zid;
                return wrapper;
            },

            /**
             * @desc 减少执行频率, 在指定的时间内, 多次调用，只会执行一次。
             *
             * options
             * - ***delay*** 指定时间段，单位为毫秒。
             * - ***fn*** 被稀释的方法
             * - ***at_begin*** 指定是在开始处执行，还是结束是执行
             *
             * 非at_begin模式
             * <pre>||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
             *                         X                                X</pre>
             * at_begin模式
             * <pre>||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
             * X                                X                        </pre>
             *
             * @grammar $.debounce(delay, fn[, at_begin]) ⇒ function
             * @name $.debounce
             * @since v1.0.4+
             * @example var touchmoveHander = function(){
             *     //....
             * }
             * //绑定事件
             * $(document).bind('touchmove', $.debounce(250, touchmoveHander));//频繁滚动，只要间隔时间不大于250ms, 在一系列移动后，只会执行一次
             *
             * //解绑事件
             * $(document).unbind('touchmove', touchmoveHander);//注意这里面unbind还是touchmoveHander,而不是$.debounce返回的function, 当然unbind那个也是一样的效果
             */
            debounce: function(delay, fn, t) {
                return fn === undefined ? $.throttle(250, delay, false) : $.throttle(delay, fn, t !== false);
            }

        }, true);

        var $onFn = $.fn.on,
            $offFn = $.fn.off,
            $triggerFn = $.fn.trigger,
            transEvent = {
                touchstart: 'mousedown',
                touchend: 'mouseup',
                touchmove: 'mousemove',
                tap: 'click'
            },
            transFn = function(e) {
                var events = [];
                (e || '').split(' ').forEach(function(type) {
                    events.push(!('ontouchstart' in window) ? (transEvent[type] ? transEvent[type] : type) : type);
                });
                return events.join(' ');
            };

        $.implement({
            /**
             * @desc 注册事件, 调用方式同Zepto的on，同时兼容PC的事件，如绑定touchstart在pc上对应mousedown.
             * @name on
             * @grammar on(type, [selector], function(e){ ... })  ⇒ self
             * @grammar on({ type: handler, type2: handler2, ... }, [selector])  ⇒ self
             * @example var div = $('div');
             * div.on('touchstart', function(e){
             *     //event handler
             * });
             */
            on: function(event, selector, callback) {
                return $onFn.call(this, transFn(event), selector, callback);
            },

            /**
             * @desc 注销事件, 参考{@link on}
             * @grammar off(type, [selector], function(e){ ... })  ⇒ self
             * @grammar off({ type: handler, type2: handler2, ... }, [selector])  ⇒ self
             * @grammar off(type, [selector])  ⇒ self
             * @grammar off()  ⇒ self
             * @name off
             */
            off: function(event, selector, callback) {
                return $offFn.call(this, transFn(event), selector, callback);
            },

            /**
             * @desc 获取元素相对与body的offset值, 返回包含top, left, right, bottom, width, height等信息的对象。
             * 第二个参数用来指定是否忽略滚动距离，跟getBoundingClientRect相似，但此方法考虑到低端设备不支持getBoundingClientRect的情况
             * @example
             * var obj = $('<div = "position:absolute; width:200px; height:100px; top:300px; left:400px;"></div>')
             * .appendTo(document.body).offset();
             * console.log(obj); // => {top:300, left:400, right: 600, bottom: 400, width: 200, height: 100}
             * @grammar offset([ignore]) ⇒ object
             * @name offset
             * @param {Boolean} ignore 是否忽视window滚动距离
             * @todo ios下safari top值有1-2px的偏差
             */
            offset: function(ignoreScroll) {
                if (this.length == 0) return null;
                var obj = "getBoundingClientRect" in this[0] ? this[0].getBoundingClientRect() : (function(elem) {
                    var top = elem.offsetTop,
                        left = elem.offsetLeft,
                        width = elem.offsetWidth,
                        height = elem.offsetHeight;

                    while (elem.offsetParent) {
                        elem = elem.offsetParent;
                        top += elem.offsetTop;
                        left += elem.offsetLeft;
                    }
                    top -= window.pageYOffset;
                    left -= window.pageXOffset;

                    return {
                        top: top,
                        left: left,
                        right: left + width,
                        bottom: top + height,
                        width: width,
                        height: height
                    }
                })(this[0]);

                return {
                    left: obj.left + (ignoreScroll ? 0 : window.pageXOffset),
                    top: obj.top + (ignoreScroll ? 0 : window.pageYOffset),
                    width: obj.width,
                    height: obj.height,
                    right: obj.right + (ignoreScroll ? 0 : window.pageXOffset),
                    bottom: obj.bottom + (ignoreScroll ? 0 : window.pageYOffset)
                }
            },

            //主要是为了把originalEvent给带到event对象里面去
            trigger: function(event) {
                var _args = $.slice(arguments);
                //caller有可能不存在
                if ($.fn.trigger.caller) {
                    var callerArgs = $.fn.trigger.caller.arguments,
                        evtObj;

                    if ($.type(event) == 'string') _args[0] = $.Event(event);
                    if (callerArgs && (evtObj = callerArgs[0]) && /Event\]$/i.test(toString.call(evtObj)) && $.inArray(_args[0].type, ['tap', 'singleTap', 'doubleTap', 'swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown ']) > -1) {
                        //是Event对象才放入
                        _args[0].originalEvent = evtObj;
                    }
                }
                return $triggerFn.apply(this, _args);
            }

        }, false, true);

        /** detect orientation change */
        $(document).ready(function () {
            var getOrt = function() {
                    var elem = document.documentElement;
                    return elem.clientWidth / elem.clientHeight < 1.1 ? "portrait" : "landscape";
                },
                lastOrt = getOrt(),
                handler = function() {
                    clearInterval(timeId);
                    timeId = $.later(function() {
                        var curOrt = getOrt();
                        if (lastOrt !== curOrt) {
                            lastOrt = curOrt;
                            clearInterval(timeId);
                            $(window).trigger('ortchange')
                        }
                    }, 50, true);
                },
                timeId;
            if (!$.support.orientation) $(window).bind('resize', $.debounce(handler));
            else $(window).bind('orientationchange', $.debounce(handler));
        });
    });
})(Zepto);


//自定义highlight效果
(function($) {
    $.implement({
        /**
         * @name highlight
         * @desc 禁用掉系统的高亮，当手指移动到元素上时添加指定class，手指移开时，删除该class
         * @grammar  highlight(className)   ⇒ self
         * @example var div = $('div');     //添加高亮效果
         * div.highlight('div-hover');
         */
        highlight: function(cl) {
            return this.each(function() {
                var $el = $(this),
                    timer;
                $el.css('-webkit-tap-highlight-color', 'rgba(255,255,255,0)')
                    .on('touchstart touchend touchmove', function(e) {
                        if ($el[0].contains(e.target)) {
                            switch (e.type) {
                                case 'mousedown':
                                case 'touchstart':
                                    timer = $.later(function() {
                                        $el.addClass(cl);
                                    }, 100);
                                    break;
                                case 'touchend':
                                case 'mouseup':
                                case 'touchmove':
                                case 'mousemove':
                                    clearTimeout(timer);
                                    $el.removeClass(cl);
                            }
                        }
                    })
            })
        },
        /**
         * @name behavior
         * @desc 禁用掉系统的高亮，当手指移动到元素上时添加指定class，手指移开时，删除该class
         * @deprecated 不推荐使用, 代替方法{@link[mobile/ex.js#highlight] highlight}.
         * @grammar  behavior(className)   ⇒ self
         * @example var div = $('div');
         * div.behavior('div-hover');
         */
        behavior: function() {
            return this.highlight.apply(this, arguments);
        }
    }, false, true);

    /**
     * @name Trigger Events
     * @theme event
     * @desc 扩展的事件
     * - ***scrollStop*** : scroll停下来时触发
     * @example $(document).on('scrollStop', function () {        //scroll停下来时显示scrollStop
     *     console.log('scrollStop');
     * });
     */

    /** dispatch scrollStop */
    $(window).on('scroll', $.debounce(0, function() {
        $(document).trigger('scrollStop');
    }, false));
})(Zepto);
///import ui.mobile.mobile;
///import ui.mobile.ex;

/**
 * @file 公共行为方法
 * @name Control
 */

(function($, undefined) {
    $.ui.define('control', function(require) {
        var os = $.os,
            version = parseFloat(os.version),
            isDesktop = !version,
            isIos = os.ios,
            isAndroid = os.android,
            htcBug = /htc_sensation_z710e/i.test(navigator.userAgent),
            adapter = {};

        /**
         * @desc 固顶fix方法，在ios5及以上设备采用css支持的position:fixed属性，其他支持fix方法不好或不支持的设备上
         * 将元素position设为absolute，在每次scrollstop时根据opts参数设置当前显示的位置，类似fix效果。单个元素可
         * 调用，也可直接在组件实例上调用
         * @grammar $.ui.control.fix(el, options)  ⇒ undefined
         * @grammar instance.fix(options)  ⇒ undefined
         * @name fix
         * @param {String || HTMLElement}      elem      选择器或elements
         * @param {Object}                     options   设置属性
         * @example var div = $('div');
         * $.ui.control.fix(div, {top:0, left:0}); //将div固顶在左上角
         * $.ui.control.fix(div, {top:0, right:0}); //将div固顶在右上角
         * $.ui.control.fix(div, {bottom:0, left:0}); //将div固顶在左下角
         * $.ui.control.fix(div, {bottom:0, right:0}); //将div固顶在右下角
         *
         * var gotop = $.ui.gotop(el, opts);
         * gotop.fix({bottom: 10, right: 10});     //将返回顶部按钮固定在右下角
         */
        adapter.fix = function(elem, options) {
            var $elem = $(elem),
                elem = $elem.get(0),
                UA = navigator.userAgent,
                isUC = /Linux/i.test(UA) || ($.os.ios && (!/safari/i.test(UA) && !/qq/i.test(UA))),
                opts = $.extend({zIndex: 999}, options || {}),
                offset = options.bottom ? options.bottom*-1 : (options.top||0);

            if ((isDesktop || isIos && version >= 5) && !htcBug && !isUC) {
                $elem.css('position', 'fixed').css(opts);

                if (!elem.isFixed && $.browser.qq) {
                     $(document).on('scrollStop', function() { // modified by zmm, 在QQ上当pageOffsetY大于45时，top值会自动增加45，trace:FEBASE-368
                        $elem.css('top', Math.max(-45, -window.pageYOffset) + 'px');
                    });
                }

                elem.isFixed = true;
                return;
            }

            opts['position'] = 'absolute';
            $elem.css(opts);
            if (!elem.isFixed) {
                elem.isFixed = true;
                $(document).on('scrollStop', function(e) {
                    $elem.css('top',window.pageYOffset + (options.bottom ? window.innerHeight  - $elem.height() : 0) + offset + 'px')
                });
            }
        };

        adapter.setFloat = function(elem) {
            var $elem = $(elem),
                $copy = $elem.clone().css({
                    opacity: 0,
                    display: 'none'
                }).attr('id', ''),
                isFloat = false,
                touch = {},
                defaultPosition = $elem.css('position') || 'static',
                appear = function() {
                    adapter.fix($elem, {
                        x: 0,
                        y: 0
                    });
                    $copy.css('display', 'block');
                    isFloat = true;
                },
                disappear = function() {
                    $elem.css('position', defaultPosition);
                    $copy.css('display', 'none');
                    isFloat = false;
                },
                check = function(pos) {
                    var top = $copy.get(0).getBoundingClientRect().top || $elem.get(0).getBoundingClientRect().top,
                        pos = pos || 0 + top;

                    if(pos < 0 && !isFloat){
                        appear();
                    }else if(pos > 0 && isFloat){
                        disappear();
                    }
                };

            $elem.after($copy);

            $(document).on('touchstart', function(e){
                touch.y = e.touches[0].pageY;
            }).on('touchmove', function(e){
                var pos = e.touches[0].pageY - touch.y;
                touch.y = e.touches[0].pageY;
                check(pos);
            });

            $(window).on('scroll', function() {
                check();
            });
        };
        
        return adapter;
    });

})(Zepto);
///import ui.mobile.mobile;
///import ui.mobile.ex;

/**
 * @name $.ui.widget
 * @file
 * @desc 所有组件的基类
 */

(function($, undefined){

    $.ui.create('widget', function() {}, {
        
        /**
         * @name _createWidget
         * @desc 内部接口，组件通用构造器
         */
        _createWidget: function(selector, options) {
            var me = this;

            if ($.isPlainObject(selector)) {
                options = selector || {};
                selector = undefined;
            }

            $.extend(me, {
                _element: selector && $(selector),
                _data: $.extend({status: true, plugins: {}}, me._data, options)
            });

            me._create();
            me._init();

            me.widget().on('touchstart touchend tap', function(e) { // global events
                (e['bubblesList'] || (e['bubblesList'] = [])).push(me);
            });
        },

        /**
         * @name _create
         * @desc 内部接口，用来创建组件所需的dom
         */
        _create: function() {},

        /**
         * @name _init
         * @desc 内部接口，完成事件绑定及初始化，在_create后执行
         */
        _init: function() {},

        /**
         * 销毁组件
         * @grammar destroy()  ⇒ undefined
         * @name destroy
         */
        destroy: function() {
            var me = this,
                $elem;

            $.each(me.data('plugins'), function(id, component) {
                component.destroy();
            });
            $elem = me.trigger('destroy').off().widget();
            $elem.find('*').off();
            $elem.off().remove();
            me.__proto__ = null;
            $.each(Object.keys ? Object.keys(me) : me, function(i, key){
                delete me[key];
            });
        },

        /**
         * 获取or设置属性
         * @name data
         * @grammar data(key, [value])  ⇒ value
         * @param {String} key 参数名
         * @param {Any} value 参数值
         * @example instance.data('foo'); // 获取key为foo的值
         * instance.data('foo', '123'); // 将123赋值给foo
         */
        data: function(key, value){
            var _data = this._data;
            if ($.isPlainObject(key)) return $.extend(_data, key);
            else return value !== undefined ? _data[key] = value : _data[key]; 
        },

        /**
         * @desc 获取根元素
         * @name widget
         * @grammar widget() ⇒ Zepto Instance
         */
        widget: function(elem) {
            return this._element = elem || this._element;
        },

        /**
         * 获取or设置component
         * @grammar component(key, fn)  ⇒ obj
         * @name component
         * @param {String} id component id
         * @param {Function} createFn component factory  
         * @return {Component} component instance
         */
        component: function(id, createFn) {
            var me = this,
                plugins = me.data('plugins');

            try {
                if ($.isFunction(createFn)) {
                    plugins[id] = createFn.apply(me);
                } else if (createFn !== undefined) {
                    if (plugins[id]) plugins[id].destroy();
                    delete plugins[id];
                }
            } catch (e) {}
            
            return plugins[id];
        },

        /**
         * 注册事件
         * @grammar on(event, callback[, context])  ⇒ instance
         * @name     on
         * @param    {String}      ev          事件名
         * @param    {Function}    callback    事件处理函数
         * @param    {Object}      context     上下文对象
         * @example instance.on('create', function(){
         *     //...
         * });
         */
        on: function(type, callback, context) {
            var me = this,
                ev = type.toLowerCase(),
                calls = me._callbacks || (me._callbacks = {}),
                list = calls[ev] || (calls[ev] = []);

            list.push([callback, context]);

            return me;
        },

        /**
         * 注销事件
         * @grammar off(event, callback)  ⇒ instance
         * @name     off
         * @param    {String}      ev          事件名
         * @param    {Function}    callback    事件处理函数
         */
        off: function(type, callback) {
            var me = this, calls;

            if (!type) {// 如果事件为空，移除该组件的所有事件的绑定函数
                me._callbacks = {};
            } else if (calls = me._callbacks) {
                type = type.toLowerCase();

                if (!callback) {// 如果callback为空，移除该事件的所有绑定函数
                    calls[type] = [];
                } else {
                    var list = calls[type];
                    if (!list) return me;
                    for (var i = 0, l = list.length; i < l; i++) {
                        if (list[i] && callback === list[i][0]) {
                            list[i] = null;
                            break;
                        }
                    }
                }
            }

            return me;
        },

        /**
         * 触发事件
         * @grammar trigger(type)  ⇒ instance
         * @name     trigger
         * @param    {String}      type             事件名
         * @param    {All}         arguments      需要传递的参数
         */
        trigger: function(type) {
            var me = this,
                type = type.toLowerCase(),
                handler = me.data('on' + type),
                args = $.slice(arguments, 1),
                list, calls, callback;

            // 先执行参数中的onevent
            handler && handler.apply(me, args);

            if (!type || !(calls = me._callbacks)) return me;

            if (list = calls[type]) {
                for (var i = 0, l = list.length; i < l; i++) {
                    callback = list[i];
                    callback[0].apply(callback[1] || me, args);
                }
            }

            return me;
        }

    });

        
    $(document).ready(function() {
        // auto-self init
        $(document).trigger('pageInit');
    });

})(Zepto);





/**
 * @file
 * @name Add2desktop
 * @desc 在IOS中将页面添加为桌面图标(不支持Android系统)
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */

(function($, undefined) {
    /**
     * @name     $.ui.add2desktop
     * @grammar  $.ui.add2desktop([el [,options]]) =>instance
     * @desc 组件构造器
     * **el**
     * 根元素选择器或者对象
     * **Options**
     * - ***options.icon {String}*** (必选) 产品线ICON'S URL
     * - ***options.container {selector}*** (可选) 渲染到哪个元素
     * @example
     * var demo = $.ui.add2desktop({
     *     icon: '..//image/icon.png'
     * })
     */
    $.ui.create('add2desktop', {
        _data: {
            icon: '../../add2desktop/icon.png'
        },

        _create: function() {
            var me = this,
                $elem = (me.widget() || me.widget($('<div></div>'))).addClass('ui-add2desktop').css('display', 'none'),
                container = $(me.data('container') || document.body),
                addicon = ($.os.ios && ($.os.version).substr(0, 3)) > 4.1 ? 'ui-add2desktop-new' : 'ui-add2desktop-old',
                tpl = '<div class="ui-add2desktop-shadowbox"></div><div class="ui-add2desktop-content"><div class="ui-add2desktop-type"><img src="' + me.data('icon') + '"/></div><div class="ui-add2desktop-text">先点击<span class="' + addicon + '"></span>，<br>再"添加至主屏幕"</div><a href="javascript:;" class="ui-add2desktop-close"><span class="ui-add2desktop-close-btn"></span></a>';

            if (!$elem.html(tpl).parent().length) $elem.appendTo(container);
            me.trigger('create');
        },

        _init: function() {
            var me = this,
                os = $.os,
                version = parseFloat(os.version),
                isDesktop = !version,
                isIos = os.ios,
                isAndorid = os.android,
                ua = navigator.userAgent,
                isUC = me.data('isUC', /Linux/i.test(ua) || ($.os.ios && (!/safari/i.test(ua) && !/qq/i.test(ua)))),
                _rotateEV = me.data('rotateEV', 'ortchange');

            $('.ui-add2desktop-close').on('tap', function(e) {
                me.hide();
                (e.originalEvent || e).preventDefault();
            });

            me.data('_winfun', function(e) {
                me._setpos();
            });

            $(window).on(_rotateEV + ' scrollStop', me.data('_winfun'));

            me.widget().css('position', me.data('useFixed', isDesktop || isIos && version >= 5 && !isUC || isAndorid) ? 'fixed' : 'absolute');
            $(function() {
                $.later(function() {
                    me.data('available', true);
                    me._setpos().trigger('init');
                }, 200)
            });
        },

        _setpos: function() {
            var me = this,
                $elem = me.widget();

            !me.data('useFixed') && $elem.css('top', window.pageYOffset + $(window).height() - 85);
            return me.trigger('setpos');
        },
        /**
         * @name hide
         * @grammar hide() => self
         * @desc 隐藏add2desktop
         */
        hide: function() {
            var me = this;
            $.later(function(){
                me.widget().css({display: 'none', zIndex: -1, left: -9999});
                me.trigger('close');
            }, 20);
            return me;
        },
        /**
         * @name show
         * @grammar show() => self
         * @desc 显示add2desktop
         */
        show: function() {
            var me = this;

            if ( $.os.ios) {
                if(!me.data('available')){
                    $.later( $.bind(me.show, me), 20);
                    return me;
                }

                me.widget().css({display: 'block', opacity: 0}).animate({
                    opacity: 1
                }, {
                    duration: 100,
                    ease: 'ease-in',
                    complete: function() {
                        me.trigger('open');
                    }
                });
            }
            return me;
        },
        /**
         * @name destroy
         * @grammar destroy()   => undefined
         * @desc 销毁add2desktop
         */
        destroy: function() {
            var me = this;
            $(window).off(me.data('rotateEV')+ ' scrollStop', me.data('_winfun'));
            $('.ui-add2desktop-close', me.widget()).off().remove();
            me.widget().html('');
            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***setpos*** : 设置位置时触发的事件
         * - ***close*** : 关闭时触发的事件
         * - ***open*** : 显示时触发的事件
         */

    }).attach('control.fix');

})(Zepto);

///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @file
 * @name Dialog
 * @desc 对话框组件
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */
(function($, undefined) {
    /**
     * @desc     dialog组件
     * 
     * **Options**
     * - ***content {selector}*** (必选)内容
     * - ***container {String}*** (可选)父元素
     * - ***width {String}*** (可选)宽度
     * - ***height {String}*** (可选)高度
     * - ***cls {String}*** (可选)样式
     * - ***title {selector}*** (可选)标题
     * - ***mask {Boolean}*** (可选)是否启用遮罩：true
     * - ***closeBtn {Function}*** (可选)是否显示关闭按钮：true
     * - ***onclose {Function}***(可选)组件关闭时触发
     * 
     * @name     $.ui.dialog
     * @grammar  $.ui.dialog(options) => instance
     * @param    {Object}     options                参数
     * @param    {String}     options.content        (必选)内容
     * @param    {Selector}   options.container      (可选)父元素
     * @param    {Number}     options.width          (可选)宽度
     * @param    {Number}     options.height         (可选)高度
     * @param    {String}     options.cls            (可选)样式
     * @param    {String}     options.title          (可选)标题
     * @param    {Boolean}    options.mask           (可选)是否启用遮罩：true
     * @param    {Boolean}    options.closeBtn       (可选)是否显示关闭按钮：true
     * @param    {Event}      options.onclose        (可选)组件关闭时触发
     */
    $.ui.create('dialog', {
        _data: {
            width: 300,
            mask: true,
            closeBtn: true
        },

        _create: function() {
            var me = this,
                $container = $(me.data('container') || document.body),
                $elem = (me.widget() || me.widget($('<div></div>'))).css({
                    width: me.data('width'),
                    height: me.data('height')
                }).addClass('ui-dialog');

            me.data('cls') && $elem.addClass(me.data('cls'));
            me.data('title') && me.data('titleElem', $('<div class="ui-dialog-title"><div class="titleText">' + me.data('title') + '</div></div>')).appendTo($elem);
            me.data('contentElem', $('<div class="ui-dialog-content"><div class="contentHtml">' + me.data('content') + '</div></div>')).appendTo($elem);
            me.data('closeBtn') && (me.data('titleElem') || me.data('contentElem')).append('<div class="ui-dialog-close">×</div>');
            me.data('maskElem', $('<div class="ui-mask"></div>')).appendTo($container);
            $elem.appendTo($container);
            me.trigger('create');
        },

        _init: function() {
            var me = this,
                $elem = me.widget(),
                _eventHandler = $.bind(me._eventHandler, me);

            $elem.on('touchmove click', _eventHandler);
            $(window).on('ortchange', _eventHandler);
            me.data('maskElem').on('touchmove tap', _eventHandler);

            me.on('destroy', function() {
                me.data('maskElem').off();
                $(window).off('ortchange', _eventHandler);
            }).trigger('init');
        },

        /**
         * 事件管理函数
         * @private
         */
        _eventHandler: function(e) {
            var me = this,
                elem = e.target;

            if (!me.data('status')) return;
            switch (e.type) {
                case 'touchmove':
                    e.preventDefault();
                    break;
                case 'tap':
                case 'click':
                    if (elem.className == 'ui-dialog-close' || elem.nodeValue == '×') me.hide();
                    else if (elem.className == 'ui-mask') me.trigger('maskClick');
                    break;
                case 'ortchange':
                    me._resize(e);
                    break;

            }
        },

        /**
         * 调整mask尺寸
         * @private
         */
        _resize: function(e) {
            var me = this,
                $mask = me.data('maskElem'),
                root = document.body,
                ucOffset = $.browser.uc ? 1 : 0; // add by zmm, 在UC下，mask盖住window不会触发resize事件，故减掉1px

            if ($mask.css('display') == 'block') {
                $mask.css({
                    width:  root.clientWidth,
                    height: Math.max(root.scrollHeight, root.clientHeight) - ucOffset
                });
            }
            me.trigger('resize');
        },

        /**
         * @desc 设置 || 获取title
         * @name title
         * @grammar title(value)  ⇒ string
         * @param {String} value 标题
         * @return {String} html
         */
        title: function(value) {
            var $title = this.data('titleElem').find('.titleText');

            if (value != undefined) {
                $title.html(value);
                this.trigger('resize');
            }

            return $title.html();
        },

        /**
         * @desc 设置 || 获取content
         * @name content
         * @grammar content(value)  ⇒ string
         * @param {String} value 内容
         * @return {String} html
         */
        content: function(value) {
            var $content = this.data('contentElem').find('.contentHtml');

            if (value != undefined) {
                $content.html(value);
                this.trigger('resize');
            }
            
            return $content.html();
        },

        /**
         * dialog居中
         * @private
         */
        _center: function() {
            var me = this,
                $elem = me.widget(),
                $win = $(window);

            $elem.css({
                left: $win.width() / 2,
                top: $win.height() / 2 + window.pageYOffset,
                marginTop: -$elem.height() / 2,
                marginLeft: -$elem.width() / 2
            });

            me.on('resize', function() {
                $.later(function() {
                    $elem.css({
                        left: $win.width() / 2,
                        top: $win.height() / 2 + window.pageYOffset
                    });
                }, 10);
            });

            return me;
        },

        /**
         * @desc 显示dialog
         * @name show
         * @grammar show(0, 0) => self
         * @param {String} x 横坐标
         * @param {String} y 纵坐标
         * @return {Object} this
         */
        show: function(x, y) {
            var me = this,
                $elem = me.widget(),
                root = document.body,
                pos = {left: x || 0, top: y || 0};

            $elem.css('display', 'block');
            if (me.data('mask')) {
                me.data('maskElem').css({
                    display: 'block',
                    width: root.clientWidth,
                    height: Math.max(root.scrollHeight, root.clientHeight)
                });
            }

            x == undefined ? me._center() : $elem.css(pos);
            return me;
        },

        /**
         * @desc 隐藏dialog
         * @name hide
         * @grammar hide() => self
         * @param {Boolean} destroy 是否销毁
         * @return {Object} this
         */
        hide: function(destroy) {// trace 157 by rxq, 取消hide函数的延时
            var me = this;
            me.widget().css('display', 'none');
            me.data('maskElem').css('display', 'none');
            me.trigger('close');
            destroy && me.destroy();
            return me;
        },

        /**
         * @desc 关闭dialog
         * @name close
         * @grammar close() => self
         * @return {Object} this
         */
        close: function() {
            this.hide(true);
        },

        /**
         * @desc 销毁组件
         * @name destory
         * @grammar destroy() => undefined
         */
        destroy: function() {
            var me = this;
            me.data('maskElem').remove();
            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***close*** : (event)点击关闭按钮触发
         * - ***maskClick***: (event)点击遮罩层时触发
         */

    }).attach('control.fix');

})(Zepto);



/**
 * @file
 * @name Dropmenu
 * @desc 点击按钮显示一组可选择的下拉菜单
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */
(function($, undefined){
    /**
     * @name       $.ui.dropmenu
<<<<<<< .mine
     * @grammar    $.ui.dropmenu(el [,options]) => instance
=======
     * @grammar    $.ui.dropmenu(el [,options]) =>instance
>>>>>>> .r4545
     * @desc 组件构造器
     * **el**
     * 根元素选择器或者对象
     * **Options**
     * - ***options.content {String}*** (必选)内容: [{text:'', callback:function(){}, className:''}]
     * - ***options.mode {String}*** (可选)模式: selected
     * - ***options.offset {Number}*** (可选)下拉列表和上面button之间的距离: y=0
     * - ***options.hasArrow {Boolean}*** (可选)是否显示箭头icon: false
     * - ***options.container {selector|zepto}*** (可选)放置的父容器
     * - ***options.instanceId {String}*** (可选)实例名称
     * - ***options.callback {Function}*** (可选)下拉列表点击事件回调函数
     * - ***options.position {String}*** (可选)排列方式: horizontal
     * - ***options.isScroll {String}*** (可选)是否滚动
     * @example
     *  var demo = $.ui.dropmenu({
     *      '<div class="ui-dropmenu"></div>',
     *        {
     *            container:$('.recommend',me.widget()),
     *            content:[
     *                {
     *                    text:'排序方式',
     *                    callback:function(index,el,obj){}
     *                },
     *                {
     *                    text:'按相关性',
     *                    callback:function(index,el,obj){}
     *                },{
     *                    text:'最多下载',
     *                    callback:function(index,el,obj){}
     *                },{
     *                    text:'最新上传',
     *                    callback:function(index,el,obj){}
     *                }
     *            ],
     *            offset:0,
     *            mode:'selected',
     *            hasArrow:true,
     *            oncreate:function(){}
     *    });
     */
	$.ui.create('dropmenu', {
		_data: {
			content: [],
			container:'',
			mode: 'default',
			offset: 0,
			instanceId:'',
			hasArrow: false,
			position:'default',
			callback:'',
            isScroll:false
		},

		_create: function() {
			var me = this,
				instanceId = me.data('instanceId'),
				$container = $(me.data('container')||document.body),
				$widget = me.widget(),
				$el = $widget|| me.widget($('<div class="ui-dropmenu"></div>')),
				$arrow = me.data('arrow',$('<span class="ui-dropmenu-arrow"></span>')),
				$title = me.data('title',$('<span class="ui-dropmenu-title">'+me.data('content')[0].text+'</span>')),
				$button = me.data('button',$('<div class="ui-dropmenu-button"></div>')),
				$menu = me.data('menu',$('<div class="ui-dropmenu-content"></div>'));
			me.data('uiArrow',$('<span class="ui-dropmenu-content-arrow"></div>')).appendTo($menu);
			
			
			//如果el不存在，添加instanceId
			if(!$widget&&instanceId){
				$el.addClass(instanceId);
			}

			//渲染title
			$button.append($title);
			
			//渲染button,
			$el.css('position','relative').append($button);
			
			//渲染menu
			$el.append($menu);
			
			//将先menu隐藏
			$menu.css('visibility','hidden');
			
			//创建下拉列表
			me._createmenu();
			
			//渲染箭头
			if(me.data('hasArrow')){
				$button.append($arrow);
			}
			
			/*添加实例名称，同时渲染到container容器内
			 *当给定一个存在dom元素的时候，不做操作
			 */
			if(!$el.parent().get(0)){
				$el.appendTo($container);
			}
			
			//menu是否横排显示
			if(me.data('position')=='horizontal'){
				var $item = me.data('items');
				var items = $item.children();
				var str = 0;
				$item.addClass('horizontal');
				$.each($(items), function (index, item) {
                    str += $(item).offset().width;
                });
				$item.css({'float':'left'});
				$item.parent().css('width',str+'px');
				//设定滚动元素外层容器的高度
				if(me.data('isScroll')){
					$('.scrollBox',$menu).css('height',$item.offset().height+'px');
				}
			}
			//设定offset
			me._setOffset();
			
			//将visibility隐藏去掉
			$menu.css('visibility','visible');
			
			//默认菜单收起
			$menu.hide();
            
			me.trigger('create');
		},

		_init: function() {
			var me = this,
				$button = me.data('button'),
				$menu = me.data('menu'),
				$arrow = me.data('arrow'),
				$title = me.data('title'),
				data = me.data('content'),
				length = data.length,
				$item = me.data('items'),
				$items = $item.children(),
				callback = me.data('callback'),
				$el = me.widget();
			
			me.data('menuOffset',$menu.offset());
				
			//绑定button点击事件
			$button.on('touchstart',function(e){
                        if($arrow){
                            $arrow.toggleClass('ui-dropmenu-arrow-on')
                        }
                        //重置menu的offset
                        me.setOffset();
                        $menu.toggle();
                        me._resetScroll();
			});
			//绑定menu点击事件
			if(!me.data('isScroll'))
			$items.on('touchstart',function(e){
                setTimeout(function(){
                    me._menuEvent(e);
                },100);
            });

            var _eventHandler = $.bind(me._eventHandler, me);
			
			$(window).on('resize',_eventHandler);
			
			//点击外层容器menu消失
			$(document).on('touchstart',_eventHandler);

			if(me.data('isScroll')){
				$(document).on('DOMContentLoaded',_eventHandler);
			}
            me.on('destroy',function(){
                $(window).off('resize',_eventHandler);
                $(document).off('touchstart',_eventHandler);
                $(document).off('DOMContentLoaded',_eventHandler);
            });
			me.trigger('init');
		},

        /**
         * 事件中心
         * @private
         */
        _eventHandler: function(e){
            var me = this;
            switch (e.type) {
                case  'resize':
                    setTimeout(function(e){me.setOffset(e)},300);
                    break;
                case  'click':
                case  'touchstart':
                    me._isClose(e);
                    break;
                case 'DOMContentLoaded':
                    setTimeout(me.data('scroll'),200);
                    break;
            }
        },

        /**
         * 是否关闭
         * @private
         */
        _isClose: function(e) {
        	var me = this;
        	var bubblesList = e['bubblesList'];
        	if (!bubblesList || bubblesList.indexOf(me) == -1) {
        		me.hide();
        	}
        },

		/** 
		 * 创建menu
		 * @private
		 */
		_menuEvent: function(e) {
			var me = this,
				$target = $(e.target),
				index = me.data('index'),
				$title = me.data('title'),
				value = $title.html(),
				callback = me.data('callback'),
				mode = me.data('mode'),
				data = me.data('content'),
				length = data.length,
				$item = me.data('items'),
				$arrow = me.data('arrow'),
				$menu = me.data('menu'),
				$items = $item.children();

			$target = $target.closest('li');

			//添加配置项callback
			var i = $target.index();
			i = i < length - 1 ? i : length - 1;

			if (!data[i].callback) {
				if ($.isFunction(callback)) callback(i, $target, me);
			} else {
				data[i].callback(i, $target, me)
			}

			//mode=='selected'
			if (mode == 'selected') {
				$target.hide();

				$title.html($target.html());

				if (index == 0) {
					$items.first().html(value).show();
				} else {
					$($items.get(index)).show();
				}

				if ($arrow) {
					$arrow.toggleClass('ui-dropmenu-arrow-on')
				}
				$menu.hide();
				me.trigger('select');
			}
			me.data('index', $target.index());
		},
		

		_createmenu: function() {
			var me = this,
				data = me.data('content'),
				$menu = me.data('menu'),
				items = [],
				$items = me.data('items', $('<ul class="ui-dropmenu-items"></ul>'));
			$.each(data, function(index, item) {
				var className = data[index].className ? 'class="' + data[index].className + '"' : "";
				if (index > 0) items.push('<li ' + className + '>' + data[index].text + '</li>');
			});
			me.data('index', 0);
			me.data('length', items.length);
			//添加滚动对象
			if (me.data('isScroll')) {
				$menu.append('<div class="scrollBox"><div class="scroller"></div></div>');
				$('.scroller', $menu).append($items);
			} else {
				$menu.append($items);
			}
			$items.html('<li style="display:none;"></li>' + items.join(''));
		},
		

		_scroll: function() {
			var me = this,
				$menu = $('.scrollBox', me.data('menu')).get(0),
				hSroll = me.data('position') == 'horizontal' ? true : false,
				vScroll = me.data('position') != 'horizontal' ? true : false;

			var myScroll = new iScroll($menu, {
				hScroll: hSroll,
				vScroll: vScroll,
				onTouchEnd: function(e) {
					if (!this.moved && !this.absDistY) {
						me._menuEvent(e);
					}
				}
			});

			me.data('scroll', myScroll);
		},
		

        /**
         * @name show
         * @grammar show() => self
         * @desc 显示菜单
         */
		show: function() {
			var me = this,
				$arrow = me.data('arrow');
			me.setOffset();
			me.data('menu').show();
			if ($arrow) {
				$arrow.addClass('ui-dropmenu-arrow-on');
			}
			me._resetScroll();
			me.trigger('show');
			return me;
		},


        /**
         * @name hide
         * @grammar hide() => self
         * @desc 隐藏菜单
         */
		hide: function() {
			var me = this,
				$arrow = me.data('arrow');
			me.data('menu').hide();
			if ($arrow) {
				$arrow.removeClass('ui-dropmenu-arrow-on');
			}
			me.trigger('hide');
			return me;
		},
		

		_setOffset: function(){
			var me = this,
				$menu = me.data('menu'),
				$arrow = me.data('uiArrow'),
				winW = document.body.clientWidth,
				curH = document.documentElement.clientHeight,
				bodyH = document.body.offsetHeight,
				winH = bodyH<curH?curH:bodyH,
				offset = me.data('offset'),
				offsetX = offset.x?offset.x:0,
				offsetY = offset.y?offset.y:offset;

			var offset = me.data('button').offset();
			var menuOffset = $menu.offset();

			$menu.css('top',(offset.height-1+offsetY)+'px');
			$arrow.css({'left':(menuOffset.width/2-6)+'px','top':'-7px'}).removeClass('ui-dropmenu-content-arrowbottom');
			$menu.css('left',(-(menuOffset.width-offset.width)/2+offsetX)+'px');

			//左边界判断
			if(offset.left<menuOffset.width/2){
				$menu.css('left',(0+offsetX)+'px');
				$arrow.css('left',(offset.width/2-6)+'px');
			}
			//右边界判断
			else if(winW-offset.width-offset.left<(menuOffset.width-offset.width)/2){
				$menu.css('left',(-(menuOffset.width-offset.width)+offsetX)+'px');
				$arrow.css('left',(menuOffset.width-offset.width/2-6)+'px');
			}
			//上边界判断
			if(winH-offset.height-offset.top-offsetY<menuOffset.height){
				$menu.css('top',-(menuOffset.height-1+offsetY)+'px');
				$arrow.css('top',(menuOffset.height-1)+'px').addClass('ui-dropmenu-content-arrowbottom');
			}
			me._resetScroll();
		},

		/** 
		 * 判断是否加载scroll或者是refresh
		 * @private
		 */
		_resetScroll: function() {
			var me = this;
			if (!me.data('scroll') && me.data('isScroll')) {
				me._scroll();
			} else if (me.data('scroll')) {
				me.data('scroll').refresh();
			}
		},
		

        /**
         * @name setOffset
         * @grammar setOffset() => self
         * @desc 重新设置offset
         */
		setOffset: function() {
			var me = this,
				isShow = false,
				$menu = me.data('menu');
			//将菜单显示
			if ($menu.css('display') == 'none') {
				$menu.css('visibility', 'hidden').show();
				isShow = true;
			}
			me._setOffset();
			if (isShow) $menu.hide().css('visibility', 'visible');
            return me;
		},
		

        /**
         * @name destory
         * @grammar destory()  => undefined
         * @desc 销毁组件
         */
        destroy: function () {
            var me = this;

            me.widget().off();

            if(me.data('scroll'))me.data('scroll').destroy();

            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***select***: 选中一个option项时触发
         * - ***show***: dropmenu显示是触发
         * - ***hide***: dropmenu隐藏时触发
         * @example
         * var dropmenu = $.ui.dropmenu(opts);
         * dropmenu.on('select', function (index) {
         *     console.log('option selected');           //输出option selected
         * })
         */
	});
	
})(Zepto);




/**
 * @file
 * @name Gotop
 * @desc 提供一个快速回到页面顶部的按钮
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */

(function($, undefined) {
    /**
     * @name       $.ui.gotop
<<<<<<< .mine
     * @grammar    $.ui.gotop(el [,options]) => instance
=======
     * @grammar    $.ui.gotop(el [,options]) =>instance
>>>>>>> .r4545
     * @desc 组件构造器
     * **el**
     * 根元素选择器或者对象
     * **Options**
     * - ***options.container {selector|zepto}*** (可选)放置的父容器
     * - ***options.node {selector}*** (可选)返回到节点，如果不存在则返回到最顶部
     * - ***options.useAnim {Boolean}*** (可选)返回顶部时是否使用动画,默认为true
     * - ***options.afterScroll {Function}*** (可选)成功返回后执行的函数
     * - ***options.touchendHandler {Function}*** (可选)当滚动完成后执行的，用来决定gotop是否显示，默认我们的插件是根据window.pageYOffset的值来的，但有时候可能是iscroll,这个时候需要传入自定义的方法来决定显示与隐藏
     * @example
     * var demo = $.ui.gotop('#gotop', {
     *    useAnim: true,
     *    afterScroll: function() {},
     * })
     */
    $.ui.create('gotop', {
        _data: {
            useAnim: true,
        	afterScroll: function() {},
            touchendHandler:function(){}
        },

        _create: function() {
            var me = this,
            	$el = me.widget(),
            	$container = $(me.data('container') || document.body);
		
			//设定默认el
            if($el == undefined) $el = me.widget($('<div class="ui-gotop"></div>'));
			!$el.hasClass('ui-gotop') && $el.addClass('ui-gotop');
			$el.html('<span>&nbsp;</span>');

			if (me.data('container') || !$el.parent().length) $el.appendTo($container);
            me.trigger('create').data('container', $container);
        },

        _init: function() {
            var me = this,
            	_eventHandler = $.bind(me._eventHandler, me);

            me.data('_eventHandler', _eventHandler);

            //modified by zmm，解决在android2.1上touch时间过长即为move的bug
            $.os.android && parseFloat($.os.version).toFixed(1) == 2.1 && $(document).on('touchstart', _eventHandler);
			$(document).on('touchmove mousewheel scrollStop', _eventHandler);
            $(window).on('scroll', _eventHandler);
            me.widget().on('click', _eventHandler);
            me.on("destroy", function () {                      //modified by zmm 添加destory事件
                me.widget().off("click", _eventHandler);
                $(document).off("touchmove touchend mousewheel scrollStop", _eventHandler);
                $(window).off('scroll', _eventHandler);
                $.os.android && parseFloat($.os.version).toFixed(1) == 2.1 && $(document).off('touchstart', _eventHandler);
            }).trigger('init');
        },

		/**
         * 显示滚动位置
		 * @private
         */
		_scrollTo: function() {
            var me = this,
                scrTop = window.pageYOffset,
                nodeTop = me.data('node') ? $(me.data('node')).offset().top : 0,
                timeId;

            if (!me.data('useAnim')) {
                window.scrollTo(0, nodeTop || 1);
                return me.hide().trigger('goTop');
            } else return me.hide().trigger('goTop', timeId = $.later(function() {
                if (nodeTop < scrTop) {
                    scrTop = scrTop - 100;
                    var y = scrTop - nodeTop < 100 ? nodeTop : scrTop;
                    window.scrollTo(0, y);
                } else clearInterval(timeId);
            }, 16, true));
		},

         /**
         * @name show
         * @grammar show() => self
         * @desc 显示gotop，将display设为block，visibility设为visible
         */
        show: function(pos) {
            var me = this,
                $elem = me.widget();
            if (me.data('isShow') !== true) {
				$elem.css({
					'display': 'block',
					'visibility': 'visible'
				});
            	me.data('isShow', true);
            }
            $elem.css(pos || {});
			return me;
        },

        /**
         * @name hide
         * @grammar hide() => self
         * @desc 隐藏gotop，将display设为none
         */
        hide: function() {
            var me = this;
            if (me.data('isShow')) {
            	me.widget().css('display', 'none');
            	me.data('isShow', false);
            }
            return me;
        },

		/**
         * touchend事件处理
         * @private
         */
		_touchEndHandle: function(e) {
            if(this.data('touchendHandler') && this.data('touchendHandler').apply(this, [e])===false) return ;
			window.pageYOffset > $(window).height() ? this.show() : this.hide();
		},

		/**
         * touchmove事件处理
         * @private
         */
		_touchMoveHandle: function(e) {
            var me = this;

            if ($.os.android && parseFloat($.os.version).toFixed(1) == 2.1) {      //modified by zmm，解决在android2.1上touch时间过长即为move的bug
                me.data('moveY', e.touches[0].pageY);
                if (Math.abs(me.data('moveY') - me.data('startY')) < 30 && ($(e.target).hasClass('ui-gotop') || $(e.target).parent().hasClass('ui-gotop'))) {
                    $.later(function () {
                        me._scrollTo().hide().data('afterScroll') && me.data('afterScroll').apply(me);
                    }, 400);
                }else {
                    me.hide();
                }
            }else {
                me.hide();
            }
		},

		/**
         * 事件处理中心
         * @private
         */
        _eventHandler: function(e) {
			var me = this;
            switch (e.type) {
                case 'touchstart':    //modified by zmm，解决在android2.1上touch时间过长即为move的bug
                    me.data('startY', e.touches[0].pageY);
                    break;
                case 'touchmove':
                    clearTimeout(me.data('_touchended'));       //trance:
                    me.data('_touchended',setTimeout(function(){
                        me._touchEndHandle.call(me, e);
                    }, 300));
                    me._touchMoveHandle(e);
                    break;
                case 'click':
                    me._scrollTo().hide().data('afterScroll') && me.data('afterScroll').apply(this);
                    break;
                case 'scroll':
                    clearTimeout(me.data('_touchended'));
                    break;
				case 'mousewheel':
				case 'scrollStop':
					me._touchEndHandle(e);
					break;
			}
		},

        /**
         * @name destroy
         * @grammar destroy()  => undefined
         * @desc 销毁gotop
         */
        destroy:function(){
            var me = this;
            me.widget().off("click", me.data('_eventHandler'));
            $(document).off("touchmove mousewheel scrollStop", me.data('_eventHandler'));
            $.os.android && parseFloat($.os.version).toFixed(1) == 2.1 && $(document).off('touchstart', me.data('_eventHandler'));
            me._super();
        }


        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***gotop*** : 滚动到顶部触发的事件
         * - ***afterScroll*** : 成功返回后触发的事件
         */

    }).attach('control.fix');

    $(document).on('pageInit', function() {
        // role: data-widget = gotop.
    });

})(Zepto);




/**
 * @file
 * @name More
 * @desc 显示一个包含更多选项的下拉框
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */

(function($, undefined) {
    /**
     * @name       $.ui.more
<<<<<<< .mine
     * @grammar    $.ui.more(el [,options]) => instance
=======
     * @grammar    $.ui.more(el [,options]) =>instance
>>>>>>> .r4545
     * @desc 组件构造器
     * **el**
     * 根元素选择器或者对象
     * **Options**
     * - ***options.container {selector|zepto}*** (可选)放置的父容器
     * - ***options.content {Array}*** ((必选)内容
     * - ***options.count {Number}*** (可选)列数
     * - ***options.isShow {Boolean}*** (可选)是否默认展开
     * @example
     * var more1 = $.ui.more($('<div class="ui-more"></div>'),{
     *      'container': '.nav-wrap',
     *      content:links,
     *      oncreate:function(){}
     *  });
     */
    $.ui.create('more', {
        _data:{
			container: "",
            content: [],
            count: 5,
            isShow: false
        },
        _create: function() {
            var me = this,
                $el = me.widget(),rowTpl=[],tpl=[],rowConts=[], i, 
                $container = $(me.data('container')|| document.body)[0], //只处理第一个元素
                conts=me.data('content').concat(), //数组引用 -- by gsl
                count=me.data('count'),
                width=parseInt(100/count);
			//判断链接数据合法性
			if(!$.isArray(conts) || conts.length < 1) return;

            while(conts.length>count){
                rowConts.push(conts.splice(0,count));
            }
            if(conts.length){
                rowConts.push(conts);
            }
			//设定默认el
            if($el == undefined) {
                $el = me.widget($('<div class="ui-more"></div>'));
            }  
			//$container = $(me.data('container')|| document.body)[0];
			
			if(!$el.hasClass('ui-more')) $el.addClass('ui-more');
            tpl.push('<div class="ui-more-arrow"></div>');

            rowConts.forEach(function (rowCont) {
                rowTpl=['<div class="ui-more-links">'];
                rowCont.forEach(function(cont,itemNum){
                    var style="width:"+width+"%;"+(itemNum==count-1?"-webkit-box-flex:1":""),
                        key = cont.key || "word";     //增加各产品线搜索的key值, modified by zmm
                    rowTpl.push('<a href="'+cont.url+'" class="ui-more-link" data-key="' + key + '" style="'+style+'"><span>'+cont.text+'</span></a>');
                });
                rowTpl.push("</div>");
                tpl.push(rowTpl.join(''));
            });
			
				
			$el.html(tpl.join(''));
				
			//.appendTo($container);
			
			if($el.parent().length && !me.data('container')){
                    //如果$elem有parent，且没有传入container，不需要appendTo
             } else {
				if (!$el.parent().length) $el.appendTo($container);
             }
            me.trigger('create');
        },

        _init: function() {
            var me = this,
                $el = me.widget();
            if(!me.data('isShow')) $el.hide();
            me.trigger('init');
        },

        /**
         * @name show
         * @grammar show() => self
         * @desc 显示more面板
         */
        show: function() {
            var me = this,
                $el = me.widget();
            me.data('isShow',true);
			$el.show();
			me.trigger('aftershow');
            return me;
        },

        /**
         * @name hide
         * @grammar hide() => self
         * @desc 隐藏more面板
         */
        hide: function() {
            var me = this,
               $el = me.widget();
            me.data('isShow','');
			$el.hide();
			me.trigger('afterhide');
            return me;
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***aftershow*** : 显示后触发的事件
         * - ***afterhide*** : 隐藏后触发的事件
         */
    });
})(Zepto);

///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @file
 * @name Refresh_lite
 * @desc refresh组件的lite版，适用于android，不使用iscroll
 * @import mobile/mobile.js, mobile/widget.js, mobile/ex.js, mobile/control.js
 * */

(function($, undefined) {
    /**
     * @name $.ui.refresh
     * @grammar $.ui.refresh([el [,options]])  ⇒ instance
     * @desc **el**
     * css选择器，或者zepto对象
     *
     * **Options**
     * - ***container***              *{Selector|Zepto}* (可选)父容器，渲染的元素，默认值：document.body
     * - ***pullUpText***             *{String}*         (可选)上拉或下拉的文案，默认值：'加载更多'
     * - ***pullReleaseText***        *{String}*         (可选)上拉或下拉加载前松开时的文案，默认值：'松开立即加载'
     * - ***loadingText***            *{String}*         (可选)加载中的文案，点击和上拉下拉一样，默认值：'加载中...'
     * - ***direction***              *{String}*         (可选)拉动加载时的方向，默认值：'up'
     * - ***clickText***              *{String}*         (可选)点击加载时的按钮文案，默认值：'点击加载更多'
     * - ***type***                   *{String}*         (可选)铵钮类型，'click'或'pullup'，默认值：'click'
     * - ***isShow***                 *{Boolean}*        (可选)默认是否显示，默认值：true
     * - ***onReady***                *{Function}*       (可选)外部加载方法
     * @notice
     * **refresh非lite版中的以下参数，在lite版是不支持的**
     * - *speedScale iscroll的速度倍率，默认值：1*
     * - *useTransition 是否开启iscroll中的useTransition*
     * - *onBeforeScrollStart iscroll中scroll前的事件*
     * - *onScroll iscroll中scrollmove时的事件*
     * - *onScrollEnd iscroll中scrollend时的事件*
     * @example
     * var refresh = $.ui.refresh({
     *      container: '.scroller',
     *      direction: 'up',
     *      type:'pullup', //pullup or click
     *      onReady:function (callback) {
     *          $.ajax({
     *              type:'GET',
     *              url:'../data/refresh.php',
     *              data:{ name:'Zepto.js' },
     *              dataType:'json',
     *              timeout:300000,
     *              success:function (data) {
     *                  render(data);     //外部数据渲染方法
     *                  callback();
     *                  refresh.setStatus(true);
     *              },
     *          });
     *      }
     * });
     */
    $.ui.create('refresh', {
        _data:{
            container: "",
            instanceId: "",
            pullUpText:"加载更多",
            pullReleaseText:"松开立即加载",
            loadingText:'加载中...',
            clickText:"点击加载更多",
            type: 'click',
            direction: "up",       //加载方向，上拉加载
            isShow: true,
            onReady: null
        },

        _create: function() {
            var me = this;

            me._createButtonUI();    //创建refresh button的UI

            me.trigger('create');
        },

        _init: function() {
            var me = this,
                type = me.data("type"),
                $el = me.widget();

            //目前只支持上拉和点击
            if ($.inArray(me.data('type'), ['click','pullup']) == -1) return;

            me.data({
                range: 150,
                _isOk: true,              //加载是否完成
                refreshing: false,
                list: $el.parent().parent(),
                maxHeight: $el.parent().parent().height() || 200,
                maxTop: parseInt($el.parent().parent().get(0).getBoundingClientRect().top)
            });

            type == "click" ? me._clickAction() : me._pullUpAction();
            
            if (!me.data('isShow')) $el.hide();

            me.trigger('init');
        },

        /**
         * 创建下拉或点击的按钮UI
         * @private
         */
        _createButtonUI: function() {
            var me = this,
                $el = me.widget(),
                pullUpTpl = [],
                direction = me.data("direction"),
                container = $(me.data('container') || document.body)[0];// , //只处理第一个元素

            if ($.inArray(me.data('direction'), ['up','down']) == -1) {    //设置direction的默认值
                direction = "up";
            }
            //设定默认el
            if (!$el) {
                $el = me.widget($('<div></div>')).appendTo(container);
            }
            pullUpTpl.push('<span class="ui-refresh-pullup-icon"></span>');
            pullUpTpl.push('<span class="ui-refresh-pullup-label">' + (me.data('type') == 'pullup' ? me.data('pullUpText') : me.data('clickText')) + '</span>');
            $el.html(pullUpTpl.join(''));

            if (!$el.parent().length) {
                direction == "up" ? $el.appendTo(container): $el.prependTo(container);
            } else if (container !== document.body) {
                direction == "up" ? $el.appendTo(container) : $el.prependTo(container)
            }

            me.data({
                pullUpLabel: $el.find('.ui-refresh-pullup-label'),
                pullUpIcon: $el.find(".ui-refresh-pullup-icon"),
                dir: direction
            });

            me.data("pullUpIcon").hide();    //lite版箭头默认不显示

            $el.addClass(me.data("instanceId") || "ui-refresh");    //处理多实例
        },

        /**
         * 点击操作
         * @private
         */
        _clickAction: function () {
            var me = this,
                $el = me.widget(),
                eventHandler = $.bind(me._eventHandler, me);

            $el.on("click", eventHandler);      //tap改成click，解决穿透问题

        },

        /**
         * 上拉操作
         * @private
         */
        _pullUpAction: function () {
            var me = this,
                $list = me.data("list"),
                eventHandler = $.bind(me._eventHandler, me);

            $list.on("touchstart touchmove touchend", eventHandler);
            me.widget().on("click", eventHandler);      //点击和上拉同时存在，tap改成click，解决穿透问题
        },

        /**
         * 点击方式事件
         * @private
         */
        _tapHandler: function (e) {
            var me = this;
            
            if (!me.data("_isOk")) {
                return;
            }

            var $el = me.widget(),
                $pullUpLabel = me.data("pullUpLabel"),
                $pullUpIcon = me.data("pullUpIcon"),
                type = me.data("type");

            $el.addClass('ui-refresh-loading');
            $pullUpIcon.show();      //icon转化为loading图标
            $pullUpLabel.html(me.data('loadingText'));

            me.data('onReady').call(this, function() {      //数据加载完成后的默认执行函数
                $el.removeClass('ui-refresh-loading');
                $pullUpIcon.hide();
                $pullUpLabel.html(type == "click" ? me.data('clickText') : me.data("pullUpText"));
            });

            me.data("_isOk", false);
        },

        /**
         * touchstart事件
         * @private
         */
        _touchStartHandler: function (e) {
            if (!e.targetTouches[0]) {
                return;
            }

            var me = this,
                $list = me.data("list"),
                direction = me.data("dir"),
                maxTop = me.data("maxTop"),
                range = me.data("range"),
                touchY = e.targetTouches[0].pageY;

            //方向向上或向下且在拉动可加载的范围内
            if ((direction == "up" && touchY > ($list.height() + maxTop - range)) || (direction == "down" && touchY < (maxTop + me.widget().height() + range))) {
                me.data("startY", touchY);
            }
        },

        /**
         * touchmove事件
         * @private
         */
        _touchMoveHandler: function (e) {
            var me = this,
                moveY = e.targetTouches[0].pageY,
                startY = me.data("startY"),
                direction = me.data("dir"),
                thisMoveY = moveY - startY;

            //不需要执行的条件
            if (!e.targetTouches[0] || !me.data("_isOk") || !startY || (direction == "up" && thisMoveY > 0) || (direction == "down" && thisMoveY < 0)) {
                return;
            }

            var $pullUpLabel = me.data("pullUpLabel"),
                range = me.data("range"),
                maxTop = me.data("maxTop");

            if (Math.abs(thisMoveY) < me.data("maxHeight") && !me.data("refreshing")) {    //判断点击区域
                $pullUpLabel.html(me.data('pullReleaseText'));
                me.data("refreshing", true);
            }

            me.data("allMoveY", thisMoveY);
        },

        /**
         * touchend事件
         * @private
         */
        _touchEndHandler: function() {
            var me = this,
                $el = me.widget(),
                $pullUpIcon = me.data("pullUpIcon"),
                $pullUpLabel = me.data("pullUpLabel");

            if (me.data("refreshing")) {
                $el.addClass('ui-refresh-loading');
                $pullUpIcon.show();
                $pullUpLabel.html(me.data('loadingText'));

                me.data('onReady').call(this, function() {      //数据加载完成后的默认执行函数
                    $pullUpIcon.hide();
                    $el.removeClass('ui-refresh-loading');
                    $pullUpLabel.html(me.data('pullUpText'));
                });

                me.data({
                    refreshing: false,
                    _isOk: false
                });
            }
            me.data("startY", 0);     //重置startY的值
        },

        /**
         * @name setStatus
         * @grammar setStatus(status)  ⇒ self
         * @desc 设置是否启用加载功能，true为加载，false为不加载
         * @example
         * var refresh = $.ui.refresh(options);
         * if (data.length > 100) {
         *     refresh.setStatus(true);    //此时refresh不可再加载
         * }
         */
        setStatus: function(status) {
            var me = this;

            me.data("_isOk", !!status ? true : false);

            return me;
        },

        /**
         * @name hide
         * @grammar hide(isOpen)  ⇒ self
         * @desc 隐藏refresh按钮，如传参数isOpen为true，则同时加载功能仍然保留，隐藏的同时关闭加载功能，默认isOpen为false
         * @example
         * var refresh = $.ui.refresh(options);
         * refresh.hide(false);    //隐藏refresh按钮，同时关闭加载功能
         */
        hide: function(isOpen) {
            var me = this,
                $el = me.widget(),
                open = isOpen ? true : false;

            me.setStatus(open);

            if (me.data('isShow')) {
                me.data('isShow', false);
                $el.hide();
            }

            return me;
        },

        /**
         * @name show
         * @grammar show(isOpen)  ⇒ self
         * @desc 显示refresh按钮，如传参数isOpen为true，则同时加载功能仍然保留，隐藏的同时关闭加载功能，默认isOpen为true
         * @example
         * var refresh = $.ui.refresh(options);
         * refresh.show(false);    //显示refresh按钮，同时关闭加载功能
         */
        show: function(isOpen) {
            var me = this,
                $el = me.widget(),
                open = isOpen || isOpen == undefined ? true : false;

            me.setStatus(open);

            //修改代码格式 - by gsl
            if (!me.data('isShow')) {
                me.data('isShow', true);
                $el.show();
            }
        },

        /**
         * @name setLoadEndText
         * @grammar setLoadEndText(text, isOpen)  ⇒ self
         * @desc text设置加载完成后的refresh按钮的内容，isOpen设置是否关闭加载功能
         * @example
         * var refresh = $.ui.refresh(options);
         * refresh.setLoadEndText('没有更多内容', true);    //按钮文案显示为'没有更多内容'，并且不能再加载
         */
        setLoadEndText: function (text, isOpen) {
            var me = this,
                pullUpLabel = me.data("pullUpLabel"),
                pullUpIcon = me.data("pullUpIcon"),
                defText = me.data("type") == "click" ? me.data("clickText") : me.data("pullUpText"),
                cont = !text ? defText : text,
                open = isOpen ? true : false;

            pullUpLabel.html(cont);
            pullUpIcon && pullUpIcon.hide();
            me.setStatus(open);
        },

        /**
         * 事件处理中心
         * @private
         */
        _eventHandler: function(e) {
            var me = this;

            switch (e.type) {
                case 'click':
                    me._tapHandler(e);
                    break;
                case 'touchstart':
                    me._touchStartHandler(e);
                    break;
                case 'touchmove':
                    me._touchMoveHandler(e);
                    e.target.nodeType == 3 && $.os.ios && me._touchEndHandler(e);      //在ios4下，touchmove改变了target的内容，会导致touchend不触发
                    $.os.android && me.data('touchMoveTimer', setTimeout(function () {      //在android下，touchmove没有preventDefault时，touchend不触发
                        me._touchEndHandler();
                    }, 1000));
                    break;
                case 'touchend':
                    me.data('touchEndTimer', setTimeout(function () {me._touchEndHandler(e);}, 0));
                    break;
            }
        },

        /**
         * @name destroy
         * @grammar destroy()  => undefined
         * @desc 销毁组件创建的dom及绑定的事件
         */
        destroy: function () {
            var me = this,
                touchMoveTimer = me.data('touchMoveTimer'),
                touchEndTimer = me.data('touchEndTimer');

            me.widget().off('click');
            me.data('list').off('touchstart touchmove touchend');
            touchMoveTimer && clearTimeout(touchMoveTimer);
            touchEndTimer && clearTimeout(touchEndTimer);

            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         */

    });
})(Zepto);
///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @file
 * @name Toolbar
 * @short Toolbar
 * @desc 工具栏组件 
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */
(function($) {
    /**
     * @desc   工具栏组件构造函数
     * **el**
     * 根元素选择器或者对象
     * **Options**
     * - *** container {selector|zepto}*** (可选)渲染到哪个元素 || document.body
     * - *** instanceId {String}***  (可选)实例标示
     * - *** titleText {String}*** (可选)标题文字
     * - *** backButtonText {String}*** (可选)返回按钮文字
     * - *** onBackButtonClick {Function}*** (可选)返回按钮的点击事件
     * - *** isPreventDefault {Boolean}*** (可选)是否取消move事件的默认行为
     * @name     $.ui.vs_toolbar
     * @grammar  $.ui.vstoolbar([el [,options]])  ⇒ instance
     * @example
     * var toolbarIns = $.ui.vs_toolbar($('#page_toolbar'), {
            instanceId:'blue',//针对不同的实例，可以写不同的css
            titleText:'焦点新闻',
            backButtonText:'返回', //实时,String,按钮文字
        });
     * 
     * @mode setup模式
     * @param {selector|zepto} el   根元素选择器或者对象
     * @param {Object} options 参数
     * @param {selector|zepto} options.container (必选)渲染到哪个元素 || document.body
     * @param {String} options.instanceId  (必选)实例标示
     * @param {String} options.titleText (可选)标题文字
     * @param {String} options.backButtonText (可选)返回按钮文字
     * @param {Function} options.onSearchButtonClick (可选)搜索按钮的点击事件
     * @param {Function} options.onBackButtonClick (可选)返回按钮的点击事件
     * @param {Function} options.onHomeButtonClick (可选)主页按钮的点击事件
     * @param {Function} options.onProductButtonClick (可选)产品切换按钮的点击事件
     * @param {Function} options.onTitleClick (可选)标题的点击事件
     * @param {Function} options.onTextButtonClick (可选)文本按钮的点击事件
     * @param {Function} options.onSendButtonClick (可选)发送按钮的点击事件
     * @param {Function} options.onGoBaiduButtonClick (可选)返回百度按钮的点击事件
     * @param {Boolean} options.isPreventDefault (可选)是否取消move事件的默认行为
     */
    $.ui.create('vs_toolbar', {

        _data: {
            titleText: '',
            // backButtonText: '返回',
            // //无图模式
            // onImageButtonClick:function() {
            //     console.log('image button click');
            // },
            // onProductButtonClick:function() {
            //     console.log('product button click');
            // },
            // onSearchButtonClick:function() {
            //     console.log('search button click');
            // },
            // onHomeButtonClick:function() {
            //     console.log('home button click');
            // },
            // onBackButtonClick:function() {
            //     console.log('back button click');
            //     history.back();
            // },
            // onTextButtonClick:function() {
            //     console.log('text button click');
            // },
            // onSendButtonClick:function() {
            //     console.log('send button click');
            // },
            // onGoBaiduButtonClick:function() {
            //     console.log('gobaidu button click');
            // },
            // onTitleClick:function() {
            //     console.log('title button click');
            // },
            // onSwipeUp:function() {
            //     console.log('title swipeUp');
            // },
            // onSwipeDown:function() {
            //     console.log('title swipeDown');
            // },
            // onMoreButtonClick:function() {
            //     console.log('more button click');
            // },
            // onTextSmallerButtonClick:function() {
            //     console.log('text smaller button click');
            // },
            // onTextBiggerButtonClick:function() {
            //     console.log('text bigger button click');
            // },
            isShow:true,
            // isNewPageProduct: true,
            // isTitleClickable: false,
            // onverticalswipeup:function(e) {},
            // onverticalswipedown:function(e){},
            // isPreventDefault:true
        },

        _create: function() {
            var me = this,
                $elem = me.widget(),
                buttons = $elem.find(".ui-toolbar-btn");;

            // if (me.data('instanceId')) {
            //     $elem.addClass(me.data('instanceId'));
            // }
            
            // me.data('titleContainer', $('.ui-toolbar-title', $elem));
            me.data("buttons", buttons);

            me.trigger('create');
        },

        _init: function() {
            var me = this,
                btns = me.data("buttons");

            // _onTitleClick = function(e){
            //     var btn = me.data('titleContainer');

            //     if(me.data('isTitleClickable')){
            //         if($('.ui-toolbar-title-up-arrow', me.widget()).length > 0){
            //             btn.removeClass('ui-toolbar-title-up-arrow')
            //                 .addClass('ui-toolbar-title-down-arrow');
            //         }
            //         else{
            //             btn.removeClass('ui-toolbar-title-down-arrow')
            //                 .addClass('ui-toolbar-title-up-arrow');
            //         }
            //     }

            //     $.later(function(){
            //         me.data('onTitleClick')(e);
            //     }, 200);
            // };

            // $elem.swipeUp(_onSwipeUp);
            // console.log(me.data('onSwipeUp'))
            // $elem.swipeDown(_onSwipeDown);

            for(var i = 0, iLen = btns.length; i < iLen; i++) {
                (function(){
                    var btn = $(btns[i]);
                    btn.on('touchend', function(e){
                        btn.toggleClass('press');
                        $.later(function(){
                            btn.toggleClass('press');
                        }, 300);
                    });
                })();
            }
            
            // me.data('productButton')
            //     .on('touchend', function(){
            //         var btn = me.data('productButton'),
            //             arrowBtn = me.data('productButtonUpDownArrow');

            //         btn.toggleClass('ui-toolbar-productbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-productbtn-press');
            //         }, 300);

            //         if(!me.data('isNewPageProduct')){
            //             if($('.ui-toolbar-backcon .ui-toolbar-up-arrow', me.widget()).length > 0){
            //                 arrowBtn.removeClass('ui-toolbar-up-arrow')
            //                     .addClass('ui-toolbar-down-arrow');
            //             }
            //             else{
            //                 arrowBtn.removeClass('ui-toolbar-down-arrow')
            //                     .addClass('ui-toolbar-up-arrow');
            //             }
            //         }
            //     })
            //     .on('click', _onProductButtonClick);

            // me.data('searchButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('searchButton');
            //         btn.toggleClass('ui-toolbar-searchbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-searchbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onSearchButtonClick);

            // me.data('homeButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('homeButton');
            //         btn.toggleClass('ui-toolbar-homebtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-homebtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onHomeButtonClick);

            // me.data('backButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('backButton');
            //         btn.toggleClass('ui-toolbar-backbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-backbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onBackButtonClick);

            // me.data('textButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('textButton');
            //         btn.toggleClass('ui-toolbar-textbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-textbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onTextButtonClick);

            // me.data('sendButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('sendButton');
            //         btn.toggleClass('ui-toolbar-sendbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-sendbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onSendButtonClick);

            // me.data('goBaiduButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('goBaiduButton');
            //         btn.toggleClass('ui-toolbar-gobaidubtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-gobaidubtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onGoBaiduButtonClick);
            
            // me.data('textSmallerButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('textSmallerButton');
            //         btn.toggleClass('ui-toolbar-textsmallerbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-textsmallerbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onTextSmallerButtonClick);
            // me.data('textBiggerButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('textBiggerButton');
            //         btn.toggleClass('ui-toolbar-textbiggerbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-textbiggerbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onTextBiggerButtonClick);
            // me.data('moreButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('moreButton');
            //         btn.toggleClass('ui-toolbar-morebtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-morebtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onMoreButtonClick);
            // me.data('titleContainer')
            //     .on('click', _onTitleClick);

            me.trigger('init');
        },

        /**
         * @desc 打开工具栏面板
         * @name     show
         * @grammar  show()  ⇒ self
         */
        show: function() {
            var me = this,
                $elem = me.widget();

            if (!me.data('isShow')) {
                me.trigger('beforeshow');
                me.data('isShow', true);
                $elem.show();
                me.trigger('aftershow');
            }
            return me;
        },

        /**
         * @desc 关闭工具栏面板
         * @name     hide
         * @grammar  hide()  ⇒ self
         */
        hide: function() {
            var me = this,
                $elem = me.widget();

            if (me.data('isShow')) {
                me.data('isShow', false);
                me.trigger('beforehide');
                $elem.hide();
                me.trigger('afterhide');
            }
            return me;
        },

        /**
         * @desc 打开/关闭工具栏面板。
         * - 如果工具栏是打开的，执行toggle方法后会关闭工具栏
         * - 如果工具栏是关闭的，执行toggle方法后会打开工具栏
         * @name     toggle
         * @grammar  toggle()  ⇒ self
         * @example
         * toolbarIns.toggle();
         */
        toggle:function(){
            var me = this,
                $elem = me.widget();
            if (me.data('isShow')) {
                me.hide();
            }else{
                me.show();
            }
            return me;
        },

        /**
         * @desc 获取/设置返回按钮的文字。
         * - 如果不设置参数，返回返回按钮的文字
         * - 如果设置参数，设置返回按钮的文字为参数
         * @name backButtonText
         * @grammar  backButtonText()  ⇒ string
         * @grammar  backButtonText(value)  ⇒ self
         * @example
         * toolbarIns.backButtonText();
         * toolbarIns.backButtonText("value");
         */
        // backButtonText: function() {
        //     var me = this,
        //             $elem = me.widget();
        //     if (arguments[0] != undefined) {
        //         me.data('backButtonText', arguments[0]);
        //         $('.ui-toolbar-backbtn .ui-toolbar-content', $elem).text(arguments[0]);
        //         return me;
        //     } else {
        //         return me.data('backButtonText');
        //     }
        // },

        /**
         * @desc 获取/设置标题的文字
         * - 如果不设置参数，返回返回标题的文字
         * - 如果设置参数，设置返回标题的文字为参数
         * @name titleText
         * @grammar  titleText()  ⇒ string
         * @grammar  titleText(value)  ⇒ self
         * @example
         * toolbarIns.titleText();
         * toolbarIns.titleText("value");
         */
        // titleText: function() {
        //     var me = this,
        //             $elem = me.widget();
        //     if (arguments[0] != undefined) {
        //         me.data('titleText', arguments[0]);
        //         $('.ui-toolbar-title', $elem).text(arguments[0]);
        //         return me;
        //     } else {
        //         return me.data('titleText');
        //     }
        // },

        // closeTitle: function() {
        //     var me = this, btn = me.data('titleContainer');

        //     btn.removeClass('ui-toolbar-title-up-arrow')
        //         .addClass('ui-toolbar-title-down-arrow');
        // },

        // openTitle: function() {
        //     var me = this, btn = me.data('titleContainer');

        //     btn.removeClass('ui-toolbar-title-down-arrow')
        //         .addClass('ui-toolbar-title-up-arrow');
        // },

        // openProduct: function() {
        //     var me = this, btn = me.data('productButtonUpDownArrow');

        //     btn.removeClass('ui-toolbar-down-arrow')
        //         .addClass('ui-toolbar-up-arrow');
        // },

        // closeProduct: function() {
        //     var me = this, btn = me.data('productButtonUpDownArrow');

        //     btn.removeClass('ui-toolbar-up-arrow')
        //         .addClass('ui-toolbar-down-arrow');
        // },
        
        /**
         * @desc 销毁组件。会移除toolbar和其components上的所有事件监听。
         * @name destroy
         * @grammar  destroy()  ⇒ undefined
         * @example
         * toolbarIns.destroy();
         */
        destroy: function () {
            var me = this;

            me.widget().off();

            me._super();
        }

    }).attach('control.fix');
})(Zepto);

///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @file
 * @name Quickdelete
 * @desc 快速删除组件
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */
(function($) {
    /**
     * @desc   快速删除组件
     *
     * **Options**
     * - ***container {Selector}*** (必选)父元素
     * - ***ondelete {Function}*** (可选)点击close按钮时触发
     * - ***box {Number}*** (可选)close按钮的大小: 20
     * - ***offset {Object}*** (可选)close按钮偏移量{x:0, y:0}
     * 
     * @name     $.ui.quickdelete
     * @grammar  $.ui.quickdelete([options])
     * @param    {Object}         options                   参数
     * @param    {Selector}       options.container         (必选)父容器
     * @param    {Function}       options.ondelete          (可选)点击close按钮时触发
     * @param    {Number}         options.box              (可选)close按钮的大小: 20
     * @param    {Object}         options.offset            (可选)close按钮偏移量{x:0, y:0}
     */
    $.ui.create('quickdelete', {
        _data: {
            box: 20,
            offset: {x: 0, y: 0}
        },

        _create: function() {
            var me = this,
                $input = me.data('input', $(me.data('container'))),
                expando = +new Date(),
                maskID = 'ui-input-mask-' + expando,
                elemID = "ui-quickdelete-delete-" + expando,
                $maskElem = $input.parent(),
                $deleteElem = $('<div id="' + elemID + '" class="ui-quickdelete-button"></div>').css({
                    height: me.data('box'),
                    width: me.data('box')
                });

            //在android2.1下-webkit-background-size不支持contain属性，
            $.os.android && $.os.android && parseFloat($.os.version).toFixed(1) == 2.1 && $deleteElem.css('-webkit-background-size', '20px 20px');
            if ($maskElem.attr('class') != 'ui-input-mask') {
                $maskElem = $('<div id="' + maskID + '" class="ui-input-mask"></div>').appendTo($input.parent());
            }

            me.widget($maskElem.append($input).append(me.data('deleteElem', $deleteElem)).css('height', $input.height()));
            me._initButtonOffset().trigger('create');
        },

        _init: function() {
            var me = this,
                $input = me.data('input'),
                eventHandler = $.bind(me._eventHandler, me);

            $input.on('focus input blur', eventHandler);
            me.data('deleteElem').on('touchstart', eventHandler);
            me.on('destroy', function(){
                $input.off('focus input blur', eventHandler);
                me.data('deleteElem').off('touchstart', eventHandler);
                eventHandler = $.fn.emptyFn;
            });
            me.trigger('init');
        },

        _show: function() {
            this.data('deleteElem').css('visibility', 'visible');
            return this;
        },

        _hide: function() {
            this.data('deleteElem').css('visibility', 'hidden');
            return this;
        },

        _eventHandler: function(e){
            var me = this,
                type = e.type,
                target = e.target,
                $input = me.data('input');

            switch (type) {
                case 'focus':
                case 'input':
                    $.trim($input.val()) ? me._show() : me._hide();
                    break;
                case 'mousedown':
                case 'touchstart':
                    if (target == me.data('deleteElem').get(0)) {
                        e.preventDefault();
                        e.formDelete = true; // suggestion解决删除问题
                        $input.val('');
                        me._hide().trigger('delete'); 
                        $input.get(0).focus();                                                                   
                    }
                    break;
                case 'blur':
                    me._hide();
                    break;
            }

        },

        _initButtonOffset: function() {
            var me = this,
                $input = me.data('input'),
                size = me.data('box'),
                targetOffset = me.widget().offset(),
                customOffset = me.data('offset'),
                offsetX = customOffset.x || 0,
                offsetY = customOffset.y || 0,
                paddingOffsetY = Math.round((targetOffset.height - 2*offsetY - size) / 2);   //padding值根据外层容器的宽度-Y的偏移量-小叉的大小

            me.data('deleteElem').css({
                /** @by vs
                padding: paddingOffsetY < 0 ? 0 : paddingOffsetY,          //modified by zmm, 使quickdelete图标可点区域更大
                top: offsetY,
                right: offsetX
                */
                top: 14,
                right: 85
            });

            // 处理输入长字符串，input挡住删除按钮问题
            $input.css({
                position: 'absolute',
                /** @by vs
                top: 0,
                left: 0,
                width: 'auto',
                right: size + 20
                 */
                top: 4,
                left: 10,
                width: 'auto',
                right: 120
            });
            return me;
        }
    });

    $(document).on('pageInit', function() {
        // role: data-widget = quickdelete.
        $('[data-widget=quickdelete]').each(function(i, elem) {
            var $elem = $(elem),
                size = $elem.data("quickdelete-size"),
                offsetX = $elem.data('quickdelete-offsetx'),
                offsetY = $elem.data('quickdelete-offsety');

            var quickdelete = $.ui.quickdelete({
                container: elem,
                size: parseInt(size, 10) || undefined,
                offset: {
                    x: parseInt(offsetX, 10) || undefined,
                    y: parseInt(offsetY, 10) || undefined
                }
            });
        });
    });

    /**
     * @name Trigger Events
     * @theme event
     * @desc 组件内部触发的事件
     * - ***delete*** : (event)点击删除按钮触发
     */

})(Zepto);

///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;
///import third-party.iscroll.iscroll;

/**
 * @file
 * @name Suggestion
 * @desc 搜索建议组件
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */

(function($, undefined){
    /**
     * @desc
     * **el**
     * css选择器，或者zepto对象
     * **Options**
     * - ***container*** {Selector} **(必选)**: 父元素
     * - ***source*** {String} (必选): 请求数据的url
     * - ***param {String}*** **(可选)**: 附加参数
     * - ***posAdapt {Boolean}*** **(可选)**: 是否自动调整位置
     * - ***listCount {Number}*** **(可选)**: 展现sug的条数: 5
     * - ***isCache {Boolean}*** **(可选)**: 是否缓存query: true
     * - ***isStorage {Boolean}*** **(可选)**: 是否本地存储pick项: true
     * - ***isSharing {Boolean}*** **(可选)**: 是否共享历史记录: true
     * - ***shareName {String}*** **(可选)**: 共享缓存key
     * - ***autoClose {Boolean}*** **(可选)**: 点击input之外自动关闭
     * - ***height {Function}*** **(可选)**: 设置高度
     * - ***width {Function}*** **(可选)**: 设置宽度
     * - ***minChars {Function}*** **(可选)**: 最小输入字符: 0
     * - ***maxChars {Function}*** **(可选)**: 最大输入字符: 1000
     * - ***offset {Function}*** **(可选)**: 偏移量{x:0, y:0}
     * - ***renderList {Function}*** **(可选)**: 自定义渲染下拉列表
     * - ***renderEvent {Function}*** **(可选)**: 绑定用户事件
     * - ***sendRequest {Function}*** **(可选)**: 用户自定义请求方式
     * - ***onselect {Function}*** **(可选)**: 选中一条sug触发
     * - ***onsubmit {Function}*** **(可选)**: 提交时触发
     * 
     * @name        $.ui.suggestion
     * @grammar     $.ui.suggestion([el [,options]]) => instance
     * @param       {Object}     		options             		参数
     * @param       {Selector}     		options.container           (必选)父容器
     * @param       {String}     		options.source       		(必选)请求数据的url
     * @param       {String}     		options.param       		(可选)附加参数
     * @param       {Boolean}     		options.posAdapt       		(可选)是否自动调整位置
     * @param       {Number}     		options.listCount    		(可选)展现sug的条数: 5
     * @param       {Boolean}    		options.isCache      		(可选)是否缓存每一个输入的query: true
     * @param       {Boolean}   		options.isStorage    		(可选)是否本地存储pick的条目: true
     * @param       {Boolean}   		options.isSharing    		(可选)是否共享历史记录: false
     * @param       {String}   	        options.shareName    		(可选)共享的缓存key
     * @param       {Boolean}   	    options.autoClose    		(可选)点击input之外自动关闭sug
     * @param       {Number}   			options.height        		(可选)设置Suggestion框的高度
     * @param       {Number}   			options.width        		(可选)设置Suggestion框的宽度
     * @param       {Number}     		options.minChars     		(可选)最少输入字符数: 0
     * @param       {Number}     		options.maxChars     		(可选)最多输入字符数: 1000
     * @param       {Object}     		options.offset       		(可选)偏移量{x:0, y:0}
     * @param       {Function}          options.renderList          (可选)自定义渲染下拉列表
     * @param       {Function}          options.renderEvent         (可选)绑定用户事件
     * @param       {Function}          options.sendRequest         (可选)用户自定义发送请求方式
     * @param       {Function}          options.onselect            (可选)选中一条sug的时候触发
     * @param       {Function}          options.onsubmit            (可选)提交的时候触发
     */
	$.ui.create('suggestion', {
		_data: {
			listCount: 50,
			isCache: true,
			isStorage: true,
			minChars: 0,
			maxChars: 1000,
			offset: {x: 0, y: 0, w: 0},
            confirmClearHistory: true
		},

		_create: function() {
			var me = this,
				expando = +new Date(),
				maskID = 'ui-input-mask-' + expando,
				sugID = me.data('id', "ui-suggestion-" + $.guid()),
				$input = me.data('input', $(me.data('container'))).attr("autocomplete", "off"),
				$maskElem = $input.parent();

			me.data('inputWidth', $input.get(0).offsetWidth);
			me.data('cacheData', {});
			if ($maskElem.attr('class') != 'ui-input-mask') {
				$maskElem = $('<div id="' + maskID + '" class="ui-input-mask"></div>').appendTo($input.parent()).append($input);
			}
			me.data('maskElem', $maskElem);
			me.widget($('<div id="' + sugID + '" class="ui-suggestion"><div class="ui-suggestion-content"><div class="ui-suggestion-scroller"></div></div><div class="ui-suggestion-button"></div></div>').appendTo($maskElem));
			me._initSuggestionOffset().trigger('create');
		},

		_init: function() {
			var me = this,
				$input = me.data('input'),
				eventHandler = $.bind(me._eventHandler, me);

			me.widget().on('touchstart', eventHandler);
			$input.on('focus input', eventHandler).parent().on('touchstart', eventHandler);
			$(window).on('ortchange', eventHandler);
			me.data('autoClose') && $(document).on('tap', eventHandler);
            me.on('destroy', function() {
            	$(document).off('tap', eventHandler);
            	$(window).off('ortchange', eventHandler);
            });
			me.trigger('init');
		},

		/** 
		 * 初始化属性
		 * @private
		 */
		_initSuggestionOffset: function() {
			var me = this, width, additionWidth,
			    $elem = me.widget(),
				$input = me.data('input'),
				customOffset = me.data('offset'),
				border = 2 * parseInt($elem.css('border-left-width') || 0);
				
			me.data('pos', $input.height() + (customOffset.y || 0));
			me.data('realWidth', (me.data('width') || $input.width()) - border);
			$elem.css({
				position: 'absolute',
				left: customOffset.x || 0
			});
			return me;
		},

		/** 
		 * 设置size
		 * @private
		 */
		_setSize: function() {
			var me = this,
				width = me.data('realWidth'),
				additionWidth = me.data('input').parent().width() - me.data('inputWidth');
            // @by vs
			// me.widget().css('width', width + additionWidth);
			return me;
		},

		/**
		 * 适配位置
		 * @private
		 */
		_posAdapt: function(dps) {
			var me = this;
			dps ? me._setPos().data('timeId', $.later(function() {
				me._setPos();
			}, 200, true)) : clearInterval(me.data('timeId'));
			return me;
		},

		/**
		 * 设置位置
		 * @private
		 */
		_setPos: function() {
			var me = this,
				$elem = me.widget(),
				$input = me.data('input'),
				height = parseFloat($elem.height()),
				customOffset = me.data('offset'),
				pos =  parseFloat(me.data('pos')),
				uVal = $input.offset(true).top,
				dVal = $(window).height() - $input.offset(true).bottom;

            if (me.data('posAdapt') && uVal > dVal) {      //上面的距离大就在上面显示，下面的距离大就在下面显示
                $elem.css('top', -height - (customOffset.y || 0) + 'px');
            } else {
                $elem.css('top', pos);
            }
			return me;
		},
	
		/** 
		 * input输入处理
		 * @private
		 */
		_change: function(query) {
			var me = this,
				data = me._cacheData(query),
				isCache = me.data('isCache'),
				source = me.data('source');
			return data && isCache ? me._render(query, data) : me._sendRequest(query);
		},

		/** 
		 * 事件管理器
		 * @private
		 */
		_eventHandler: function(e) {
			var me = this,
				type = e.type,
				target = e.target,
				maskElem = me.data('maskElem').get(0);

			switch (type) {
				case 'focus':
					me._setSize()._showList()._setPos().trigger('open');
					break;
				case 'touchstart':
				case 'mousedown':
					if (!e.formDelete) break;
					e.preventDefault();
				case 'input':
					me._showList();
					break;
				case 'ortchange':
					me._setSize()._setPos();
					break;
				case 'click':
				case 'tap':
					if (!(maskElem.compareDocumentPosition(target) & 16)) me.hide();
					break;
			}
		},

		/** 
		 * 显示下拉浮层
		 * @private
		 */
		_showList: function() {
			var me = this,
				query = me.getValue(),
				data = me._localStorage();

			if (query.length < parseFloat(me.data('minChars')) || query.length > parseFloat(me.data('maxChars'))) {
				return me.hide();
			}
			return query ? me._change(query) : data ? me._render(null, {s: data.split(",")}) : me.hide();
		},
		
        /** 
         * 绑定下拉浮层中的事件
         * @private
         */
		_bindSuggestionListEvent: function() {
            var me = this;
            me.widget().find(".ui-suggestion-result").on('click', function() {
            	me._select(this)._submit();
            }).highlight('ui-suggestion-result-highlight');
            return me;
		},

        /** 
         * 绑定关闭按钮事件
         * @private
         */
		_bindCloseEvent: function() {
			var me = this;
			$('.ui-suggestion-button span:first-child').on('click', function() {
                $.later(function(){
                    me.clearHistory();
                }, $.os.android?200:0);
			});
			$('.ui-suggestion-button span:last-child').on('click', function() {
				me.hide().leaveInput().trigger('close');
			});
			return me;
		},	

		/** 
		 * 发送异步请求
		 * @private
		 */
		_sendRequest: function(query) {
			var me = this,
				url = me.data('source'),
				param = me.data('param'),
				cb = "suggestion_" + (+new Date()),
				sendRequest = me.data('sendRequest');

			if ($.isFunction(sendRequest)) {
				sendRequest(query, function(data) {
					me._render(query, data)._cacheData(query, data);
				});

			} else if (query) {
				url += (url.indexOf("?") === -1 ? "?" : "") + "&wd=" + encodeURIComponent(query);
				url.indexOf("&cb=") === -1 && (url += "&cb=" + cb);
				param && (url += '&' + param);

				window[cb] = function(data) {
					me._render(query, data)._cacheData(query, data);
					$('[src="' + url + '"]').remove();
					delete window[cb];
				};

				$.ajaxJSONP({
					url: url,
					dataType: "json"
				});
			}
			return me;
		},

        /**
         * @desc 获取input值
         * @name getValue
         * @grammar getValue() => string
         * @return {String} value
         * @example $.ui.suggestion().getValue();
         */
        getValue: function() {
            return $.trim(this.data('input').val());
        },

		/** 
		 * 渲染下拉浮层
		 * @private
		 */
        _render: function(query, data) {
            var me = this, html,
            	$elem = me.widget(),
            	$content = $elem.find('.ui-suggestion-content'),
            	$button = $elem.find('.ui-suggestion-button'),
            	renderList = me.data('renderList'),
            	renderEvent = me.data('renderEvent'),
                clearBox = '<span style="display:none;"></span><span>关闭</span>';

            query === null && (clearBox = '<span>清除历史记录</span><span>关闭</span>');     
	    	html = renderList ? renderList.apply(me, [query, data]) : me._renderList(query, data);

	    	if(html){
	    		$content.find('*').off(); // unbind all events in sug list
		        $content.find('.ui-suggestion-scroller').html(html); 
		        $button.find('*').off();
	            $button.html(clearBox);
	    		renderEvent ? renderEvent.apply(me) : me._bindSuggestionListEvent();
                /** @by vs
	            data.s.length >= 2 ? $content.css('height', me.data('height') || 66) : $content.css('height', 33);		
                 */
+	            data.s.length >= 2 ? $content.css('height', me.data('height') || 80) : $content.css('height', 40);		
	   			me._bindCloseEvent()._show();
   				var iscroll = (me.data('iScroll') || me.data('iScroll', new iScroll($content.get(0), {
   					topOffset: 0,
   					hScroll: false
   				})));
   				iscroll.scrollTo(0, 0);
   				iscroll.refresh();
			} else me.hide();
			
            return me;
        }, 

		/** 
		 * 创建Suggestion list HTML内容
		 * @private
		 */
		_buildHTML: function(list) {
			var me = this,
				html = list.join('</div></li><li><div class="ui-suggestion-result">');
			return '<ul><li><div class="ui-suggestion-result">' + html + '</div></li></ul>';
		},       

		/** 
		 * 渲染list HTML片段
		 * @private
		 */
        _renderList: function(query, data) {
            var me = this,
            	$elem = me.widget(),
                listCount = me.data('listCount'),
                items = [], html = "",
                sugs = data.s;

            if (!data || !sugs || !sugs.length) {
            	me.hide();
            	return;
            }

            sugs = sugs.slice(0, listCount);
            $.each(sugs, function(index, item) {
                $.trim(item) && items.push(query != '' ? item.replace(query, "<span>" + query + "</span>") : item);
            });

            return me._buildHTML(items);
        },  
		
		/** 
		 * 提交搜索提示
		 * @private
		 */
		_submit: function() {
			var me = this,
				keyValue = me.data('input').val();

			me.trigger("submit");
			if(!me.data('onsubmit') && !(me._callbacks && me._callbacks.submit))
				window.location = 'http://www.baidu.com/s?wd=' + encodeURIComponent(keyValue);
			return me;
		},
			

        /** 
         * 选择搜索提示
         * @private
         */
		_select: function(target) {
			var me = this,
				targetContent = target.textContent;

			me.data('input').val(targetContent);
			me.data('isStorage') && me._localStorage(targetContent);
			return me.trigger("select", target).hide();
		},		

        /** 
         * 缓存搜索提示
         * @private
         */
		_cacheData: function(key, value) {
			var me = this;
			return value !== undefined ? me.data('cacheData')[key] = value : me.data('cacheData')[key];
		},	

        /** 
         * 操作历史记录
         * @private
         */
		_localStorage: function(value) {
            var me = this,
                shareName = me.data('shareName'),
                id = me.data('isSharing') ? shareName ? shareName + '-SUG-Sharing-History' : 'SUG-Sharing-History' : me.data('id');

            if (value === null) window.localStorage[id] = "";
            else if (value !== undefined) {
                var localdata = window.localStorage[id],
                    data = localdata ? localdata.split(",") : [];

                if ($.inArray(value, data) != -1) return;
                data.unshift(value);
                window.localStorage[id] = data.join(",");
            }

            return window.localStorage[id];
		},

		/** 
		 * 显示suggestion
		 * @private
		 */
		_show: function() {
			var me = this;
            //如果在hide调用完的200ms以内再次调用show，需要清除timer了，否则一显示就会隐藏掉
            if(me.data('hideTimer')) {
                clearTimeout(me.data('hideTimer'));
                me.data('hideTimer', null);
            }
			me.widget().css("display", "block");
			me.data('posAdapt') && me._posAdapt(1);
			return me.trigger('show');
		},	

        /**
         * @desc 隐藏suggestion
         * @name hide
         * @grammar hide() => self
         * @return {Object} this
         */
		hide: function() {
			var me = this;
			me.data('hideTimer', $.later(function() {
				me.widget().css("display", "none");
                me.data('hideTimer', null);
			}, 200));
			return me._posAdapt(0).trigger('hide');
		},

        /**
         * @desc 清除历史记录
         * @name clearHistory
         * @grammar clearHistory() => undefined
         * @return {undefined}
         */
		clearHistory: function() {
			var me = this, _clear = function(){
                me._localStorage(null);
                me.hide();
            };
            if(me.data('confirmClearHistory')) {
                window.confirm('清除全部查询历史记录？') && _clear();
            } else {
                _clear();
            }
		},

        /**
         * @desc 设置|获取历史记录
         * @name history
         * @grammar history() => string
         * @param {String} query 搜索条件
         * @return {String} 历史记录字符串
         */
        history: function(query) {
            return this._localStorage(query);
        },

        /**
         * @desc input获得焦点
         * @name focusInput
         * @grammar focusInput() => self
         * @return {Object} this
         */
        focusInput: function() {
    		this.data('input').get(0).focus();
        	return this;
        },

        /**
         * @desc input失去焦点
         * @name leaveInput
         * @grammar leaveInput() => self
         * @return {Object} this
         */
        leaveInput: function() {
        	this.data('input').get(0).blur();
        	return this;
        },

        /**
         * @desc 销毁组件
         * @name destroy
         * @grammar destroy   => undefined
         */
        destroy: function() {
            var me = this,
                $maskElem = me.data('maskElem');
            clearTimeout(me.data('timeId'));
            clearTimeout(me.data('resId'));
            clearTimeout(me.data('hideTimer'));
            $maskElem.find('*').off();
            me.data('iScroll') && me.data('iScroll').destroy();
            me._super();
            $maskElem.off().remove();
        }
	});

 	$(document).on('pageInit', function() {
 		// role: data-widget = suggestion.
 		$('[data-widget=suggestion]').each(function(i, elem) {
 			var $elem = $(elem),
 				source = $elem.attr('data-source'),
 				count = $elem.attr('data-listCount');

 			$.ui.suggestion({
 				container: elem,
 				source: source,
 				listCount: count
 			});
 		});
 	});

    /**
     * @name Trigger Events
     * @theme event
     * @desc 组件内部触发的事件
     * - ***select*** : (event)选中搜索项时触发
     * - ***submit***: (event)提交时触发
     * - ***open***: (event)展现下拉列表时触发
     * - ***close***: (event)关闭下拉列表时触发
     */	

})(Zepto);

;
///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;
///import third-party.iscroll.iscroll;

/**
 * @file
 * @name Navigator
 * @desc 导航栏组件，也可配置为tab组件，支持render和setup两种方式
 * @import mobile/mobile.js, mobile/widget.js, mobile/ex.js, mobile/control.js, mobile/iscroll.js
 * */
(function ($, undefined) {
    /**
     * @name $.ui.navigator
     * @grammar $.ui.navigator([el [,options]])  ⇒ instance
     * @desc **el**
     * css选择器，或者zepto对象
     *
     * @desc **Options**
     * - ***container***       *{Selector|Zepto}*    (可选)父容器，渲染的元素，默认值：document.body
     * - ***content***         *{Array|Selector}*    (必选)导航tab项的内容，当传入的是css selector时，即为setup方式
     * - ***fixContent***      *{Array|Selector}*    (可选)固定tab项的内容
     * - ***isSwipe***         *{Boolean}*           (可选)是否滑动，默认值：true
     * - ***defTab***          *{Number}*            (可选)默认选中的导航tab项的索引，若为默认选中固定tab，则索引值在原来tabs.length上加1，默认值：0
     * - ***instanceId***      *{Selector}*          (可选)多实例的类名选择器
     * - ***onverticalswipe*** *{Function}*          (可选)父容器，竖滑时事件
     * - ***ontabselect***     *{Function}*          (可选)tab选中时的事件
     *
     * <code type="html"><!--setup方式，即html写在页面上，content传入的是css selector时即采取此种方式，但html结构需符合要求-->
     *   <div id="box1"class="ui-navigator">
     *       <div class="ui-navigator-fix"><a href="javascript:;">fix1</a></div>
     *       <div class="ui-navigator-wrap" style="overflow: hidden">
     *           <ul class="ui-navigator-list clearfix">
     *               <li><a href="#test1">首页</a></li>
     *               <li><a href="#test2">电影</a></li>
     *               <li class="cur"><a href="#test3">电视剧</a></li>
     *               <li><a href="javascript:;">动漫</a></li>
     *               <li><a href="javascript:;">综艺</a></li>
     *               <li><a href="javascript:;">美女</a></li>
     *               <li><a href="javascript:;">搞笑剧</a></li>
     *               <li><a href="javascript:;">个人中心</a></li>
     *           </ul>
     *       </div>
     *   </div>
     * </code>
     * @example
     * $.ui.navigator("#box1", {
     *      content:".ui-navigator-wrap",
     *      fixContent:".ui-navigator-fix",
     *      defTab:2
     * });
     * //render方式，即html写在页面上，content传入的是css selector时即采取此种方式，但html结构需符合要求
     * $.ui.navigator({
     *      container:"#box4",
     *      content:[
     *          {text:"首页", url:"http://gmu.baidu.com"},
     *          {text:"电影", url:"index#movie"},
     *          {text:"电视剧", url:"index#tv"},
     *          {text:"动漫", url:"index#movie"},
     *          {text:"综艺", url:"index#movie"},
     *          {text:"美女", url:"javascript:;"},
     *          {text:"搞笑剧", url:"javascript:;"},
     *          {text:"个人中心1", url:"http://gmu.baidu.com"},
     *          {text:"个人中心2", url:"http://gmu.baidu.com"},
     *      ],
     *      fixContent:[
     *          {text:"fix1", url:"javascript:;", pos:"right"}
     *       ],
     *      defTab:1,
     *      instanceId:"instance2"
     * });
     * //render方式创建tab，setup类似
     * $.ui.navigator("#box6", {
     *      content:[
     *          {text:"我要提问", url:"javascript:;"},
     *          {text:"我要回答", url:"javascript:;"},
     *          {text:"我要知道", url:"javascript:;"}
     *      ],
     *      isSwipe:false,
     *      defTab:1
     * });
     */
    $.ui.create("navigator", {
        _data:{
            container:"",
            defTab:0,
            isSwipe:true,
            onverticalswipe:function (e) {
            },
            ontabselect:function (e) {
            }
        },

        _create:function () {
            var me = this,
                content = me.data("content"),
                fixContent = me.data("fixContent");

            if ($.isArray(content)) {      //判断采用哪种方式
                me._createNavUI();           //Render模式
                (fixContent && $.isArray(content)) ? me._createFixTab() : me._createRenderFixTab();
            } else {
                me._createRenderNavUI();      //普通模式
                (fixContent && $.isArray(content)) ? me._createFixTab() : me._createRenderFixTab();
            }

            me.trigger("create");
        },

        _init:function () {
            var me = this,
                $el = me.widget(),
                $navList = me.data("navList"),
                $listWrap = me.data("listWrap"),
                $fixElem = me.data("fixElem"),
                defTab = me.data("defTab"),
                tabNum = me.data("tabNum"),
                tabWidthSumArr = [],
                _eventHandler = $.bind(me._eventHandler, me),
                _rotateEV = 'ortchange';

            //为固定tab添加index属性
            if (me.data("fixNum") && $fixElem) {
                $fixElem.each(function (index) {
                    this.index = index + tabNum;
                });
            }

            //为每个固定tab添加index属性并计算所有tab总长度
            $navList.each(function (index) {
                this.index = index;
                if (!index) {
                    tabWidthSumArr[index] = parseInt(this.offsetWidth);
                } else {
                    tabWidthSumArr[index] = tabWidthSumArr[index - 1] + parseInt(this.offsetWidth);     //记录tab累加的宽度
                }
            });

            me.data("lastTabIndex", -1);
            me.data("tabWidthSumArr", tabWidthSumArr);
            $listWrap.css("width", tabWidthSumArr[tabNum - 1] + "px");

            //加载iScroll对象
            me._loaded();

            me.data("wrapOffsetWidth", me.data("myScroll").scrollerW - tabWidthSumArr[tabNum - 1]);

            //设置默认选中的tab
            if (me.data("defTab") != undefined) {
                me.data("isDefTab", true);       //modified by zmm 默认选中标识，修改url跳转方式，半个tab跳动距离不对的问题
                me.switchTo(parseInt(defTab));
            }

            //事件绑定
            $fixElem && $fixElem.on('tap', _eventHandler);
            $el.on('touchmove', _eventHandler);
            $(window).on(_rotateEV, _eventHandler);

            me.on('destroy', function () {
                $fixElem && $fixElem.off('click tap', _eventHandler);
                $el.off('touchmove', _eventHandler);
                $(window).off(_rotateEV, _eventHandler);
            });

            me.trigger("init");
        },

        /**
         * 创建导航tab的UI
         * @private
         */
        _createNavUI:function () {
            var me = this,
                $el = me.widget(),
                $container = $(me.data("container") || document.body)[0],
                content = me.data("content"),
                tabNum = content.length,
                instanceId = me.data("instanceId"),
                navArr = [], tabHref = [], $navList, $listWrap, $screenWrap;

            for (var i = 0; i < tabNum; i++) {     //创建nav list的html
                navArr[i] = "<li><a href='javascript:;'>" + content[i]["text"] + "</a></li>";
            }

            $screenWrap = $("<div class='ui-navigator-wrap'></div>");
            $listWrap = $("<ul class='ui-navigator-list clearfix'></ul>");
            $navList = $(navArr.join(""));

            //渲染导航的tab列表
            $screenWrap.append($listWrap.prepend($navList));

            if ($el) {    //存在外围容器，selector或html
                $el.append($screenWrap);
                if (!$el.parent().length) {
                    $el.appendTo($container);
                } else if ($container !== document.body) {
                    $el.appendTo($container);
                }
            } else {
                $el = me.widget($("<div></div>").append($screenWrap)).appendTo($container);
            }

            me.data({
                tabNum:tabNum,
                screenWrap:$screenWrap,
                listWrap:$listWrap,
                navList:$navList
            });

            $.each(content, function (index, item) {
                tabHref.push(item.url);
            });

            me.data("tabHref", tabHref);

            //创建多个实例时样式处理
            $el.addClass(instanceId || "ui-navigator");
        },

        /**
         * Render模式创建导航tab的UI
         * @private
         */
        _createRenderNavUI:function () {
            var me = this,
                $el = me.widget(),
                instanceId = me.data("instanceId"),
                tabHref = [];

            !$el && ($el = me.widget($(me.data("content")).parent()));    //由于需要在页面渲染，故不支持传container和el为自己创建的dom的方式

            me.data({
                screenWrap:$el.find(".ui-navigator-wrap"),
                listWrap:$el.find(".ui-navigator-list"),
                navList:$el.find(".ui-navigator-list li")
            });

            $.each(me.data("navList"), function (index, item) {
                tabHref.push($(item).find("a")[0].href);
            });

            me.data({
                tabNum:me.data("navList").length,
                tabHref:tabHref
            });

            //创建多个实例时样式处理
            $el.addClass(instanceId || "ui-navigator");
        },

        /**
         * 创建导航栏中固定的tab项
         * @private
         */
        _createFixTab:function () {
            var me = this,
                $el = me.widget(),
                fixContent = me.data("fixContent"),
                fixTabHref = [];

            for (var j = 0; j < fixContent.length; j++) {
                var fixChild = $("<div class='ui-navigator-fix'><a href='" + fixContent[j]["url"] + "'>" + fixContent[j]["text"] + "</a></div>");
                if (fixContent[j]["pos"] == "right") {
                    $el.append(fixChild);
                } else {
                    $el.prepend(fixChild);
                }
            }

            $.each(fixContent, function (index, item) {
                fixTabHref.push(item.url);
            });

            me.data({
                fixTabHref:fixTabHref,
                fixNum:fixContent.length,
                fixElem:$el.find(".ui-navigator-fix")
            });
        },

        /**
         * Render模式创建固定导航tab的UI
         * @private
         */
        _createRenderFixTab:function () {
            var me = this,
                $el = me.widget(),
                fixContent = $el.find(me.data("fixContent")),
                fixTabHref = [];

            $.each(fixContent, function (index, item) {
                fixTabHref.push($(item).find("a")[0].href);
            });

            me.data({
                fixNum:fixContent.length,
                fixElem:fixContent,
                fixTabHref:fixTabHref
            });
        },

        /**
         * @name switchTo
         * @grammar switchTo(index)  ⇒ self
         * @desc index是切换到的tab的索引，索引值从0开始。若是切换到固定tab，则索引值在原来tabs.length上加1。调用该方法时
         * 会先改变选中的状态，再设置url跳转值
         * @example
         * if (index > 3) {
         *     this.switchTo(index);
         * }
         */
        switchTo:function (index) {
            var me = this,
                tabNum = me.data("tabNum"),
                curIndex = parseInt(index),
                $fixElem = me.data("fixElem"),
                $navList = me.data("navList"),
                myScroll = me.data("myScroll"),
                lastIndex = me.data("lastTabIndex"),
                tabHref = me.data("tabHref"),
                fixTabHref = me.data("fixTabHref"),
                href = "", linkEle;

            //url判断切换操作
            if (curIndex >= tabNum) {     //当前选中的是固定的tab
                linkEle = $($fixElem[curIndex - tabNum]).children("a")[0];
                if (lastIndex == curIndex) {          //modified by zmm 当选中的是同一个tab时，将其href置为javascript:;
                    linkEle.href = "javascript:;";
                    return me;
                }
                href = fixTabHref[curIndex - tabNum];
            } else {        //当前选中的是可滑动的tab
                linkEle = $($navList[curIndex]).children("a")[0];
                if (lastIndex == curIndex) {         //modified by zmm 当选中的是同一个tab时，将其href置为javascript:;
                    linkEle.href = "javascript:;";
                    return me;
                }
                href = tabHref[curIndex];
            }

            if (href.indexOf("#") != -1 || lastIndex == -1) {    //modified by zmm，修改默认选中时刷新的bug
                linkEle.href = href;
            } else if (!/javascript/.test(href)) {
                location.href = href;
                return me;         //若是跳转页面，则不需要修改样式
            }
            //改变当前选中状态
            if (curIndex >= tabNum) {
                $($fixElem[curIndex - tabNum]).addClass("fix-cur");
            } else {
                $($navList[curIndex]).addClass("cur");
                me.data("isSwipe") && myScroll.hScroll && me._swipeNextPre(curIndex, me._screenPos(curIndex));
            }

            if (lastIndex >= tabNum) {   //上次选中的是固定的tab
                $($fixElem[lastIndex - tabNum]).removeClass("fix-cur");
            } else if (lastIndex >= 0) {   //上次选中的是可滑动的tab
                $($navList[lastIndex]).removeClass("cur");
            }

            me.data("lastTabIndex", curIndex);
            me.trigger("tabselect");    //触发ontabselect事件

            return me;
        },

        /**
         * @name getCurTab
         * @grammar getCurTab()  ⇒ value
         * @desc  取得当前选中的tab的信息，包括当前tab的index和初始化时传入的tab信息text和url
         * @example
         * var tabInfo = this.getCurTab();
         * console.log(tabInfo)    //{index:0, info:{text:'测试', url:"javascript:;"}}
         */
        getCurTab:function () {
            var me = this,
                lastTabIndex = me.data("lastTabIndex"),
                content = me.data("content"),
                fixContent = me.data("fixContent"),
                tabNum = me.data("tabNum"),
                curTab = [], info = null;

            if ($.isArray(content)) {
                curTab = lastTabIndex >= tabNum ? fixContent[lastTabIndex - tabNum] : content[lastTabIndex];
                info = {
                    text:curTab["text"],
                    url:curTab["url"]
                }
            } else {
                curTab = lastTabIndex >= tabNum ? me.data("fixElem")[lastTabIndex - tabNum] : me.data("navList")[lastTabIndex];
                info = {
                    text:$(curTab).find("a").html(),
                    url:$(curTab).find("a")[0].href
                }
            }

            return {
                index:lastTabIndex,
                info:info
            }
        },

        /**
         * 切换到某个tab的事件处理
         * @private
         *
         * @param {object} e 事件对象
         */
        _switchEventHandle:function (e) {
            var me = this,
                obj = e.target.tagName == "LI" ? $(e.target)[0] : $(e.target).parents("li").get(0) || $(e.target).parents("div").get(0);

            if (obj && obj.index != undefined) {
                me.switchTo(obj.index);
            }

        },

        /**
         * 加载iScroll对象
         * @private
         */
        _loaded:function () {
            var me = this,
                screenWrap = me.data("screenWrap")[0],
                isSwipe = me.data("isSwipe") ? true : false,
                myScroll = {};

            myScroll = new iScroll(screenWrap, {
                hScroll:isSwipe,
                vScroll:false,
                hScrollbar:false,
                vScrollbar:false,
                onScrollMove:function () {
                    me.data('scrollTimer', setTimeout($.bind(me._setShadow, me), 1));
                },
                onScrollEnd:function (e) {
                    if (this.absDistY > this.absDistX) {
                        me.trigger("verticalswipe", e);
                    }
                },
                onTouchEnd:function (e) {
                    if (!this.moved && !this.absDistY && !this.isStopScrollAction) {    //未触发scrollmove并且也没有竖滑操作
                        me._switchEventHandle(e);
                    }
                }
            });

            me.data("myScroll", myScroll);

        },

        /**
         * 设置滚动tab两边出现阴影
         * @private
         */
        _setShadow:function () {
            var me = this,
                $screenWrap = me.data("screenWrap"),
                myScroll = me.data("myScroll"),
                maxOffsetWidth = Math.abs(myScroll.maxScrollX);

            if (myScroll.x < 0) {
                $screenWrap.addClass("ui-navigator-shadowall");
                if (Math.abs(myScroll.x) >= maxOffsetWidth) {
                    $screenWrap.removeClass("ui-navigator-shadowall");
                    $screenWrap.addClass("ui-navigator-shadowleft");
                    $screenWrap.removeClass("ui-navigator-shadowright");
                }
            } else {
                $screenWrap.removeClass("ui-navigator-shadowall");

                $screenWrap.removeClass("ui-navigator-shadowleft");
                $screenWrap.addClass("ui-navigator-shadowright");
            }
        },

        /**
         * touchmove事件
         * @private
         *
         * @parm {Object} e 事件对象
         */
        _touchMoveHandle:function (e) {
            e.preventDefault();
        },

        /**
         * 当切换至可显示范围内的最后一个tab时，自动将该tab置为倒数第二个；当切换至可显示范围内的第一个tab时，自动将该tab置为第二个
         * 注：若出现半个tab，则半个tab及其前一个或者后一个tab也算第一个或最后一个tab
         * @private
         *
         * @parm {Object} elem 原生dom节点
         * @parm {String/Number} 当前dom节点的位置
         */
        _swipeNextPre:function (index, pos) {
            var me = this,
                thisMoveX = 0,
                tabNum = me.data("tabNum"),
                $navList = me.data("navList"),
                myScroll = me.data("myScroll"),
                isDefTab = me.data("isDefTab"),
                scrollX = myScroll.x || 0;

            switch (pos) {
                case "defTab":
                    thisMoveX = me.data("defTabMoveX") || 0;               //modified by zmm 默认选中tab跳动的距离
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    if (isDefTab) {
                        me.data("isDefTab", false);
                        me.data("defTabMoved", true);
                    }
                    break;
                case 0 :         //点击列表第一个tab项
                    thisMoveX = 0;
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    if (isDefTab) {
                        me.data("isDefTab", false);
                        me.data("defTabMoved", true);
                    }
                    break;
                case (tabNum - 1) :       //点击列表最后一个tab项
                    thisMoveX = myScroll.wrapperW - myScroll.scrollerW;
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    if (isDefTab) {
                        me.data("isDefTab", false);
                        me.data("defTabMoved", true);
                    }
                    break;
                case "first" :      //可视区域第一个tab
                    if (index == 1 && !scrollX) {    //还未滚动，并且点击的是第二个tab
                        return;
                    }
                    thisMoveX = scrollX + parseInt($navList[index - 1].offsetWidth);
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    break;
                case "last" :       //可视区域最后一个tab
                    if (index == tabNum - 2 && Math.abs(scrollX) == Math.abs(myScroll.maxScrollX)) {//列表已滚动到头，并且点击的是倒数第二个tab
                        return;
                    }
                    thisMoveX = scrollX - parseInt($navList[index - 1].offsetWidth);
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    break;
                case "middle" :    //点周中间的tab
                    break;
            }

            me.data("isDefTab", false);
            me.data('nextPreTimer', setTimeout($.bind(me._setShadow, me), 1));
        },

        /**
         * 定位当前tab在屏幕中的位置，第一个，最后一个或者中间
         * @private
         *
         * @parm {Object} elem 原生dom节点
         */
        _screenPos:function (index) {
            var me = this,
                lastIndex = me.data("tabNum") - 1;

            if (!index || index == lastIndex) {      //若是列表中的第一个或者最后一个，直接返回其索引
                return index;
            }

            var $navList = me.data("navList"),
                tabWidthSumArr = me.data("tabWidthSumArr"),
                lastAbsMoveXDis = Math.abs(me.data("myScroll").x) || 0,
                wrapOffset = $navList[0].offsetLeft - me.data("screenWrap")[0].offsetLeft, //第一个tab相对于wrap的偏移
                thisOffsetDis = tabWidthSumArr[index] + wrapOffset - lastAbsMoveXDis,
                preOffsetDis = tabWidthSumArr[index - 1] + wrapOffset - lastAbsMoveXDis,
                nextOffsetDis = tabWidthSumArr[index + 1] + wrapOffset - lastAbsMoveXDis,
                screenWidth = me.data("myScroll").wrapperW,
                thisWidth = parseInt($navList[index].offsetWidth),
                preWidth = parseInt($navList[index - 1].offsetWidth),
                screenPos = "middle";

            if (me.data("isDefTab")) {              //modified by zmm 默认选中的tab单独处理
                screenPos = "defTab";
                me.data("defTabMoveX", screenWidth - thisOffsetDis);
                return screenPos;
            }

            if (preOffsetDis < preWidth && nextOffsetDis > screenWidth) {     //当前tab的前一个tab出现半个同时其后一个tab也出现半个时
                screenPos = "middle";
            } else if (thisOffsetDis <= thisWidth || preOffsetDis < preWidth) {    //当前tab为半个或者其前面的tab是半个，则视为可显示区的第一个
                screenPos = "first";
            } else if (thisOffsetDis >= screenWidth || nextOffsetDis > screenWidth) {    //当前tab为半个tab或者其下一个tab为半个，则视为可显示区的最后一个
                screenPos = "last";
            } else {
                screenPos = "middle";
            }

            return screenPos;

        },

        /**
         * 转屏处理事件，主要针不滑动的导航栏
         * @private
         */
        _orientationEvent:function () {
            var me = this,
                myScroll = me.data("myScroll"),
                wrapOffsetWidth = me.data("wrapOffsetWidth"), //相对于所有tab宽度的差值
                defTab = me.data("defTab"),
                $navList = me.data("navList"),
                wrapOffset = $navList[0].offsetLeft - me.data("screenWrap")[0].offsetLeft;

            myScroll.refresh(); //modified by zmm, trace:FEBASE-343,FEBASE-341, 键盘出来的时候，iscroll中的refresh算的宽度不对，需要重新调用iscroll中的refresh
                                //在ex.js中统一处理的转屏延迟后，不需要再处理延迟了

            if (!me.data("isSwipe")) {
                me.data("listWrap").css("width", myScroll.wrapperW - wrapOffsetWidth + "px");
            }

            if (!me.data("isDefTab") && me.data("defTabMoved")) {
                myScroll.scrollTo(myScroll.wrapperW - me.data("tabWidthSumArr")[defTab] - wrapOffset, 0, 400);
                me.data("defTabMoved", false);
            }
        },

        /**
         * 事件处理中心
         * @private
         *
         * @param {object} e 事件对象
         */
        _eventHandler:function (e) {
            var me = this;

            switch (e.type) {
                case 'click':
                case 'tap':
                    me._switchEventHandle(e);
                    break;
                case 'touchmove':
                    me._touchMoveHandle(e);
                    break;
                case 'ortchange':
                    me._orientationEvent(e);
                    break;
            }
        },

        /**
         * @name destroy
         * @grammar destroy()  => undefined
         * @desc 销毁组件创建的dom及绑定的事件，同时调用iscroll中的destroy
         */
        destroy:function () {
            var me = this,
                fixElem = me.data('fixElem'),
                scrollTimer = me.data('scrollTimer'), //清除延迟
                nextPreTimer = me.data('nextPreTimer'),
                orientTimer = me.data('orientTimer');

            fixElem && fixElem.remove();
            scrollTimer && clearTimeout(scrollTimer);
            nextPreTimer && clearTimeout(nextPreTimer);
            orientTimer && clearTimeout(orientTimer);
            me.data('myScroll').destroy();

            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***onverticalswipe*** : 竖滑时触发的事件，如可以呼出其他组件
         * - ***ontabselect***: tab选中时触发的事件
         * @example
         * var refresh = $.ui.refresh(opts);
         * refresh.on('beforescrollstart', function(e){
         *      var target = e.target;
         *      while (target.nodeType != 1) target = target.parentNode;
         *      if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
         *          e.preventDefault();
         *      }
         * });
         */

    }).attach('control.fix');

})(Zepto);


(function($){
/**
 *css3 Touch Scroll，此版本在放假期间开发中，仅在测试了chrome浏览器和iphone中测试了。。。
 *
 * @author: 一只柯楠
 * 
 * @param   {Object}    options;
 * @config   {zepto}     options.$el            //外围容器 选择器或者element
 * @config   {array}     options.pages          //填充每一页的内容 Element || string || function
 * @config   {Number}    options.animTime       //动画时间，默认为500   
 * @config   {Function}  options.beforechange   //动画完成之前回调函数    
 * @config   {Function}  options.afterchange    //动画完成之后回调函数    
 * @isFollow {Boolean}  obtions.isFollow        //是否跟随,默认false
 * @isFollow {Boolean}  obtions.loop            //自动循环的时间/ms
 * 
 * 
 */

    function NewsSlider(options) {
        var me = this,
            defaultData = {
                isFollow: false,
                animTime: 500,
                curIndex: 0,            //当前索引
                _wrapLeftIndex: 0,      //是外围动画节点的移动单位距离
                loop: 0,
                loopDir: 1,
                pages: [],
                lazyLoad: false,
                beforechange: function(){
                },
                afterchange: function(){
                },
            };
        me.options= $.extend(defaultData, options);
        me.init();
        return me;
    }
    NewsSlider.prototype = {
        //顾名思义
        init:function(){
            var me = this
            me.$el= $(me.options.$el);
            me.options._lazyLoad= !me.options.loop && me.options.lazyLoad;
            me._wrapLeftIndex= me.options._wrapLeftIndex;
            me.curIndex= me.options.curIndex;
            me.options.beforechange(me.curIndex);
            me._initNodes();
            me.options.afterchange(me.curIndex);
            var loop= me.options.loop;
            me.touchEnabled= true;
            me.options.isFollow ? me.initTouchFollow() : me.initTouch();
            var /*t=0,tm,*/ _resizeListener, _bodyEventListener;
            me.$container[0].addEventListener('webkitTransitionEnd', me, false);
            me._resizeListener= _resizeListener= me.delay(function(e){
                    //当display:none隐藏时，不执行;
                    if(!me.$el[0].offsetHeight)
                        return;
                    $.later(function(){
                        me.refreshPos();
                        if(loop)
                            me.startAutoLoop()
                    }, 500);
            }, 200);
            
            addEventListener('onorientationchange' in window ?
                'orientationchange' : 'resize', _resizeListener);
            
            if(me.options.loop){
                var dirfoo= me.options.loopDir < 0 ? 'toLeft' : 'toRight', timeoutid, touchEv= me.touchEv;
                me._bodyEventListener= _bodyEventListener= function(e){
                    me[(touchEv.START_EV===e.type ? 'stop' : 'start') +'AutoLoop']();
                }
                $(window).on(touchEv.START_EV+' '+touchEv.END_EV, _bodyEventListener);
                me.stopAutoLoop= function(){
                    if(timeoutid){
                        clearTimeout(timeoutid);
                        timeoutid= null;
                    }
                    return me;
                };
                me.startAutoLoop= function(){
                    me.stopAutoLoop();
                    timeoutid= setTimeout(function(){
                        timeoutid= null;
                        //当隐藏时，不执行;
                        if(me.$el[0].offsetHeight)
                            me[dirfoo]();
                    }, me.options.loop)
                    return me;
                };
                me.startAutoLoop();
            }
            return me;
        },

        
        _initNodes: function(){
            var me = this, i= 0, nodes, length, left, contentWidth= me._contentWidth= me.options.width || me.$el[0].clientWidth || $(window).width(), self= me,
                reg= /<\//g,
                lazyLoad= self.options._lazyLoad,
                curIndex= self.curIndex,
                html= me.$el.html(); 
                if(!html.trim()){
                    for(var num=0;num <　me.options.pages.length; num++){
                        html+= '<div></div>';
                    }
                }
            html= html.replace(reg, function($a){
                return (!lazyLoad || i=== curIndex ? self.getPage(i++) : '') +$a;
            });
            me.$el.html('<div  style="display: -webkit-box;-webkit-transform: translate3d('+curIndex+'px, 0px, 0px);-webkit-user-select: none;-webkit-transition: -webkit-transform '+me.options.animTime+'ms cubic-bezier(0, 0, 0.25, 1)">'+
                    html
                    +'</div>');
            me.$container= me.$el.children();
            nodes= me.nodes= me.$container.children();
            me.maxIndex= (length= me.nodesLength= nodes.length) -1;
            
            var bestDest= Math.ceil(length/2);
            var nodesAry= self._nodes=[];
            var text = "";
            nodes.forEach(function(node, index){
                left= index< bestDest ? index:  -(length- index);
                nodesAry.push({node: node, left: left, index: index});
                node.style.cssText+= ';-webkit-transform: translate(-'+(index)+'00%, 0) translate3d('+left*contentWidth+'px, 0px, 0px);';
            });
            
            nodesAry.sort(function(a, b){
                return a.left- b.left;
            });
            //转到对应页
            me.curIndex= 0;
            me.move(curIndex, 0);
            return me;
        },
       //设为cotainer和nodes的位置,无动画
        refreshPos: function(){
            var contentWidth= this._contentWidth= this.$el[0].clientWidth, self= this;
            this.setNodeLeft(this.$container[0], this._wrapLeftIndex * contentWidth)
            this._nodes.forEach(function(val,index){
                self.setNodeLeft(val.node, val.left* contentWidth);
            });
            return this;

        },
        
        setNodeLeft: function(ele, left){
            var style= ele.style;
            style.cssText= style.cssText.replace(/translate3d\(([-\d]+)px/g, 'translate3d\('+
                left
            +'px');
            return this;
        },
        /*
         * 重新排列数组，重新设置nodes位置
         */
        _setNodesTranslate: function(dir){
            var into,
                out,
                bestLeft,
                nodes= this._nodes,
                node,
                contentWidth= this._contentWidth,
                maxIndex=this.nodesLength-1,
                curIndex= this.curIndex,
                curpage;
            if(dir==0)
                return;
            if(dir<0){
                into= 'unshift';
                out= 'pop';
                bestLeft= nodes[0].left -1;
            }else{
                into= 'push';
                out= 'shift';
                bestLeft= nodes[maxIndex].left+ 1;
            }
            node= nodes[out]();
            node.left= bestLeft;
            nodes[into](node);
            this.setNodeLeft(node.node, bestLeft* contentWidth);
            return this;
        },

        toLeft: function(){
            return this.move(this.curIndex-1);
        },

        toRight: function(){
            return this.move(this.curIndex+1);
        },

        toCurrent: function(){
            return this.move(this.curIndex);
        },

        getPage: function(index){
            var page= this.options.pages[index];

            var sreturn = $.isFunction(page) ? page() : page instanceof Element ? page.outerHTML : page;
            return sreturn;
        },

        handleEvent: function(e){
            if(e.type==='webkitTransitionEnd'){
                this.options.afterchange(this.curIndex);
                this.touchEnabled= true;
                if(this.options.loop){
                    this.startAutoLoop();
                }
            }
        },

        move: function(index, anim){
            var left= this._wrapLeftIndex= this._wrapLeftIndex + (this.curIndex- index), res, curIndex,
            self= this,
            curIndex= index < 0 ? this.maxIndex : index > this.maxIndex ? 0 : index;
            var len= this.curIndex- index, dir= len > 0 ? -1: 1, self= this;
            //有改变
            if(len){
                if(self.options._lazyLoad){
                    curpage= self.nodes[curIndex];
                    !curpage.firstElementChild && (curpage.innerHTML= self.getPage(curIndex));
                }   
                self.curIndex= curIndex;
                self.options.beforechange(curIndex);
            }
            while(len){
                len+= dir;
                self._setNodesTranslate(dir);
            }
            this.setAnimTime(anim).setNodeLeft(this.$container[0], left * this._contentWidth);
            //设为0，旋转时无动画
            $.later(function(){
               self.setAnimTime(0); 
            });
            return this;
        },

        setAnimTime: function(anim){
            anim=anim===undefined ? this.options.animTime : anim;
            this.$container.css('-webkit-transition', '-webkit-transform '+anim+'ms cubic-bezier(0, 0, 0.25, 1)');
            return this;
        },
        /*
         *fn= delay(function(){}, 250);
         */
        delay: function (run, time){
            var _timer, _lock;
            var foo= function(){
                clearTimeout(_timer);
                if(_lock){
                    //锁定时进入，延时time来执行foo
                    _timer= setTimeout(foo, time);
                }else{
                    //首次直接执行，并且锁定time时间
                    _lock= true;
                    run();
                    setTimeout(function(){_lock= false;}, time);
                }
            }
            return foo;
        },

        //一看就懂,虽然写了mosedown,不过并没有兼容鼠标事件，需要开启chrome调试器中点选EMULATE TOUCH EVENTS 
        touchEv:(function(){
            var isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),
            hasTouch='ontouchstart' in window && !isTouchPad;
            return {
                hasTouch:hasTouch,
                START_EV:hasTouch ? 'touchstart' : 'mousedown',
                MOVE_EV:hasTouch ? 'touchmove' : 'mousemove',
                END_EV:hasTouch ? 'touchend' : 'mouseup'
            }
        })(),
        //不跟随手指动画注册
        initTouch:function(){
            var now=null,
                touch={},
                self=this,
                timeout,
                touchEv=this.touchEv;
            this.$el.on(touchEv.START_EV,function(e){
                if(!self.touchEnabled)
                    return ;
                
                if(!e.touches || e.touches.length!==1)
                    return ;
                touch.x1= e.touches[0].clientX;
                touch.y1= e.touches[0].clientY;

                
                timeout=setTimeout(function(){
                    timeout=null;
                },800);
            }).on(touchEv.MOVE_EV,function(e){

                if(!self.touchEnabled || !e.touches || self.maxIndex <= 0)
                    return ;
                if(timeout){
                    touch.x2= e.touches[0].clientX;
                    touch.y2= e.touches[0].clientY;
                    dir=self.swipeDirection(touch.x1,touch.x2,touch.y1,touch.y2);
                    if(dir=='Left' || dir=='Right')
                        e.preventDefault(); 
                }
            })
            self._touchEndListener= function(e){
                if(!self.touchEnabled)
                    return;
                if(timeout && touch.x2 && Math.abs(touch.x1 - touch.x2) > 5){
                    self.touchEnabled= false;
                    if(dir=='Left'){
                        self.toRight();
                    }else if(dir=='Right'){
                        self.toLeft();
                    }
                    else {
                        self.touchEnabled = true;
                    }
                };
                touch={};
            };
            $(window).on(touchEv.END_EV, self._touchEndListener);
            return this;
        },
        //跟随手指动画注册
        initTouchFollow:function(){
            var touchEv=this.touchEv,
                self=this,
                scrolling=null,
                startX=0,
                startY=0,
                moveX=0,
                moveY=0,
                baseX=0,
                distX,
                newX,
                dir=0,
                currentLeft= 0,
                container= this.$container[0],
                transX;

            this.$el.on(touchEv.START_EV,function(e){
                if(!e.touches|| !self.touchEnabled && e.touches.length!=1 )
                    return ;
                if(!touchEv.hasTouch)
                    e.preventDefault();
                self.setAnimTime(0);
                scrolling=true;
                moveRead=false;
                startX=e.touches[0].clientX;    
                startY=e.touches[0].clientY;    
                baseX=startX;
                newX= self._wrapLeftIndex* self._contentWidth;
                dir=0;
            }).on(touchEv.MOVE_EV,function(e){
                if(!e.touches || !scrolling || !self.touchEnabled || self.maxIndex <= 0)
                    return ;
                var moveX=e.touches[0].clientX,
                    moveY=e.touches[0].clientY; 
                if(moveRead){
                    distX=moveX-baseX;
                    self.setNodeLeft(container, newX+=distX);
                    dir= distX>0 ? 1 : -1;
                    baseX=moveX;
                }else{
                    var changeX=Math.abs(moveX-startX),
                        changeY=Math.abs(moveY-startY);
                    if((changeX/changeY)>1){
                        e.preventDefault();
                        e.stopPropagation();
                        moveY= null;
                        moveRead=true;
                    }else if(changeY>5){
                        scrolling=false;
                        moveY= null;
                    }
                };
            });
            self._touchEndListener= function(e){
                if(!scrolling || !self.touchEnabled)
                    return ;
                self.touchEnabled= false;
                scrolling=false;
                transX = baseX-startX;
                if(transX > 50){
                    self.toLeft();
                }else if(transX < -50){
                    self.toRight();
                }else{
                    self.toCurrent();
                    self.touchEnabled= true;
                }
                scrolling=
                startX=
                startY=
                moveX=
                moveY=
                baseX=
                distX=
                newX=
                dir=
                transX=null;
            }
            $(window).on(touchEv.END_EV,self._touchEndListener)
            return this;
        },

        swipeDirection:function(x1, x2, y1, y2){
            var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
            return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
        },
        //释放内存
        destory:　function(remove){
            var me = this;
            me.stopAutoLoop && me.stopAutoLoop();
            removeEventListener('onorientationchange' in window ?
                'orientationchange' : 'resize', me._resizeListener);
            me.$container[0].removeEventListener('', me, false);
            me.$el.off();
            remove && me.$el.empty();
            me.options.$el = null;
            me.options = null;
            
            // $(window).off(me.touchEv.START_EV+' '+me.touchEv.END_EV, me._bodyEventListener)
            // $(window).off(me.touchEv.END_EV, me._touchEndListener)
            // $doc= null;
            // me.__proto__ = null;
            // for(var i in me){
            //  delete me[i];
            // }
        }
    };

//添加到Zepto
$.fn.touchCarousel=function(options){
    options.$el = this;
    var instance = new NewsSlider(options);
    return instance ;
} 

})(Zepto);

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




(function($){
    $.ui.productlist = function(product) {
    
    var config = [

 {id: 'web',       name: '网页',   pos: {x:-1, y:0}}  
,{id: 'image',     name: '图片',   pos: {x:-104, y:0}}  
,{id: 'video',     name: '视频',   pos: {x:-154, y:0}}  
,{id: 'hao123',    name: '上网导航', pos: {x:-104, y:-150}}    
,{id: 'tieba',     name: '贴吧',   pos: {x:-52, y:0}} 
,{id: 'zhidao',    name: '知道',   pos: {x:-1, y:-100}}   
,{id: 'wenku',     name: '文库',   pos: {x:-53, y:-100}}    
,{id: 'baike',     name: '百科',   pos: {x:-154, y:-50}}    
// ,{id: 'space',     name: '空间',   pos: {x:-154, y:-100}}    
,{id: 'music',     name: '音乐',   pos: {x:-104, y:-50}}    
,{id: 'map',       name: '地图',   pos: {x:-1, y:-150}}    
,{id: 'app',       name: '应用',   pos: {x:-52, y:-50}}   
,{id: 'lvyou',     name: '旅游',   pos: {x:-103, y:-100}}    
,{id: 'fanyi',     name: '翻译',   pos: {x:-154, y:-150}}   
,{id: 'tuangou',     name: '团购',   pos: {x:-205, y:0}}
,{id: 'tuiguang',     name: '百度推广',   pos: {x:-205, y:-50}}
        ],

        urlConfig = [
// 与config的配置顺序必须一致
        
// 网页
'http://m.baidu.com/?bd_page_type=1&ssid=0&from=0&uid=&pu=sz%401320_2001&fr='
// 图片
,'http://m.baidu.com/img?tn=bdidxiphone&itj=41&bd_page_type=1&ssid=0&from=0&uid=&pu=sz@1320_2001&fr='
// 视频
,'http://m.baidu.com/video?fr='
// Hao123
,'http://m.hao123.com/?z=2&tn=baidunews'
// 贴吧
,'http://wapp.baidu.com/?lp=1065&amp;bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 知道
,'http://wapiknow.baidu.com/?st=3&amp;bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 文库
,'http://wk.baidu.com/?st=3&amp;bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 百科
,'http://wapbaike.baidu.com/?st=3&amp;bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 空间
// ,'http://i.hi.baidu.com/?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 音乐
,'http://mp3.baidu.com/mobile.html?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 地图
,'http://map.baidu.com?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 应用
,'http://m.baidu.com/app?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 旅游
,'http://lvyou.baidu.com?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 翻译
,'http://fanyi.baidu.com/?from=xinwen'
//团购
,'http://mtuan.baidu.com/view?z=2&from=map_webapp'
//推广
,'http://e.baidu.com/m2/?refer=707'
// 小说
//,'http://wap.baidu.com/xs?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr= '

        ];

        for(var i = 0; i < config.length; i++){
            config[i]['url'] = urlConfig[i];
        }

        for(i = 0; i < config.length; i++){
            if(config[i].id == product){
                config.splice(i, 1);
                break;
            }
        }

        return config;
    } 
})(Zepto);


/**
 * @name Extend
 * @file 对Zepto做了些扩展，以下所有JS都依赖与此文件
 * @desc 对Zepto一些扩展，组件必须依赖
 * @import core/zepto.js
 */


//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

// The following code is heavily inspired by jQuery's $.fn.data()

;(function($) {
    var data = {}, dataAttr = $.fn.data, camelize = $.zepto.camelize,
        exp = $.expando = 'Zepto' + (+new Date())

    // Get value from node:
    // 1. first try key as given,
    // 2. then try camelized key,
    // 3. fall back to reading "data-*" attribute.
    function getData(node, name) {
        var id = node[exp], store = id && data[id]
        if (name === undefined) return store || setData(node)
        else {
            if (store) {
                if (name in store) return store[name]
                var camelName = camelize(name)
                if (camelName in store) return store[camelName]
            }
            return dataAttr.call($(node), name)
        }
    }

    // Store value under camelized key on node
    function setData(node, name, value) {
        var id = node[exp] || (node[exp] = ++$.uuid),
            store = data[id] || (data[id] = attributeData(node))
        if (name !== undefined) store[camelize(name)] = value
        return store
    }

    // Read all "data-*" attributes from a node
    function attributeData(node) {
        var store = {}
        $.each(node.attributes, function(i, attr){
            if (attr.name.indexOf('data-') == 0)
                store[camelize(attr.name.replace('data-', ''))] = attr.value
        })
        return store
    }

    $.fn.data = function(name, value) {
        return value === undefined ?
            // set multiple values via object
            $.isPlainObject(name) ?
                this.each(function(i, node){
                    $.each(name, function(key, value){ setData(node, key, value) })
                }) :
                // get value from first element
                this.length == 0 ? undefined : getData(this[0], name) :
            // set value on all elements
            this.each(function(){ setData(this, name, value) })
    }

    $.fn.removeData = function(names) {
        if (typeof names == 'string') names = names.split(/\s+/)
        return this.each(function(){
            var id = this[exp], store = id && data[id]
            if (store) $.each(names, function(){ delete store[camelize(this)] })
        })
    }
})(Zepto);

(function($){
    var rootNodeRE = /^(?:body|html)$/i;
    $.extend($.fn, {
        offsetParent: function() {
            return $($.map(this, function(el){
                var parent = el.offsetParent || document.body
                while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
                    parent = parent.offsetParent
                return parent
            }));
        },
        scrollTop: function(){
            if (!this.length) return
            return ('scrollTop' in this[0]) ? this[0].scrollTop : this[0].scrollY
        }
    });
    $.extend($, {
        contains: function(parent, node) {
            /**
             * modified by chenluyang
             * @reason ios4 safari下，无法判断包含文字节点的情况
             * @original return parent !== node && parent.contains(node)
             */
            return parent.compareDocumentPosition
                ? !!(parent.compareDocumentPosition(node) & 16)
                : parent !== node && parent.contains(node)
        }
    });
})(Zepto);


//Core.js
;(function($) {
    //扩展在Zepto静态类上
    $.extend($, {
        /**
         * @grammar $.toString(obj)  ⇒ string
         * @name $.toString
         * @desc toString转化
         */
        toString: function(obj) {
            return Object.prototype.toString.call(obj);
        },

        /**
         * @desc 从集合中截取部分数据，这里说的集合，可以是数组，也可以是跟数组性质很像的对象，比如arguments
         * @name $.slice
         * @grammar $.slice(collection, [index])  ⇒ array
         * @example (function(){
         *     var args = $.slice(arguments, 2);
         *     console.log(args); // => [3]
         * })(1, 2, 3);
         */
        slice: function(array, index) {
            return Array.prototype.slice.call(array, index || 0);
        },

        /**
         * @name $.later
         * @grammar $.later(fn, [when, [periodic, [context, [data]]]])  ⇒ timer
         * @desc 延迟执行fn
         * **参数:**
         * - ***fn***: 将要延时执行的方法
         * - ***when***: *可选(默认 0)* 什么时间后执行
         * - ***periodic***: *可选(默认 false)* 设定是否是周期性的执行
         * - ***context***: *可选(默认 undefined)* 给方法设定上下文
         * - ***data***: *可选(默认 undefined)* 给方法设定传入参数
         * @example $.later(function(str){
         *     console.log(this.name + ' ' + str); // => Example hello
         * }, 250, false, {name:'Example'}, ['hello']);
         */
        later: function(fn, when, periodic, context, data) {
            return window['set' + (periodic ? 'Interval' : 'Timeout')](function() {
                fn.apply(context, data);
            }, when || 0);
        },

        /**
         * @desc 解析模版
         * @grammar $.parseTpl(str, data)  ⇒ string
         * @name $.parseTpl
         * @example var str = "<p><%=name%></p>",
         * obj = {name: 'ajean'};
         * console.log($.parseTpl(str, data)); // => <p>ajean</p>
         */
        parseTpl: function(str, data) {
            var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' + 'with(obj||{}){__p.push(\'' + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/<%=([\s\S]+?)%>/g, function(match, code) {
                return "'," + code.replace(/\\'/g, "'") + ",'";
            }).replace(/<%([\s\S]+?)%>/g, function(match, code) {
                    return "');" + code.replace(/\\'/g, "'").replace(/[\r\n\t]/g, ' ') + "__p.push('";
                }).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + "');}return __p.join('');";
            var func = new Function('obj', tmpl);
            return data ? func(data) : func;
        },

        /**
         * @desc 减少执行频率, 多次调用，在指定的时间内，只会执行一次。
         * **options:**
         * - ***delay***: 延时时间
         * - ***fn***: 被稀释的方法
         * - ***debounce_mode***: 是否开启防震动模式, true:start, false:end
         *
         * <code type="text">||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
         * X    X    X    X    X    X      X    X    X    X    X    X</code>
         *
         * @grammar $.throttle(delay, fn) ⇒ function
         * @name $.throttle
         * @example var touchmoveHander = function(){
         *     //....
         * }
         * //绑定事件
         * $(document).bind('touchmove', $.throttle(250, touchmoveHander));//频繁滚动，每250ms，执行一次touchmoveHandler
         *
         * //解绑事件
         * $(document).unbind('touchmove', touchmoveHander);//注意这里面unbind还是touchmoveHander,而不是$.throttle返回的function, 当然unbind那个也是一样的效果
         *
         */
        throttle: function(delay, fn, debounce_mode) {
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
            // for event bind | unbind
            wrapper._zid = fn._zid = fn._zid || $.proxy(fn)._zid;
            return wrapper;
        },

        /**
         * @desc 减少执行频率, 在指定的时间内, 多次调用，只会执行一次。
         * **options:**
         * - ***delay***: 延时时间
         * - ***fn***: 被稀释的方法
         * - ***t***: 指定是在开始处执行，还是结束是执行, true:start, false:end
         *
         * 非at_begin模式
         * <code type="text">||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
         *                         X                                X</code>
         * at_begin模式
         * <code type="text">||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
         * X                                X                        </code>
         *
         * @grammar $.debounce(delay, fn[, at_begin]) ⇒ function
         * @name $.debounce
         * @example var touchmoveHander = function(){
         *     //....
         * }
         * //绑定事件
         * $(document).bind('touchmove', $.debounce(250, touchmoveHander));//频繁滚动，只要间隔时间不大于250ms, 在一系列移动后，只会执行一次
         *
         * //解绑事件
         * $(document).unbind('touchmove', touchmoveHander);//注意这里面unbind还是touchmoveHander,而不是$.debounce返回的function, 当然unbind那个也是一样的效果
         */
        debounce: function(delay, fn, t) {
            return fn === undefined ? $.throttle(250, delay, false) : $.throttle(delay, fn, t === undefined ? false : t !== false);
        }
    });

    /**
     * 扩展类型判断
     * @param {Any} obj
     * @see isString, isBoolean, isRegExp, isNumber, isDate, isObject, isNull, isUdefined
     */
    /**
     * @name $.isString
     * @grammar $.isString(val)  ⇒ Boolean
     * @desc 判断变量类型是否为***String***
     * @example console.log($.isString({}));// => false
     * console.log($.isString(123));// => false
     * console.log($.isString('123'));// => true
     */
    /**
     * @name $.isBoolean
     * @grammar $.isBoolean(val)  ⇒ Boolean
     * @desc 判断变量类型是否为***Boolean***
     * @example console.log($.isBoolean(1));// => false
     * console.log($.isBoolean('true'));// => false
     * console.log($.isBoolean(false));// => true
     */
    /**
     * @name $.isRegExp
     * @grammar $.isRegExp(val)  ⇒ Boolean
     * @desc 判断变量类型是否为***RegExp***
     * @example console.log($.isRegExp(1));// => false
     * console.log($.isRegExp('test'));// => false
     * console.log($.isRegExp(/test/));// => true
     */
    /**
     * @name $.isNumber
     * @grammar $.isNumber(val)  ⇒ Boolean
     * @desc 判断变量类型是否为***Number***
     * @example console.log($.isNumber('123'));// => false
     * console.log($.isNumber(true));// => false
     * console.log($.isNumber(123));// => true
     */
    /**
     * @name $.isDate
     * @grammar $.isDate(val)  ⇒ Boolean
     * @desc 判断变量类型是否为***Date***
     * @example console.log($.isDate('123'));// => false
     * console.log($.isDate('2012-12-12'));// => false
     * console.log($.isDate(new Date()));// => true
     */
    /**
     * @name $.isObject
     * @grammar $.isObject(val)  ⇒ Boolean
     * @desc 判断变量类型是否为***Object***
     * @example console.log($.isObject('123'));// => false
     * console.log($.isObject(true));// => false
     * console.log($.isObject({}));// => true
     */
    /**
     * @name $.isNull
     * @grammar $.isNull(val)  ⇒ Boolean
     * @desc 判断变量类型是否为***null***
     * @example console.log($.isNull(false));// => false
     * console.log($.isNull(0));// => false
     * console.log($.isNull(null));// => true
     */
    /**
     * @name $.isUndefined
     * @grammar $.isUndefined(val)  ⇒ Boolean
     * @desc 判断变量类型是否为***undefined***
     * @example
     * console.log($.isUndefined(false));// => false
     * console.log($.isUndefined(0));// => false
     * console.log($.isUndefined(a));// => true
     */
    $.each("String Boolean RegExp Number Date Object Null Undefined".split(" "), function(i, name) {
        var fnbody = '';
        switch (name) {
            case 'Null':
                fnbody = 'obj === null';
                break;
            case 'Undefined':
                fnbody = 'obj === undefined';
                break;
            default:
                //fnbody = "new RegExp('" + name + "]', 'i').test($.toString(obj))";
                fnbody = "new RegExp('" + name + "]', 'i').test(Object.prototype.toString.call(obj))";//解决zepto与jQuery共存时报错的问题，$被jQuery占用了。
        }
        $['is' + name] = new Function('obj', "return " + fnbody);
    });

})(Zepto);

//Support.js
(function($, undefined) {
    var ua = navigator.userAgent,
        na = navigator.appVersion,
        br = $.browser;

    /**
     * @name $.browser
     * @desc 扩展zepto中对browser的检测
     *
     * **可用属性**
     * - ***qq*** 检测qq浏览器
     * - ***chrome*** 检测chrome浏览器
     * - ***uc*** 检测uc浏览器
     * - ***version*** 检测浏览器版本
     *
     * @example
     * if ($.browser.qq) {      //在qq浏览器上打出此log
     *     console.log('this is qq browser');
     * }
     */
    $.extend($.browser, {
        qq: /qq/i.test(ua),
        chrome: /chrome/i.test(ua) || /CriOS/i.test(ua),
        uc: /UC/i.test(ua) || /UC/i.test(na)
    });

    $.browser.uc = $.browser.uc || !$.browser.qq && !$.browser.chrome && !/safari/i.test(ua);

    try {
        $.browser.version = br.uc ? na.match(/UC(?:Browser)?\/([\d.]+)/)[1] : br.qq ? ua.match(/MQQBrowser\/([\d.]+)/)[1] : br.chrome ? ua.match(/(?:CriOS|Chrome)\/([\d.]+)/)[1] : br.version;
    } catch (e) {}


    /**
     * @name $.support
     * @desc 检测设备对某些属性或方法的支持情况
     *
     * **可用属性**
     * - ***orientation*** 检测是否支持转屏事件，UC中存在orientaion，但转屏不会触发该事件，故UC属于不支持转屏事件(iOS 4上qq, chrome都有这个现象)
     * - ***touch*** 检测是否支持touch相关事件
     * - ***cssTransitions*** 检测是否支持css3的transition
     * - ***has3d*** 检测是否支持translate3d的硬件加速
     *
     * @example
     * if ($.support.has3d) {      //在支持3d的设备上使用
     *     console.log('you can use transtion3d');
     * }
     */
    $.support = $.extend($.support || {}, {
        orientation: !($.browser.uc || (parseFloat($.os.version)<5 && ($.browser.qq || $.browser.chrome))) && "orientation" in window && "onorientationchange" in window,
        touch: "ontouchend" in document,
        cssTransitions: "WebKitTransitionEvent" in window,
        has3d: 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()

    });

})(Zepto);

//Event.js
(function($) {
    /** detect orientation change */
    $(document).ready(function () {
        var getOrt = "matchMedia" in window ? function(){
                return window.matchMedia("(orientation: portrait)").matches?'portrait':'landscape';
            }:function(){
                var elem = document.documentElement;
                return elem.clientWidth / Math.max(elem.clientHeight, 320) < 1.1 ? "portrait" : "landscape";
            },
            lastOrt = getOrt(),
            handler = function(e) {
                if(e.type == 'orientationchange'){
                    return $(window).trigger('ortchange');
                }
                maxTry = 20;
                clearInterval(timer);
                timer = $.later(function() {
                    var curOrt = getOrt();
                    if (lastOrt !== curOrt) {
                        lastOrt = curOrt;
                        clearInterval(timer);
                        $(window).trigger('ortchange');
                    } else if(--maxTry){//最多尝试20次
                        clearInterval(timer);
                    }
                }, 50, true);
            },
            timer, maxTry;
        $(window).bind($.support.orientation ? 'orientationchange' : 'resize', $.debounce(handler));
    });

    /**
     * @name Trigger Events
     * @theme event
     * @desc 扩展的事件
     * - ***scrollStop*** : scroll停下来时触发, 考虑前进或者后退后scroll事件不触发情况。
     * - ***ortchange*** : 当转屏的时候触发，兼容uc和其他不支持orientationchange的设备
     * @example $(document).on('scrollStop', function () {        //scroll停下来时显示scrollStop
     *     console.log('scrollStop');
     * });
     *
     * $(document).on('ortchange', function () {        //当转屏的时候触发
     *     console.log('ortchange');
     * });
     */
    /** dispatch scrollStop */
    function _registerScrollStop(){
        $(window).on('scroll', $.debounce(80, function() {
            $(document).trigger('scrollStop');
        }, false));
    }
    //在离开页面，前进或后退回到页面后，重新绑定scroll, 需要off掉所有的scroll，否则scroll时间不触发
    function _touchstartHander() {
        $(window).off('scroll');
        _registerScrollStop();
    }
    _registerScrollStop();
    $(window).on('pageshow', function(e){
        if(e.persisted) {//如果是从bfcache中加载页面
            $(document).off('touchstart', _touchstartHander).one('touchstart', _touchstartHander);
        }
    });
})(Zepto);

/**
 *  @file 基于Zepto的图片延迟加载插件
 *  @name imglazyload
 *  @desc 图片延迟加载
 *  @import core/zepto.extend.js
 */
//update imglazyload from gmu by zhangyao,to fix scroll quickly not show img bug
(function ($) {
    /**
     * @name imglazyload
     * @grammar  imglazyload(opts)   ⇒ self
     * @desc 图片延迟加载
     * **Options**
     * - ''placeHolder''     {String}:              (可选, 默认值:\'\')图片显示前的占位符
     * - ''container''       {Array|Selector}:      (可选, 默认值:window)图片延迟加载容器
     * - ''threshold''       {Array|Selector}:      (可选, 默认值:0)阀值，为正值则提前加载
     * - ''dataName''        {String}:              (可选, 默认值:data-url)图片url名称
     * - ''eventName''       {String}:              (可选, 默认值:scrollStop)绑定事件方式
     * - ''refresh''         {Boolean}              (可选, 默认值:false)是否是更新操作，若是页面追加图片，可以将该参数设为false
     * - ''startload''       {Function}             (可选, 默认值:null)开始加载前的事件，该事件作为参数，不是trigger的
     *
     *
     * **events**
     * - ''startload'' 开始加载图片
     * - ''loadcomplete'' 加载完成
     * - ''error'' 加载失败
     *
     * @example $('.lazy-load').imglazyload();
     * $('.lazy-load').imglazyload().on('error', function (e) {
     *     e.preventDefault();      //该图片不再加载
     * });
     */
    var pedding;
    $.fn.imglazyload = function (opts) {
        var splice = Array.prototype.splice,
            opts = $.extend({
                threshold:0,
                container:window,
                urlName:'data-url',
                placeHolder:'',
                eventName:'scrollStop',
                startload: null,
                refresh: false
            }, opts),
            $container = $(opts.container),
            cTop = $container.scrollTop(),
            cHeight = $container.height(),
            detect = {
                init:function (top, height) {    //初始条件
                    return cTop >= top - opts.threshold - cHeight && cTop <= top + height;
                },
                'default':function (top, height) {      //每次滚动时发生变化，滚动条件
                    var cTop = $container.scrollTop(),
                        cHeight = $container.height();
                    return cTop >= top - opts.threshold - cHeight && cTop <= top + height;
                }
            };

        pedding = $.slice(this).reverse();
        if (opts.refresh) return this;      //更新pedding值

        function _load(div) {
            var $div = $(div), $img;
            $.isFunction(opts.startload) && opts.startload.call($div);
            $img = $('<img />').on('load',function () {
                $div.trigger('loadcomplete').replaceWith($img);
                $img.off('load');
            }).on('error',function () {     //图片加载失败处理
                var errorEvent = $.Event('error');       //派生错误处理的事件
                $div.trigger(errorEvent);
                errorEvent.defaultPrevented || pedding.push(div);
                $img.off('error').remove();
            }).attr('src', $div.attr(opts.urlName));
        }

        function _detect(type) {
            var i, $image, offset, div;
            for (i = pedding.length; i--;) {
                $image = $(div = pedding[i]);
                offset = $image.offset();
                detect[type || 'default'](offset.top, offset.height) && (splice.call(pedding, i, 1), _load(div));;
            }
        }

        $(document).ready(function () {
            opts.placeHolder && $(pedding).append(opts.placeHolder);     //初化时将placeHolder存入
            _detect('init');
        });

        (opts.container === window ? $(document) : $container).on(opts.eventName + ' ortchange', function () {
            _detect();
        });

        return this;
    };
})(Zepto);


/* ========================================================================
 * topicSlider.js v0.1
 
 * ======================================================================== */


+function ($) {
  //'use strict';

    var Slider = function (element, options) {

        this.element = $(element);
        this.params = $.extend({}, this.getDefaults(), options || {});
        this.selector = this.params.itemSelector;
        this.iconSelector = this.params.iconSelector;
        
        this.iconContainer = this.element.siblings(this.iconSelector);        
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.listW = this.element.width();
        this.curIndex = this.params.startIndex;
        
        this.items = this.element.children(this.selector);
        this.len = Math.ceil( this.items.length );

        
        this.init('slider');
        
    };

    Slider.DEFAULTS = {
        itemSelector: '.topic-gallery-item',
        iconSelector: '.topic-gallery-icons',
        startIndex: 0,
        iconCurClass: 'cur',
        isShowIcon:true,
        onItemClick: function () {},
        onAfterChange: function () {}
    };

    Slider.prototype.move = function(i){
        var me = this
            , $iconContainer = this.iconContainer
            , params = me.params;

        setTimeout(function () {
            $iconContainer.find('i')
                .eq(i)
                .addClass(params.iconCurClass)
                .siblings('i')
                .removeClass(params.iconCurClass);
            params.onAfterChange(i);
        }, 200);
    }

    Slider.prototype.getDefaults = function(){
        return Slider.DEFAULTS;
    }
    

    Slider.prototype.init = function(type){
        var me = this
            , i
            , $this = this.element
            , selector = me.selector
            , $iconContainer = this.iconContainer
            , len = i = me.len;


        while (me.params.isShowIcon && i--) {
            $iconContainer.append('<i></i>');
        }

        $iconContainer.find('i')
            .eq(me.params.startIndex)
            .addClass(me.params.iconCurClass);

        if (len > 1) {
            $this.on('touchstart', selector, $.proxy(me.touchstart, me))
            .on('touchmove', selector, $.proxy(me.touchmove, me))
            .on('touchend', selector, $.proxy(me.touchend, me));
        } else {
            $this.on('click', selector, $.proxy(me.itemClick, me));
        }
        
    };

    Slider.prototype.touchstart = function(e){
        var me = this;
        me.startX = me.lastX = e.touches && e.touches[0].clientX;
        me.startY = e.touches && e.touches[0].clientY;    
        me.curX = -me.listW * me.curIndex;

        
        //e.preventDefault();
    }
    Slider.prototype.touchmove = function(e){
        var me = this;
        var clientX = e.changedTouches && e.changedTouches[0].clientX
            , x = clientX - me.lastX;

        if (Math.abs(clientX - me.startX) < 10) {
            return;
        }
        me.lastX = clientX;
        me.curX += x;
        

        //$list[0].style.webkitTransform = 'translateX(' + curX + 'px)';
        me.element.css({'-webkit-transform': 'translateX(' + me.curX + 'px)'})
        //e.preventDefault();
        if(x != 0){
            e.preventDefault();
        }
    }
    Slider.prototype.touchend = function(e){
        var me = this
            , curIndex = me.curIndex
            , len = me.len
            , x = e.changedTouches && e.changedTouches[0].clientX - me.startX
            , y = e.changedTouches && e.changedTouches[0].clientY - me.startY;

        if (x === 0 && y === 0) {
            me.itemClick(e);
            return;
        }
        if (x > 50 && curIndex !== 0) {
            me.curIndex = curIndex - 1;
            me.move(me.curIndex);
        }
        if (x < -50 && curIndex !== len - 1) {
            me.curIndex = curIndex + 1;
            me.move(me.curIndex);
        }
        
        var x = -me.listW * me.curIndex;
        me.timeout = setTimeout(function () {
            me.element.css({
                '-webkit-transform': 'translateX(' + x + 'px)',
                '-webkit-transition': '-webkit-transform 350ms cubic-bezier(0, 0, 0.25, 1)'
            });
        }, 0);
        
        //e.preventDefault();
    };
    Slider.prototype.itemClick = function(e){
        var me = this;
        me.params.onItemClick($(e.target).closest(me.selector));
        e.preventDefault();
    }
    
    /*
        reset slider 为初始化的状态。
    */
    Slider.prototype.reset = function(){
        
        var x, me = this;
        me.listW = me.element.width();
        x = -me.listW * me.curIndex;
        
        me.element.css({
            '-webkit-transform': 'translateX(' + x + 'px)'
        });
        
    }

    Slider.prototype.destroy = function(){
        clearTimeout(this.timeout)
        this.hide().$element.off('.' + this.type).removeData('bs.' + this.type)
    }

    var old = $.fn.topicSlider;

    $.fn.topicSlider = function ( option ) {
        
        return this.each(function () {
            
            var $this = $(this);
            var data  = $this.data('bs.slider');
            var options = typeof option == 'object' && option ;

            if (!data) $this.data('bs.slider', (data = new Slider(this, options)));
            if (typeof option == 'string') data[option]();
        })
    }

    $.fn.topicSlider.Constructor = Slider;


    $.fn.topicSlider.noConflict = function () {
        $.fn.topicSlider = old;
        return this;
    }


}(Zepto);


