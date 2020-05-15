(function () {
    // 请参考demo的index.js中的initQiniu()方法，若在使用处对options进行了赋值，则此处config不需要赋默认值。init(options) 即updateConfigWithOptions(options)，会对config进行赋值
    var config = {
        // bucket 所在区域。ECN, SCN, NCN, NA, ASG，分别对应七牛云的：华东，华南，华北，北美，新加坡 5 个区域
        qiniuRegion: '',
        // 七牛云bucket 外链前缀，外链在下载资源时用到
        qiniuBucketURLPrefix: '',

        // 获取uptoken方法三选一即可，执行优先级为：uptoken > uptokenURL > uptokenFunc。三选一，剩下两个置空。推荐使用uptokenURL，详情请见 README.md
        // 由其他程序生成七牛云uptoken，然后直接写入uptoken
        qiniuUploadToken: '',
        // 从指定 url 通过 HTTP GET 获取 uptoken，返回的格式必须是 json 且包含 uptoken 字段，例如： {"uptoken": "0MLvWPnyy..."}
        qiniuUploadTokenURL: '',
        // uptokenFunc 这个属性的值可以是一个用来生成uptoken的函数，详情请见 README.md
        qiniuUploadTokenFunction: function () { },

        // qiniuShouldUseQiniuFileName 如果是 true，则文件的 key 由 qiniu 服务器分配（全局去重）。如果是 false，则文件的 key 使用微信自动生成的 filename。出于初代sdk用户升级后兼容问题的考虑，默认是 false。
        // 微信自动生成的 filename较长，导致fileURL较长。推荐使用{qiniuShouldUseQiniuFileName: true} + "通过fileURL下载文件时，自定义下载名" 的组合方式。
        // 自定义上传key 需要两个条件：1. 此处shouldUseQiniuFileName值为false。 2. 通过修改qiniuUploader.upload方法传入的options参数，可以进行自定义key。（请不要直接在sdk中修改options参数，修改方法请见demo的index.js）
        // 通过fileURL下载文件时，自定义下载名，请参考：七牛云“对象存储 > 产品手册 > 下载资源 > 下载设置 > 自定义资源下载名”（https://developer.qiniu.com/kodo/manual/1659/download-setting）。本sdk在README.md的"常见问题"板块中，有"通过fileURL下载文件时，自定义下载名"使用样例。
        qiniuShouldUseQiniuFileName: false
    }

    // init(options) 将七牛云相关配置初始化进本sdk
    // 在整个程序生命周期中，只需要 init(options); 一次即可
    // 如果需要变更七牛云配置，再次调用 init(options); 即可
    function init(options) {
        updateConfigWithOptions(options);
    }

    // 更新七牛云配置
    function updateConfigWithOptions(options) {
        if (options.region) {
            config.qiniuRegion = options.region;
        } else {
            console.error('qiniu uploader need your bucket region');
        }
        if (options.uptoken) {
            config.qiniuUploadToken = options.uptoken;
        } else if (options.uptokenURL) {
            config.qiniuUploadTokenURL = options.uptokenURL;
        } else if (options.uptokenFunc) {
            config.qiniuUploadTokenFunction = options.uptokenFunc;
        }
        if (options.domain) {
            config.qiniuBucketURLPrefix = options.domain;
        }
        config.qiniuShouldUseQiniuFileName = options.shouldUseQiniuFileName
    }

    // 正式上传的前置方法，做预处理，应用七牛云配置
    function upload(filePath, success, fail, options, progress, cancelTask) {
        if (null == filePath) {
            console.error('qiniu uploader need filePath to upload');
            return;
        }
        if (options) {
            updateConfigWithOptions(options);
        }
        if (config.qiniuUploadToken) {
            doUpload(filePath, success, fail, options, progress, cancelTask);
        } else if (config.qiniuUploadTokenURL) {
            getQiniuToken(function () {
                doUpload(filePath, success, fail, options, progress, cancelTask);
            });
        } else if (config.qiniuUploadTokenFunction) {
            config.qiniuUploadToken = config.qiniuUploadTokenFunction();
            if (null == config.qiniuUploadToken && config.qiniuUploadToken.length > 0) {
                console.error('qiniu UploadTokenFunction result is null, please check the return value');
                return
            }
            doUpload(filePath, success, fail, options, progress, cancelTask);
        } else {
            console.error('qiniu uploader need one of [uptoken, uptokenURL, uptokenFunc]');
            return;
        }
    }

    // 正式上传
    function doUpload(filePath, success, fail, options, progress, cancelTask) {
        if (null == config.qiniuUploadToken && config.qiniuUploadToken.length > 0) {
            console.error('qiniu UploadToken is null, please check the init config or networking');
            return
        }
        var url = uploadURLFromRegionCode(config.qiniuRegion);
        var fileName = filePath.split('//')[1];
        // 自定义上传key（即自定义上传文件名）。通过修改qiniuUploader.upload方法传入的options参数，可以进行自定义文件名称。如果options非空，则使用options中的key作为fileName
        if (options && options.key) {
            fileName = options.key;
        }
        var formData = {
            'token': config.qiniuUploadToken
        };
        // qiniuShouldUseQiniuFileName 如果是 true，则文件的 key 由 qiniu 服务器分配（全局去重）。如果是 false，则文件的 key 使用微信自动生成的 filename。出于初代sdk用户升级后兼容问题的考虑，默认是 false。
        if (!config.qiniuShouldUseQiniuFileName) {
            formData['key'] = fileName
        }
        var uploadTask = wx.uploadFile({
            url: url,
            filePath: filePath,
            name: 'file',
            formData: formData,
            success: function (res) {
                var dataString = res.data
                //   // this if case is a compatibility with wechat server returned a charcode, but was fixed
                //   if(res.data.hasOwnProperty('type') && res.data.type === 'Buffer'){
                //     dataString = String.fromCharCode.apply(null, res.data.data)
                //   }
                try {
                    var dataObject = JSON.parse(dataString);
                    // 拼接fileURL
                    var fileURL = config.qiniuBucketURLPrefix + '/' + dataObject.key;
                    dataObject.fileURL = fileURL;
                    // imageURL字段和fileURL字段重复，但本sdk不做删除，因为在最初版本使用的是imageURL。直接删除可能导致原有用户升级至新版sdk后出现异常。
                    dataObject.imageURL = fileURL;
                    console.log(dataObject);
                    if (success) {
                        success(dataObject);
                    }
                } catch (e) {
                    console.log('parse JSON failed, origin String is: ' + dataString)
                    if (fail) {
                        fail(e);
                    }
                }
            },
            fail: function (error) {
                console.error(error);
                if (fail) {
                    fail(error);
                }
            }
        })

        // 文件上传进度
        uploadTask.onProgressUpdate((res) => {
            progress && progress(res)
        })

        // 中断文件上传
        cancelTask && cancelTask(() => {
            uploadTask.abort()
        })
    }

    // 获取七牛云uptoken, url为后端服务器获取七牛云uptoken接口
    function getQiniuToken(callback) {
        wx.request({
            url: config.qiniuUploadTokenURL,
            success: function (res) {
                var token = res.data.uptoken;
                if (token && token.length > 0) {
                    config.qiniuUploadToken = token;
                    if (callback) {
                        callback();
                    }
                } else {
                    console.error('qiniuUploader cannot get your token, please check the uptokenURL or server')
                }
            },
            fail: function (error) {
                console.error('qiniu UploadToken is null, please check the init config or networking: ' + error);
            }
        })
    }

    // 选择七牛云文件上传接口，文件向匹配的接口中传输。ECN, SCN, NCN, NA, ASG，分别对应七牛云的：华东，华南，华北，北美，新加坡 5 个区域
    function uploadURLFromRegionCode(code) {
        var uploadURL = null;
        switch (code) {
            case 'ECN': uploadURL = 'https://up.qiniup.com'; break;
            case 'NCN': uploadURL = 'https://up-z1.qiniup.com'; break;
            case 'SCN': uploadURL = 'https://up-z2.qiniup.com'; break;
            case 'NA': uploadURL = 'https://up-na0.qiniup.com'; break;
            case 'ASG': uploadURL = 'https://up-as0.qiniup.com'; break;
            default: console.error('please make the region is with one of [ECN, SCN, NCN, NA, ASG]');
        }
        return uploadURL;
    }

    module.exports = {
        init: init,
        upload: upload,
    }
})();
