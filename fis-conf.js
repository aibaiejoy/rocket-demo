fis.config.merge({
    roadmap : {
        path : [
            {
                reg : /^\/.+-aio.*\.css$/i,
                release : "/static/news/other/summary$&"
            },
            {
                reg : /^\/.+-aio.*\.js$/i,
                release : "/static/news/other/summary$&"
            },
            // GMU-ui, VS-ui涉及的图片均inline进来
            {
                reg : /^\/summary\/.+\.(png|gif|jpg|jpeg)$/i,
                release : "/static/news/other/summary$&"
            },
            {
                reg : /summary\.html$/i,
                release : '/template/summary/summary.html'
            }
        ]

        // , domain: {
        //     '**.js': 'http://m.baidu.com'
        //     ,'**.css': 'http://m.baidu.com'
        //     ,'**.png': 'http://m.baidu.com'
        //     ,'**.gif': 'http://m.baidu.com'
        //     ,'**.jpg': 'http://m.baidu.com'
        //     ,'**.jpeg': 'http://m.baidu.com'
        // }
    }
});

fis.config.merge({
    settings : { 
        optimizer : { 
            'uglify-js' : { 
                output : { 
                    /* inline js，单行过长，可能导致smarty解析失败，所以设置最大行大小 */
                    max_line_len : 500 
                }   
            }   

            , 'clean-css' : { 
                keepBreaks : true
            }   
        }   
    }   
});
fis.config.set('modules.parser', {
    //less后缀的文件使用fis-parser-less插件编译
    //处理器支持数组，或者逗号分隔的字符串配置
    less : ['less'],
});
//fis-conf.js
fis.config.set('roadmap.ext', {
    //less后缀的文件将输出为css后缀
    //并且在parser之后的其他处理流程中被当做css文件处理
    less : 'css',
    
});

fis.config.del('modules.optimizer.html');

