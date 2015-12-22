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
