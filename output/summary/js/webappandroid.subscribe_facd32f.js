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
