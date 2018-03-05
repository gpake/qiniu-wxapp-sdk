// created by gpake
(function() {

var config = {
    qiniuRegion: '',
    qiniuImageURLPrefix: '',
    qiniuUploadToken: '',
    qiniuUploadTokenURL: '',
    qiniuUploadTokenFunction: null,
    qiniuShouldUseQiniuFileName: false
}

module.exports = {
    init: init,
    upload: upload,
}

// 在整个程序生命周期中，只需要 init 一次即可
// 如果需要变更参数，再调用 init 即可
function init(options) {
    config = {
        qiniuRegion: '',
        qiniuImageURLPrefix: '',
        qiniuUploadToken: '',
        qiniuUploadTokenURL: '',
        qiniuUploadTokenFunction: null,
        qiniuShouldUseQiniuFileName: false
    };
    updateConfigWithOptions(options);
}

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
    } else if(options.uptokenFunc) {
        config.qiniuUploadTokenFunction = options.uptokenFunc;
    }
    if (options.domain) {
        config.qiniuImageURLPrefix = options.domain;
    }
    config.qiniuShouldUseQiniuFileName = options.shouldUseQiniuFileName
}

function upload(parameter) {
    if (parameter.filePath == null) {
      console.error('qiniu uploader need filePath to upload')
      return
    }
    if (parameter.options) {
      updateConfigWithOptions(parameter.options)
    }
    if (config.qiniuUploadToken) {
      doUpload(parameter)
    } else if (config.qiniuUploadTokenURL) {
      getQiniuToken(function () {
        doUpload(parameter)
      })
    } else if (config.qiniuUploadTokenFunction) {
      config.qiniuUploadToken = config.qiniuUploadTokenFunction()
      if (config.qiniuUploadToken == null && config.qiniuUploadToken.length > 0) {
        console.error('qiniu UploadTokenFunction result is null, please check the return value')
        return
      }
      doUpload(parameter)
    } else {
      console.error('qiniu uploader need one of [uptoken, uptokenURL, uptokenFunc]')
      return null
    }
  }

function doUpload(parameter) {
    if (config.qiniuUploadToken == null && config.qiniuUploadToken.length > 0) {
      console.error('qiniu UploadToken is null, please check the init config or networking')
      return
    }
    var url = uploadURLFromRegionCode(config.qiniuRegion)
    var fileName = parameter.filePath.split('//')[1]
    if (parameter.options && parameter.options.key) {
      fileName = parameter.options.key
    }
    var formData = {
      'token': config.qiniuUploadToken
    }
    if (!config.qiniuShouldUseQiniuFileName) {
      formData['key'] = fileName
    }
    const uploadTask = wx.uploadFile({
      url: url,
      filePath: parameter.filePath,
      name: 'file',
      formData: formData,
      success: (res) => {
        var dataString = res.data
        try {
          var dataObject = JSON.parse(dataString)
          //do something
          var imageUrl = config.qiniuImageURLPrefix + '/' + dataObject.key
          dataObject.imageURL = imageUrl
          parameter.success && parameter.success(dataObject)
        } catch (e) {
          console.log('parse JSON failed, origin String is: ' + dataString)
          parameter.fail && parameter.fail(e)
        }
      },
      fail: (error) => {
        parameter.fail && parameter.fail(error)
      }
    })

    uploadTask.onProgressUpdate((res) => {
        console.log('上传进度', res.progress)
        console.log('已经上传的数据长度', res.totalBytesSent)
        console.log('预期需要上传的数据总长度', res.totalBytesExpectedToSend)
        parameter.progress && parameter.progress(res)
    })
  }

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

function uploadURLFromRegionCode(code) {
    var uploadURL = null;
    switch(code) {
        case 'ECN': uploadURL = 'https://up.qbox.me'; break;
        case 'NCN': uploadURL = 'https://up-z1.qbox.me'; break;
        case 'SCN': uploadURL = 'https://up-z2.qbox.me'; break;
        case 'NA': uploadURL = 'https://up-na0.qbox.me'; break;
        default: console.error('please make the region is with one of [ECN, SCN, NCN, NA]');
    }
    return uploadURL;
}

})();
