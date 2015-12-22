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
