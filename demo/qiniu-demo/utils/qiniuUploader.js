// created by gpake
(function() {

var config = {
    qiniuUploadURL: '',
    qiniuImageURLPrefix: '',
    qiniuUploadToken: '',
    qiniuUploadTokenURL: ''
}

module.exports = {
    init: init,
    upload: upload,
}

// 在整个程序生命周期中，只需要 init 一次即可
// 如果需要变更参数，再调用 init 即可
function init(options) {
    if (options.uploadURL) {
        config.qiniuUploadURL = options.uploadURL;
    } else {
        console.error('qiniu uploader need uploadURL');
    }
    if (options.uptoken) {
        config.qiniuUploadToken = options.uptoken;
    } else if (options.uptokenURL) {
        config.qiniuUploadTokenURL = options.uptokenURL;
    } else {
        console.error('qiniu uploader need uptoken or uptokenURL');
        return;
    }
    if (options.domain) {
        config.qiniuImageURLPrefix = options.domain;
    }
}

function upload(filePath, success, fail, options) {
    if (options) {
        init(options);
    }
    if (!config.qiniuUploadToken) {
        getQiniuToken(function() {
            doUpload(filePath, success, fail);
        });
    } else {
        doUpload(filePath, success, fail);
    }
}

function doUpload(filePath, success, fail) {
    var url = config.qiniuUploadURL;
    var fileName = filePath.split('//')[1];
    var formData = {
        'token': config.qiniuUploadToken,
        'key': fileName
    };
    wx.uploadFile({
        url: url,
        filePath: filePath,
        name: 'file',
        formData: formData,
        success: function (res) {
            var dataString = res.data
            var dataObject = JSON.parse(dataString);
            //do something
            var imageUrl = config.qiniuImageURLPrefix + dataObject.key;
            dataObject.imageURL = imageUrl;
            console.log(dataObject);
            success(dataObject);
        },
        fail: function (error) {
            console.log(error);
            fail(error);
        }
    })
}

function getQiniuToken(callback) {
  wx.request({
    url: config.qiniuUploadTokenURL,
    success: function (res) {
      var token = res.data.data.uptoken;
      config.qiniuUploadToken = token;
      if (callback) {
          callback();
      }
    },
    fail: function (error) {
      console.log(error);
    }
  })
}

})();