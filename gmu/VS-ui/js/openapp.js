/**
 * 适用于在web端打开native app的zepto 组件
 *
 * Examples:
 *
 *     $('a[data-app=baidu]').openapp({
 *         //options
 *     })
 *
 * @version 0.9.0
 * @author wlsy <i@wlsy.me || zhuangxiaoming@baidu.com>
 *
 */

(function($, win) {

    /**
     * Open App
     *
     * @param {Object} _opts 配置选项
     * @api publish
     */

    $.fn.openapp = function(_opts) {

        //规范约定所有native状态均保存在window.app下
        window.openapp = window.openapp || {};


        var cacheAppInfo;
        var opts;
        var fn = function() {};
        var self = this;
        var newOpenAppUri;

        var defaultOpts = {
            packageName: '',
            openAppUri: '',
            appInfo: '',
            lastestAppUri: 'http://m.baidu.com/open/inapp?lcid=miia&callback=?',
            checkSuccess: undefined,
            checkError: undefined,
            popupHeaderText: '',
            downloadedPopupHeaderText: '',
            undownloadPopupBodyText:'请下载最新版V{version}（安装包{size}）',
            downloadedPopupBodyText: '',
            buttonText: ['以后再说', '确定下载'],
            clickNext: fn,
            popupNext: fn,
            downloadNext: fn,
            cancelNext: fn,
            openAppNext: fn
        };

        /**
         * zepto jsonp 在 安卓4以下版本无法出发404请求的error callback
         */

        function jsonpy(o, d, f, a) {
            // random callback name in window scope
            var name = '__jsonp' + parseInt(Math.random() * 10000, 10),
            // url for request
                url = typeof o === 'string' ? o : o.url,
            // url parameter name containing callback name ('callback' usually)
                field = o.field || 'callback',
            // timeout for request (no timeout by default)
                timeout = o.timeout || false,
                timeoutId = null,

                script = document.createElement('script'),

            // execution status: null if not executed, 'done' or 'fail'
                status = null,
            // arguments for callbacks
                cbArgs = null,
            // callbacks collection
                callbacks = {
                    done: [],
                    fail: [],
                    always: []
                },

            // promise object returned by jsonpy
                promise = {
                    done: function(callback) {
                        callbacks.done.push(callback);
                        runCallbacks();

                        return promise;
                    },

                    fail: function(callback) {
                        callbacks.fail.push(callback);
                        runCallbacks();

                        return promise;
                    },

                    always: function(callback) {
                        callbacks.always.push(callback);
                        runCallbacks();

                        return promise;
                    }
                },

            // helper function, run all callbacks in array with given args
                runCallbacksFromArray = function(cbs, args) {
                    while (cb = cbs.shift()) {
                        cb.apply(this, args);
                    }
                },

            // run all callbacks for current status; called by promise methods and setStatus()
                runCallbacks = function() {
                    if (!status) return;

                    runCallbacksFromArray(callbacks[status], cbArgs);
                    runCallbacksFromArray(callbacks.always, cbArgs);
                },

            // set status to done or fail and set callback args
            // function may be called only once
                setStatus = function(success, args) {
                    if (status) return;

                    status = ['fail', 'done'][+success];
                    cbArgs = args;
                    runCallbacks();
                },



            // build url for request: simply add callback parameter to url
                buildUrl = function() {
                    return url + ['?', '&'][+(url.indexOf('?') >= 0)] + [encodeURIComponent(field), encodeURIComponent(name)].join('=');
                },

            // initialize jsonpy
                init = function() {
                    script.src = buildUrl();
                    script.async = true;

                    script.addEventListener('error', error, true);

                    if (o.done) promise.done(o.done);
                    if (o.fail) promise.fail(o.fail);
                    if (o.always) promise.always(o.always);

                    if (d) promise.done(d);
                    if (f) promise.fail(f);
                    if (a) promise.always(a);
                },

            // perform request
                connect = function() {
                    window[name] = success;
                    document.body.appendChild(script);
                    if (timeout) {
                        timeoutId = setTimeout(error, timeout);
                    }
                },

            // close connection and cleanup
                close = function() {
                    if (status) return;

                    delete window[name];
                    document.body.removeChild(script);

                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                },

            // called on request success
                success = function() {
                    if (status) return;
                    close();
                    setStatus(true, arguments);
                },

            // called on request error or timeout (if exists)
                error = function() {
                    if (status) return;
                    close();
                    setStatus(false, arguments);
                };


            init();
            connect();


            return promise;
        }

        /**
         * 渲染弹出框
         *
         * @param {Object} options 组件配置选项
         * @param {Object} data 异步请求app最新版本的数据
         */

        function popupRender(options, data) {

            var view = {
                mask: $('<div id="J_OpenAppMask"/>').css({
                    width: '100%',
                    height: Math.max($(window).height() ,$('html').height()),
                    background: 'rgba(0,0,0,.5)',
                    display: 'block',
                    position: 'absolute',
                    visibility: 'visible',
                    zIndex: 1000,
                    top: 0,
                    left: 0
                }),
                popup: {
                    container: $('<div id="J_OpenAppPopup"/>').css({
                        position: 'absolute',
                        display: 'block',
                        visibility: 'visible',
                        top: '50%',
                        left: '50%',
                        marginLeft: -145,
                        marginTop: -100 + window.scrollY,
                        border: '1px solid #eee',
                        width: 290,
                        zIndex: 1009,
                        fontSize: 15,
                        borderRadius: 2,
                        background: '#fff'
                    }),
                    downloaded: '<p style="font-size: 16px; font-weight: bold; padding:18px 0;text-align:center;color:#2A8DE8">' + options.downloadedPopupHeaderText + '</p><p style="padding:0 20px; font-size: 16px;font-family: bold;text-align:left;">' + options.downloadedPopupBodyText + '</p><div style="margin-top: 32px; border-top: 1px solid rgb(211, 211, 211); line-height: 40px;"><a id="J_OpenAppCancel" href="#" style="display: inline-block; height: 40px; width: 142px; text-decoration: initial; color: rgb(136, 136, 136); text-align: center;font-size:15px;">' + options.buttonText[0] + '</a><a id="J_OpenAppOk" href="{download}" style="display: inline-block; height: 40px; width: 143px; text-align: center; border-left: 1px solid rgb(211, 211, 211); text-decoration: initial; color: #2A8DE8;font-size:15px;">' + options.buttonText[1] + '</a></div>',
                    undownload: '<p style="font-size: 16px; font-weight: bold; padding:18px 0;text-align:center;color:#2A8DE8">' + options.popupHeaderText + '</p><p style="padding:0 20px; color: #555;text-align:left;">'+options.undownloadPopupBodyText+'</p><div style="margin-top: 32px; border-top: 1px solid rgb(211, 211, 211); line-height: 40px;"><a id="J_OpenAppCancel" href="#" style="display: inline-block; height: 40px; width: 142px; text-decoration: initial; color: rgb(136, 136, 136); text-align: center; font-size:15px;">' + options.buttonText[0] + '</a><a id="J_OpenAppOk" href="{download}" style="display: inline-block; height: 40px; width: 143px; text-align: center; border-left: 1px solid rgb(211, 211, 211); text-decoration: initial; color: #2A8DE8;font-size:15px;">' + options.buttonText[1] + '</a></div>',
                    render: function(data) {
                        var content = (localStorage && localStorage[opts.packageName] && localStorage[opts.packageName] === '1') ? this.downloaded : this.undownload;

                        var html = content.
                            replace(/\{version\}/, data.result.version).
                            replace(/\{size\}/, data.result.size).
                            replace(/\{download\}/, data.result.download);

                        this.container.html(html);
                        return this.container;
                    }
                }

            };

            $('#J_OpenAppMask').length ? $('#J_OpenAppMask').show() : $('body').append(view.mask);
            $('body').append(view.popup.render(data));

        }


        /**
         * 隐藏弹框和遮罩层
         *
         * @api private
         */
        function hideAll() {
            $('#J_OpenAppMask').hide();
            $('#J_OpenAppPopup').remove();
        }

        /**
         * 检查最新版本的app包信息
         *
         * @param {Function} next 执行成功回调
         * @api private
         */

        function lastestApp(next) {
            if (opts.appInfo) {
                appInfo = {result: opts.appInfo};
                return next.call(null, appInfo);
            }

            if (!cacheAppInfo) {
                $.ajaxJSONP({
                    url: opts.lastestAppUri + '&getapp=' + opts.packageName,
                    success: function(data) {
                        cacheAppInfo = data;
                        next.call(null, cacheAppInfo);
                    },
                    complete: function() {}
                });
            } else {
                next.call(null, cacheAppInfo);
            }
        }

        /**
         * 检查app是否安装
         *
         * @param {Function} sfn 请求成功的回调函数
         * @param {Function} efn 请求失败的回调函数
         * @api private
         */
        function checkApp(sfn, efn) {

            //使用中间传值 避免多次重复请求请求检查
            // 1 => 正在检查
            // 2 => 已经安装
            // 0 => 没有安装
            win.openapp[opts.packageName] = 1;

            jsonpy({
                url: newOpenAppUri,
                timeout: 2000,
                done: function(data) {
                    if (data.error === 0) {
                        win.openapp[opts.packageName] = 2;
                        sfn();
                    } else {
                        win.openapp[opts.packageName] = 0;
                        efn();
                    }
                },
                fail: function() {
                    win.openapp[opts.packageName] = 0;
                    efn();
                },
                always: function() {}
            });
        }

        /**
         * 显示顶部提示框,并附带性感箭头动画
         *
         * @api private
         */

        function downloadTipRender() {
            var timer;

            var container = $('<div id="J_OpenAppTip"/>').css({
                height: 40,
                width: $(window).width() - 16,
                background: 'rgba(0,0,0,.9)',
                border: '1px solid #1a1a1a',
                borderRadius: 2,
                boxShadow: '0 0 2px #d1d1d1',
                position: 'fixed',
                lineHeight: '40px',
                color: '#fff',
                margin: '8px',
                zIndex: 12,
                textAlign: 'center',
                top: 0,
                left: 0
            }).html('<img style="-webkit-animation: openapp 2 linear 1s;" width="14" height="14" src="http://m.baidu.com/static/search/inapp/openappdownload.png" />从顶部下拉，查看下载进度并安装');

            //动画 keyframes
            if (!$('#J_OpenAppKeyFrames').length) {
                $('head').append('<style id="J_OpenAppKeyFrames"> @-webkit-keyframes openapp{ 0% { -webkit-transform: translate(0,0) } 25% { -webkit-transform: translate(0,4px) } 75% { -webkit-transform: translate(0,-4px) } 100% { -webkit-transform: translate(0,0);}} </style>');
            }

            $('#J_OpenAppTip').length ? $('#J_OpenAppTip').show() : $('body').append(container);

            timer = setTimeout(function() {
                $('#J_OpenAppTip').hide();
            }, 3000);

            // 在本地存储中存储下载状态
            // 1 => 已经下载过了
            window.localStorage[opts.packageName] = 1;

        }

        //交互处理
        $('body').on('click', self.selector, function(ev) {
            ev.preventDefault();
            var me = this;
            var timestamp = +new Date();

            //maybe a dynamic param
            var funp = 'packageName openAppUri popupHeaderText';

            opts = $.extend(defaultOpts, _opts || {});

            $.each(opts, function(key, value) {
                if (funp.indexOf(key) !== -1 && $.isFunction(value)) {
                    opts[key] = value(me);
                }
            });

            newOpenAppUri = 'http://127.0.0.1:6259/sendintent?intent=' + window.encodeURIComponent(opts.openAppUri) + '&t=' + timestamp;

            opts.checkSuccess = opts.checkSuccess ||
                function() {
                    opts.openAppNext.call(null, me);

                };

            opts.checkError = opts.checkError ||
                function() {
                    //检查app并显示弹框
                    lastestApp(function(data) {
                        popupRender(opts, data);
                        opts.popupNext.call(null, me);

                        $('#J_OpenAppCancel').on('click', function(ev) {
                            ev.preventDefault();
                            hideAll();
                            opts.cancelNext.call(null, me);
                        });

                        $('#J_OpenAppOk').on('click', function(ev) {
                            downloadTipRender();
                            ev.preventDefault();
                            hideAll();
                            opts.downloadNext.call(null, me);
                            var self = this;
//                            setTimeout(function() {
//                                window.location.href = self.href;
//                            }, 10);
                        });
                    });

                };

            checkApp(opts.checkSuccess, opts.checkError);

            opts.clickNext.call(null, me);
        });
    };
}(Zepto, window));