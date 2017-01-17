const qiniuUploader = require("../../utils/qiniuUploader");
//index.js

// 初始化七牛相关参数
function initQiniu() {
  var options = {
    region: 'NCN', // 华北区
    uptokenURL: 'https://yourserver.com/api/uptoken',
    // uptoken: 'xxxx',
    domain: 'http://owzs78.bkt.clouddn.com/'
  };
  qiniuUploader.init(options);
}

//获取应用实例
var app = getApp()
Page({
  data: {
    imageObject: {}
  },
  //事件处理函数
  onLoad: function () {
    console.log('onLoad')
    var that = this;
  },
  didPressChooesImage: function() {
    var that = this;
    didPressChooesImage(that);
  }
});

function didPressChooesImage(that) {
  initQiniu();
  // 微信 API 选文件
  wx.chooseImage({
      count: 1,
      success: function (res) {
        var filePath = res.tempFilePaths[0];
        // 交给七牛上传
        qiniuUploader.upload(filePath, (res) => {
          that.setData({
            'imageObject': res
          });
        }, (error) => {
          console.error('error: ' + JSON.stringify(error));
        });
      }
    }
    // , {
    //   region: 'ECN',
    //   domain: 'balxqjka.btk.clouddn.com',
    //   uptokenURL: 'myServer.cpm/api/uptoken'
    // }
    )
}