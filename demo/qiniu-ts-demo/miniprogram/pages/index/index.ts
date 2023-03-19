import * as qiniuUploader from '../../utils/qiniuUploader';
// index.js

// 初始化七牛云相关配置
function initQiniu() {
    const options: qiniuUploader.QiniuOptions = {
        // bucket所在区域，这里是华北区。ECN, SCN, NCN, NA, ASG，分别对应七牛云的：华东，华南，华北，北美，新加坡 5 个区域
        region: '',

        /**
         * 受限于七牛云安全机制，上传文件之前必须获取 uploadToken，由于生成 uploadToken 需要隐私数据，本 SDK 提供三种获取方法：
         * 1. upToken 直接赋值（本例使用）
         * 2. 从指定 URL 处获取
         * 3. 执行函数 upTokenFunc 获取
         * (后端获取 token 见 https://developer.qiniu.com/kodo/1289/nodejs)
         *
         *  注意：此处的 region、domain 与生成 uploadToken 时提交的 bucket 对应，否则上传图片时可能出现 401 expired token
         */
        uptoken: '',
        uptokenURL: '',
        uptokenFunc: function () { return '' },

        // 后端生成 uploadToken 时使用的 bucket 所分配的域名。 https://portal.qiniu.com/kodo/bucket/overview?bucketName=cregskin-static-pictures
        domain: '',

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
const app = getApp()
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
    },
    // 图片上传（从相册）方法
    didPressChooesImage: function () {
        this._didPressChooesImage();
    },
    // 文件上传（从客户端会话）方法，支持图片、视频、其余文件 (PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式)
    didPressChooesMessageFile: function () {
        this._didPressChooesMessageFile();
    },
    // 在线查看文件的fileUrl输入框，输入完毕后点击确认
    didPressViewFileOnlineInputConfirm: function (event: WechatMiniprogram.TouchEvent) {
        this._didPressViewFileOnlineInputConfirm(event);
    },
    // 在线查看文件，支持的文件格式：pdf, doc, docx, xls, xlsx, ppt, pptx。关于wx.openDocument方法，详情请参考微信官方文档：https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.openDocument.html
    didPressViewFileOnline: function () {
        this._didPressViewFileOnline();
    },
    // 中断上传方法
    didCancelTask: function () {
        this.data.cancelTask();
    },

    // 图片上传（从相册）方法
    _didPressChooesImage() {
        // 初始化七牛云配置
        initQiniu();
        // 置空messageFileObject，否则在第二次上传过程中，wxml界面会存留上次上传的信息
        this.setData({
            'imageObject': {},
            'imageProgress': {}
        });
        const that = this;
        // 微信 API 选择图片（从相册）
        wx.chooseMedia({ // https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html
            // 最多可以选择的图片张数。目前本sdk只支持单图上传，若选择多图，只会上传第一张图
            count: 1,
            mediaType: ['image'],
            success: function (res) {
                // wx.chooseImage 目前微信官方尚未开放获取原图片名功能(2020.4.22)
                // 向七牛云上传
                const uploadOptions: qiniuUploader.QiniuUploadOptions = {
                    filePath: res.tempFiles[0].tempFilePath,
                    success: (res) => {
                        that.setData({
                            'imageObject': res
                        });
                        console.log('file url is: ' + res.fileURL);
                    },
                    fail: (error) => {
                        console.error('error: ' + JSON.stringify(error));
                    },
                    options: null, // 表示无需更改 config
                    progress: (progress) => {
                        that.setData({
                            'imageProgress': progress
                        });
                        console.log('上传进度', progress.progress);
                        console.log('已经上传的数据长度', progress.totalBytesSent);
                        console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend);
                    },

                    cancelTask: that.data.cancelTask
                }
                qiniuUploader.upload(uploadOptions);
            }
        })
    },

    // 文件上传（从客户端会话）方法，支持图片、视频、其余文件 (PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式)
    _didPressChooesMessageFile() {
        // 初始化七牛云相关参数
        initQiniu();
        // 置空messageFileObject和messageFileProgress，否则在第二次上传过程中，wxml界面会存留上次上传的信息
        this.setData({
            'messageFileObject': {},
            'messageFileProgress': {}
        });
        const that = this;
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
                const uploadOptions: qiniuUploader.QiniuUploadOptions = {
                    filePath: filePath,
                    success: (res) => {
                        res.fileName = fileName;
                        console.log('file name is: ' + fileName);
                        console.log('file url is: ' + res.fileURL);
                        that.setData({
                            'messageFileObject': res
                        })
                    },
                    fail: (error) => {
                        console.error('error: ' + JSON.stringify(error));
                    },
                    options: null,
                    progress: (progress) => {
                        that.setData({
                            'messageFileProgress': progress
                        });
                        console.log('上传进度', progress.progress);
                        console.log('已经上传的数据长度', progress.totalBytesSent);
                        console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend);
                    },
                    cancelTask: that.data.cancelTask

                }
                qiniuUploader.upload(uploadOptions);
            }
        })
    },

    // 在线查看文件的fileUrl输入框，输入完毕后点击确认
    _didPressViewFileOnlineInputConfirm(event: WechatMiniprogram.TouchEvent) {
        console.log(event.detail.value);
        this.setData({
            'viewFileOnlineFileUrl': event.detail.value
        });
        console.log(this.data.viewFileOnlineFileUrl);
    },

    // 在线查看文件，支持的文件格式：pdf, doc, docx, xls, xlsx, ppt, pptx。关于wx.openDocument方法，详情请参考微信官方文档：https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.openDocument.html
    _didPressViewFileOnline() {
        const downloadTask = wx.downloadFile({
            // url: 'http://[yourBucketId].bkt.clouddn.com/FumUUOIIj...',
            url: this.data.viewFileOnlineFileUrl,
            success: function (res) {
                console.log(res);
                var filePath = res.tempFilePath;
                wx.openDocument({
                    filePath: filePath,
                    success: function (res) {
                        console.log('打开文档成功');
                    },
                    fail: function (res) {
                        console.log(res);
                    }
                });
            },
            fail: function (res) {
                console.log(res);
            }
        });
        downloadTask.onProgressUpdate((res) => {
            this.setData({
                'downloadFileProgress': res
            });
            console.log('下载进度', res.progress);
            console.log('已经下载的数据长度', res.totalBytesWritten);
            console.log('预期需要下载的数据总长度', res.totalBytesExpectedToWrite);
        });
    }
});

