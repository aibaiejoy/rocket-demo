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
