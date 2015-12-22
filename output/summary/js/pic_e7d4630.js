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


