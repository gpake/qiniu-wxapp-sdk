const qiniuUploader = require("../../utils/qiniuUploader");
// index.js

// 初始化七牛云相关配置
function initQiniu() {
    var options = {
        // bucket所在区域，这里是华北区。ECN, SCN, NCN, NA, ASG，分别对应七牛云的：华东，华南，华北，北美，新加坡 5 个区域
        region: 'NCN',

        // 获取uptoken方法三选一即可，执行优先级为：uptoken > uptokenURL > uptokenFunc。三选一，剩下两个置空。推荐使用uptokenURL，详情请见 README.md
        // 由其他程序生成七牛云uptoken，然后直接写入uptoken
        uptoken: '',
        // 从指定 url 通过 HTTP GET 获取 uptoken，返回的格式必须是 json 且包含 uptoken 字段，例如： {"uptoken": "0MLvWPnyy..."}
        uptokenURL: 'https://[yourserver.com]/api/uptoken',
        // uptokenFunc 这个属性的值可以是一个用来生成uptoken的函数，详情请见 README.md
        uptokenFunc: function () { },

        // bucket 外链域名，下载资源时用到。如果设置，会在 success callback 的 res 参数加上可以直接使用的 fileURL 字段。否则需要自己拼接
        domain: 'http://[yourBucketId].bkt.clouddn.com',
        // qiniuShouldUseQiniuFileName 如果是 true，则文件的 key 由 qiniu 服务器分配（全局去重）。如果是 false，则文件的 key 使用微信自动生成的 filename。出于初代sdk用户升级后兼容问题的考虑，默认是 false。
        // 微信自动生成的 filename较长，导致fileURL较长。推荐使用{qiniuShouldUseQiniuFileName: true} + "通过fileURL下载文件时，自定义下载名" 的组合方式。
        // 自定义上传key 需要两个条件：1. 此处shouldUseQiniuFileName值为false。 2. 通过修改qiniuUploader.upload方法传入的options参数，可以进行自定义key。（请不要直接在sdk中修改options参数，修改方法请见demo的index.js）
        // 通过fileURL下载文件时，自定义下载名，请参考：七牛云“对象存储 > 产品手册 > 下载资源 > 下载设置 > 自定义资源下载名”（https://developer.qiniu.com/kodo/manual/1659/download-setting）。本sdk在README.md的"常见问题"板块中，有"通过fileURL下载文件时，自定义下载名"使用样例。
        shouldUseQiniuFileName: false
    };
    // 将七牛云相关配置初始化进本sdk
    qiniuUploader.init(options);
}

//获取应用实例
var app = getApp()
Page({
    data: {
        // 图片上传（从相册）返回对象。上传完成后，此属性被赋值
        imageObject: {},
        // 文件上传（从客户端会话）返回对象。上传完成后，此属性被赋值
        messageFileObject: {},
        // 图片上传（从相册）进度对象。开始上传后，此属性被赋值
        imageProgress: {},
        // 文件上传（从客户端会话）进度对象。开始上传后，此属性被赋值
        messageFileProgress: {},
        // 文件在线查看来源fileUrl
        viewFileOnlineFileUrl: '',
        // 文件下载进度对象。用于文件在线查看前的预下载
        downloadFileProgress: {},
        // 此属性在qiniuUploader.upload()中被赋值，用于中断上传
        cancelTask: function () { }
    },
    //事件处理函数
    onLoad: function () {
        console.log('onLoad');
        var that = this;
    },
    // 图片上传（从相册）方法
    didPressChooesImage: function () {
        var that = this;
        didPressChooesImage(that);
    },
    // 文件上传（从客户端会话）方法，支持图片、视频、其余文件 (PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式)
    didPressChooesMessageFile: function () {
        var that = this;
        didPressChooesMessageFile(that);
    },
    // 在线查看文件的fileUrl输入框，输入完毕后点击确认
    didPressViewFileOnlineInputConfirm: function (event) {
        var that = this;
        didPressViewFileOnlineInputConfirm(that, event);
    },
    // 在线查看文件，支持的文件格式：pdf, doc, docx, xls, xlsx, ppt, pptx。关于wx.openDocument方法，详情请参考微信官方文档：https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.openDocument.html
    didPressViewFileOnline: function() {
        var that = this;
        didPressViewFileOnline(that);
    },
    // 中断上传方法
    didCancelTask: function () {
        this.data.cancelTask();
    }
});

// 图片上传（从相册）方法
function didPressChooesImage(that) {
    // 初始化七牛云配置
    initQiniu();
    // 置空messageFileObject，否则在第二次上传过程中，wxml界面会存留上次上传的信息
    that.setData({
        'imageObject': {},
        'imageProgress': {}
    });
    // 微信 API 选择图片（从相册）
    wx.chooseImage({
        // 最多可以选择的图片张数。目前本sdk只支持单图上传，若选择多图，只会上传第一张图
        count: 1,
        success: function (res) {
            var filePath = res.tempFilePaths[0];
            // wx.chooseImage 目前微信官方尚未开放获取原图片名功能(2020.4.22)
            // 向七牛云上传
            qiniuUploader.upload(filePath, (res) => {
                that.setData({
                    'imageObject': res
                });
                console.log('提示: wx.chooseImage 目前微信官方尚未开放获取原图片名功能(2020.4.22)');
                console.log('file url is: ' + res.fileURL);
            }, (error) => {
                console.error('error: ' + JSON.stringify(error));
            },
            // 此项为qiniuUploader.upload的第四个参数options。若想在单个方法中变更七牛云相关配置，可以使用上述参数。如果不需要在单个方法中变更七牛云相关配置，则可使用 null 作为参数占位符。推荐填写initQiniu()中的七牛云相关参数，然后此处使用null做占位符。
            // 若想自定义上传key，请把自定义key写入此处options的key值。如果在使用自定义key后，其它七牛云配置参数想维持全局配置，请把此处options除key以外的属性值置空。
            // 启用options参数请记得删除null占位符
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
                that.setData({
                    'imageProgress': progress
                });
                console.log('上传进度', progress.progress);
                console.log('已经上传的数据长度', progress.totalBytesSent);
                console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend);
            }, cancelTask => that.setData({ cancelTask })
            );
        }
    })
}

// 文件上传（从客户端会话）方法，支持图片、视频、其余文件 (PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式)
function didPressChooesMessageFile(that) {
    // 初始化七牛云相关参数
    initQiniu();
    // 置空messageFileObject和messageFileProgress，否则在第二次上传过程中，wxml界面会存留上次上传的信息
    that.setData({
        'messageFileObject': {},
        'messageFileProgress': {}
    });
    // 微信 API 选择文件（从客户端会话）
    wx.chooseMessageFile({
        // 最多可以选择的文件个数。目前本sdk只支持单文件上传，若选择多文件，只会上传第一个文件
        count: 1,
        // type: 所选的文件的类型
        // type的值: {all: 从所有文件选择}, {video: 只能选择视频文件}, {image: 只能选择图片文件}, {file: 只能选择除了图片和视频之外的其它的文件}
        type: 'all',
        success: function (res) {
            var filePath = res.tempFiles[0].path;
            var fileName = res.tempFiles[0].name;
            // 向七牛云上传
            qiniuUploader.upload(filePath, (res) => {
                res.fileName = fileName;
                that.setData({
                    'messageFileObject': res
                });
                console.log('file name is: ' + fileName);
                console.log('file url is: ' + res.fileURL);
            }, (error) => {
                console.error('error: ' + JSON.stringify(error));
            },
            // 此项为qiniuUploader.upload的第四个参数options。若想在单个方法中变更七牛云相关配置，可以使用上述参数。如果不需要在单个方法中变更七牛云相关配置，则可使用 null 作为参数占位符。推荐填写initQiniu()中的七牛云相关参数，然后此处使用null做占位符。
            // 若想自定义上传key，请把自定义key写入此处options的key值。如果在使用自定义key后，其它七牛云配置参数想维持全局配置，请把此处options除key以外的属性值置空。
            // 启用options参数请记得删除null占位符
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
                that.setData({
                    'messageFileProgress': progress
                });
                console.log('上传进度', progress.progress);
                console.log('已经上传的数据长度', progress.totalBytesSent);
                console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend);
            }, cancelTask => that.setData({ cancelTask })
            );
        }
    })
}

// 在线查看文件的fileUrl输入框，输入完毕后点击确认
function didPressViewFileOnlineInputConfirm(that, event) {
    console.log(event.detail.value);
    that.setData({
        'viewFileOnlineFileUrl': event.detail.value
    });
    console.log(that.data.viewFileOnlineFileUrl);
}

// 在线查看文件，支持的文件格式：pdf, doc, docx, xls, xlsx, ppt, pptx。关于wx.openDocument方法，详情请参考微信官方文档：https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.openDocument.html
function didPressViewFileOnline(that) {
    const downloadTask = wx.downloadFile({
        // url: 'http://[yourBucketId].bkt.clouddn.com/FumUUOIIj...',
        url: that.data.viewFileOnlineFileUrl,
        success: function (res) {
            console.log(res);
            var filePath = res.tempFilePath;
            wx.openDocument ({
                filePath: filePath,
                success: function (res) {
                    console.log('打开文档成功');
                },
                fail:function(res){
                    console.log(res);
                }
            });
        },
        fail:function (res) {
            console.log(res);
        }
    });
    downloadTask.onProgressUpdate((res) => {
        that.setData({
            'downloadFileProgress': res
        });
        console.log('下载进度', res.progress);
        console.log('已经下载的数据长度', res.totalBytesWritten);
        console.log('预期需要下载的数据总长度', res.totalBytesExpectedToWrite);
    });
}