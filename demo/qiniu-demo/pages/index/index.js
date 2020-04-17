const qiniuUploader = require("../../utils/qiniuUploader");
// index.js

// 初始化七牛云相关配置
function initQiniu() {
  var options = {
    // bucket所在区域，这里是华北区。ECN, SCN, NCN, NA, ASG，分别对应七牛云的：华东，华南，华北，北美，新加坡 5 个区域
    region: 'NCN',

    // 获取uptoken方法三选一即可，执行优先级为：uptoken > uptokenURL > uptokenFunc。三选一，剩下两个置空。推荐使用uptokenURL，详情请见 README.md
    // 由其他程序生成七牛 uptoken
    uptoken: '',
    // 从指定 url 通过 HTTP GET 获取 uptoken，返回的格式必须是 json 且包含 uptoken 字段，例如： {"uptoken": "0MLvWPnyy..."}
    uptokenURL: 'https://[yourserver.com]/api/uptoken',
    // uptokenFunc 这个属性的值可以是一个用来生成uptoken的函数，详情请见 README.md
    uptokenFunc: function () { },

    // bucket 外链域名，下载资源时用到。如果设置，会在 success callback 的 res 参数加上可以直接使用的 fileUrl 字段。否则需要自己拼接
    domain: 'http://[yourBucketId].bkt.clouddn.com',
    // 如果是 true，则文件的 key 由 qiniu 服务器分配 (全局去重)。如果是 false，则文件的 key 使用微信自动生成的 filename。默认是 true。建议使用true，微信自动生成的filename杂乱且长
    shouldUseQiniuFileName: true
  };
  // 将七牛云相关配置初始化进本sdk
  qiniuUploader.init(options);
}

//获取应用实例
var app = getApp()
Page({
  data: {
    // 上传图片完成后，此属性被赋值
    imageObject: {},
    // 上传视频完成后，此属性被赋值
    videoObject: {},
    // 上传文件完成后，此属性被赋值
    messageFileObject: {},
    // 此属性在qiniuUploader.upload()中被赋值，用于中断上传
    cancelTask: function () { }
  },
  //事件处理函数
  onLoad: function () {
    console.log('onLoad')
    var that = this;
  },
  // 图片上传方法
  didPressChooesImage: function () {
    var that = this;
    didPressChooesImage(that);
  },
  // 文件上传方法，支持PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式
  didPressChooesMessageFile: function () {
    var that = this;
    didPressChooesMessageFile(that);
  },
  // 中断上传方法
  didCancelTask: function () {
    this.data.cancelTask();
  }
});

// 图片上传方法
function didPressChooesImage(that) {
  // 初始化七牛云配置
  initQiniu();
  // 微信 API 选择图片
  wx.chooseImage({
    count: 1,
    success: function (res) {
      var filePath = res.tempFilePaths[0];
      // 向七牛云上传
      qiniuUploader.upload(filePath, (res) => {
        that.setData({
          'imageObject': res
        });
        console.log('file url is: ' + res.fileUrl)
      }, (error) => {
        console.error('error: ' + JSON.stringify(error));
      },
      // 此项为qiniuUploader.upload的第四个参数options。若想在单个方法中变更七牛云相关配置，可以使用上述参数。如果不需要在单个方法中变更七牛云相关配置，则可使用 null 作为参数占位符。推荐填写initQiniu()中的七牛云相关参数，然后此处使用null做占位符。
      // {
      //   region: 'NCN', // 华北区
      //   uptokenURL: 'https://[yourserver.com]/api/uptoken',
      //   domain: 'http://[yourBucketId].bkt.clouddn.com',
      //   shouldUseQiniuFileName: false,
      //   key: 'testKeyNameLSAKDKASJDHKAS',
      //   uptokenURL: 'myServer.com/api/uptoken'
      // },
      null,
      (progress) => {
        console.log('上传进度', progress.progress)
        console.log('已经上传的数据长度', progress.totalBytesSent)
        console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend)
      }, cancelTask => that.setData({ cancelTask })
      );
    }
  })
}

// 视频上传方法
function didPressChooesVideo() {
  // 初始化七牛云相关参数
  initQiniu();
  // 微信 API 选择文件
  wx.chooseMessageFile({
    count: 1,
    type: 'video',
    success: function (res) {
      var filePath = res.tempFiles[0].path;
      // 向七牛云上传
      qiniuUploader.upload(filePath, (res) => {
        that.setData({
          'videoObject': res
        });
        console.log('file url is: ' + res.fileUrl)
      }, (error) => {
        console.error('error: ' + JSON.stringify(error));
      },
      // 此项为qiniuUploader.upload的第四个参数options。若想在单个方法中变更七牛云相关配置，可以使用上述参数。如果不需要在单个方法中变更七牛云相关配置，则可使用 null 作为参数占位符。推荐填写initQiniu()中的七牛云相关参数，然后此处使用null做占位符。
      // {
      //   region: 'NCN', // 华北区
      //   uptokenURL: 'https://[yourserver.com]/api/uptoken',
      //   domain: 'http://[yourBucketId].bkt.clouddn.com',
      //   shouldUseQiniuFileName: false,
      //   key: 'testKeyNameLSAKDKASJDHKAS',
      //   uptokenURL: 'myServer.com/api/uptoken'
      // },
      null,
      (progress) => {
        console.log('上传进度', progress.progress)
        console.log('已经上传的数据长度', progress.totalBytesSent)
        console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend)
      }, cancelTask => that.setData({ cancelTask })
      );
    }
  })
}

// 文件上传方法，支持PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式
function didPressChooesMessageFile(that) {
  // 初始化七牛云相关参数
  initQiniu();
  // 微信 API 选择文件
  wx.chooseMessageFile({
    count: 1,
    type: 'file',
    success: function (res) {
      var filePath = res.tempFiles[0].path;
      // 向七牛云上传
      qiniuUploader.upload(filePath, (res) => {
        that.setData({
          'messageFileObject': res
        });
        console.log('file url is: ' + res.fileUrl)
      }, (error) => {
        console.error('error: ' + JSON.stringify(error));
      },
      // 此项为qiniuUploader.upload的第四个参数options。若想在单个方法中变更七牛云相关配置，可以使用上述参数。如果不需要在单个方法中变更七牛云相关配置，则可使用 null 作为参数占位符。推荐填写initQiniu()中的七牛云相关参数，然后此处使用null做占位符。
      // {
      //   region: 'NCN', // 华北区
      //   uptokenURL: 'https://[yourserver.com]/api/uptoken',
      //   domain: 'http://[yourBucketId].bkt.clouddn.com',
      //   shouldUseQiniuFileName: false,
      //   key: 'testKeyNameLSAKDKASJDHKAS',
      //   uptokenURL: 'myServer.com/api/uptoken'
      // },
      null,
      (progress) => {
        console.log('上传进度', progress.progress)
        console.log('已经上传的数据长度', progress.totalBytesSent)
        console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend)
      }, cancelTask => that.setData({ cancelTask })
      );
    }
  })
}