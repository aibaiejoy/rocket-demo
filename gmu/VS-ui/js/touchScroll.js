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
