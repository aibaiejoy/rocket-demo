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
