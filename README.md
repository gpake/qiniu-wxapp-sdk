
Qiniu-wxapp-SDK
============

基于七牛云 API 开发的微信小程序 SDK

### 快速导航

- [准备工作](#prepare)
- [安装与使用](#usage)
- [API](#api)
- [说明](#note)
- [常见问题](#faq)
- [ChangeLog](https://github.com/gpake/qiniu-wxapp-sdk/blob/master/CHANGELOG.md)

### 最近一次修改：

* 增加了文件上传（从客户端会话）功能，支持从客户端会话中选择图片、视频、其它文件（PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式）进行上传。
* demo 页面美化，增加了文件上传（从客户端会话）的UI。
* 补充了更详细的注释，并同步对README.md进行了更新。
* js 版本更新并兼容。ts 版本已兼容，但未更新优化，ts 版本的更新优化将在日后进行。

### 概述

Qiniu-wxapp-SDK 是七牛云在小程序上的实现，网络功能依赖于微信小程序 API。您可以基于 SDK 方便的在小程序中上传文件至七牛云。

Qiniu-wxapp-SDK  为客户端 SDK，没有包含 token 生成实现，为了安全，token 建议通过网络从服务端获取，具体生成代码可以参考以下服务端 SDK 的文档。SDK Demo中暂时没有包含这部分。

- [Java](http://developer.qiniu.com/code/v7/sdk/java.html)
- [PHP](http://developer.qiniu.com/code/v7/sdk/php.html)
- [Python](http://developer.qiniu.com/code/v7/sdk/python.html)
- [Ruby](http://developer.qiniu.com/code/v6/sdk/ruby.html)
- [Go](http://developer.qiniu.com/code/v7/sdk/go.html)
- [Node.js](http://developer.qiniu.com/code/v6/sdk/nodejs.html)
- [C#](http://developer.qiniu.com/code/v6/sdk/csharp.html)
- [C/C++](http://developer.qiniu.com/code/v6/sdk/cpp.html)

### 功能简介

- 上传文件，支持图片文件、视频文件、PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式。

其他功能在开发中，敬请期待。

<a id="prepare"></a>
### 准备

-   从 github 上下载qiniuUploader.js，导入小程序工程。

-   在使用 SDK 之前，您必须先注册一个七牛云帐号，并登录控制台获取一对有效的 AccessKey 和 SecretKey，您可以阅读[ 如何接入七牛 ](http://developer.qiniu.com/article/kodo/kodo-first/quickstart.html)和[ 安全机制 ](http://developer.qiniu.com/article/kodo/kodo-developer/index.html#security) 以进一步了解如何正确使用和管理密钥 。

-   SDK 依赖服务端颁发 uptoken，可以通过以下二种方式实现：
    -   利用[七牛服务端 SDK ](http://developer.qiniu.com/resource/official.html#sdk)构建后端服务（建议的方式）
    -   利用七牛底层 API 构建服务，详见七牛[上传策略](http://developer.qiniu.com/article/developer/security/put-policy.html)和[上传凭证](http://developer.qiniu.com/article/developer/security/upload-token.html)
-   您需要了解您的七牛`存储空间`设置在那个区域，比如华东，华南等，参见[区域设置](#region)

后端服务应提供一个 URL 地址，供小程序请求该地址后获得 uptoken。请求成功后，服务端应返回如下格式的 json（至少包含 uptoken 字段）：

```
{
    "uptoken": "0MLvWPnyya1WtPnXFy9KLyGHyFPNdZceomL..."
}
```

根据你创建的七牛`存储空间`，把对应的 https 上传地址添加到小程序的访问白名单中，方法如下：

>1. 登录 [微信公众平台](https://mp.weixin.qq.com/)，前往 **设置 - 开发设置**，点击 **服务器配置** 下的「**修改**」链接。
>2. 修改 uploadFile 域名(比如华东 https 上传地址为：`https://up.qiniup.com`，地址不清楚写什么请参见[https地址附录](#region))
>3. 如果需要下载文件，则还需要一同设置 **downloadFile 域名**，为你的 bucket 下载地址
>4. 保存即可

| 字段名             | 内容                             |
| --------------- | ------------------------------ |
| request 域名      | https://yourServce.com         |
| uploadFile 域名   | https://up.qiniup.com （根据存储区域填写）  |
| downloadFile 域名 | https://baldkf.bkt.clouddn.com |

<a id="region"></a>

七牛云文件上传接口，文件向匹配的接口中传输，存储区域对应 HTTPS 地址，参考[官方文档](https://support.qiniu.com/hc/kb/article/210702)

| 存储区域 | 区域代码 | HTTPS 地址             |
| -------- | -------- | ---------------------- |
| 华东     | ECN      | https://up.qiniup.com     |
| 华北     | NCN      | https://up-z1.qiniup.com  |
| 华南     | SCN      | https://up-z2.qiniup.com  |
| 北美     | NA       | https://up-na0.qiniup.com |
| 新加坡   | ASG      | https://up-as0.qiniup.com |

**注意!!** 目前微信限制每月只能修改三次域名白名单。

<a id="usage"></a>
### 安装

暂时支持一种安装方式

- 通过 Github 上的 gpake/qiniu-wxapp-sdk 仓库获取

直接克隆仓库

```
git clone https://github.com/gpake/qiniu-wxapp-sdk.git
```

qiniuUploader.js 和 qiniuUploader.ts 文件在本项目中的sdk 目录。

### 使用

#### 上传功能

建议参照demo 的用法，从demo的 ``index.wxml`` 页面 上传UI按钮绑定的事件开始看，注释写的很详细。

1. 在需要使用的页面引用js 文件：

```javascript
const qiniuUploader = require("../../../utils/qiniuUploader");
```

2. 在需要使用上传功能的页面，开心地使用：

```JavaScript
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
        // 如果是 true，则文件的 key 由 qiniu 服务器分配（全局去重）。如果是 false，则文件的 key 使用微信自动生成的 filename。默认是 true。建议使用true，微信自动生成的filename杂乱且长
        shouldUseQiniuFileName: true
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
    // 中断上传方法
    didCancelTask: function () {
        this.data.cancelTask();
    }
});

// 图片上传（从相册）方法
function didPressChooesImage(that) {
    // 详情请见demo部分 index.js
}

// 文件上传（从客户端会话）方法，支持图片、视频、其余文件 (PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式)
function didPressChooesMessageFile(that) {
    // 详情请见demo部分 index.js
}
```

3. TypeScript 支持
```TypeScript
// 请先参照微信小程序开发文档配置 TypeScript 支持
import { upload } from 'qiniuUploader.ts';

Page({
  didPressChooseImage: function() {
    wx.chooseImage({
      count: 1,
      success: function (res) {
        var filePath = res.tempFilePaths[0];
        upload({
          filePath: filePath,
          options: {
            key: '',          // 可选
            region: '',       // 可选(默认为'ECN')
            domain: '',
            uptoken: '',      // 以下三选一
            uptokenURL: '',
            uptokenFunc: () => {
              return '[yourTokenString]';
            },
            shouldUseQiniuFileName: true // 默认true
          },
          before: () => {
            // 上传前
            console.log('before upload');
          },
          success: (res) => {
            that.setData({
          		'imageObject': res
        		});
            console.log('file url is: ' + res.fileUrl);
          },
          fail: (err) => {
            console.log('error:' + err);
          },
          progress: (res) => {
            console.log('上传进度', res.progress)
            console.log('已经上传的数据长度', res.totalBytesSent)
            console.log('预期需要上传的数据总长度', res.totalBytesExpectedToSend)
          },
          complete: (err) => {
            // 上传结束
            console.log('upload complete');
          }
        });
      }
    });
  }
})
```

<a id="demo"></a>

### DEMO

请使用微信web开发者工具打开 demo 文件夹，然后配置 index.js 中的相关参数以使用 demo。

<a id="api"></a>

### API

```javascript
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
  // 如果是 true，则文件的 key 由 qiniu 服务器分配 (全局去重)。如果是 false，则文件的 key 使用微信自动生成的 filename。默认是 true。建议使用true，微信自动生成的filename杂乱且长
  shouldUseQiniuFileName: true
};

// 图片上传（从相册）方法
function didPressChooesImage(that) {
    // 详情请见demo部分 index.js
}

// 文件上传（从客户端会话）方法，支持图片、视频、其余文件 (PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式)
function didPressChooesMessageFile(that) {
    // 详情请见demo部分 index.js
}
```

<a id="note"></a>
### 说明

1. 对于存储空间的存储区域，[创建存储空间](https://portal.qiniu.com/bucket/create)的时候可以选择。
   1. 当前一共有 5 个区域可以选择：[华东，华北，华南，北美，新加坡]，对应着不同的服务器地址
   2. 如果你不知道在哪里看当前空间的存储区域，可以登录七牛后台，在[这个页面的右下角](https://portal.qiniu.com/bucket)查看
   3. **对于存储区域和 options 中 region 代码可以参考[这个表格](#region)**
   
2. SDK 依赖 uptoken，可以直接设置 `uptoken`  、通过提供 Ajax 请求地址 `uptokenURL` 或者通过提供一个能够返回 uptoken 的函数 `uptokenFunc` 实现。
   ```javascript
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
     // 如果是 true，则文件的 key 由 qiniu 服务器分配 (全局去重)。如果是 false，则文件的 key 使用微信自动生成的 filename。默认是 true。建议使用true，微信自动生成的filename杂乱且长
     shouldUseQiniuFileName: true
   };
   ```
   
3. 如果您想了解更多七牛的上传策略，建议您仔细阅读 [七牛官方文档-上传](http://developer.qiniu.com/code/v6/api/kodo-api/index.html#up)。
   七牛的上传策略是在后端服务指定的。
   
   例如：[七牛云 java sdk](https://developer.qiniu.com/kodo/sdk/1239/java) 中提到了[魔法变量](https://developer.qiniu.com/kodo/manual/1235/vars#magicvar) 可以指定上传文件后，返回对象中包含字段：文件的大小  ``fsize`` , 文件类型  ``mimeType`` 等。
   
4. 如果您想了解更多七牛的图片处理，建议您仔细阅读 [七牛官方文档-图片处理](http://developer.qiniu.com/code/v6/api/kodo-api/index.html#image)

5. SDK 示例生成 uptotken 时，指定的 `Bucket Name` 为公开空间，所以可以公开访问上传成功后的资源。若您生成 uptoken 时，指定的 `Bucket Name` 为私有空间，那您还需要在服务端进行额外的处理才能访问您上传的资源。具体参见[下载凭证](http://developer.qiniu.com/article/developer/security/download-token.html)。SDK 数据处理部分功能不适用于私有空间。

<a id="faq"></a>
### 常见问题

1. **关于上传文件名**

   如果在上传的时候没有指定文件 key，会使用由 qiniu 服务器分配的 key （全局去重）。例如：`` Fh6qfpY...`` （建议的方式）

   或者，可以使用 ``wx.chooesImage`` 得到的tmp filePath作为文件的 key。例如：`tmp_xxxxxxx.jpg`。

   推荐使用七牛云服务器分配的key (全局去重)，微信自动生成的filename杂乱且长。

   详情请见demo中的 ``shouldUseQiniuFileName``  sdk中的 ``qiniuShouldUseQiniuFileName`` 属性。

2. **设置取消上传、暂停上传：**

   请见demo部分，``index.js``中``data.cancelTask``。sdk的``qiniuUploader.js``中的``cancelTask``方法。

   此外，demo页面有中断上传的UI演示。

3. **限制上传文件的类型：**

   支持图片文件、视频文件、其它文件（PDF(.pdf), Word(.doc/.docx), Excel(.xls/.xlsx), PowerPoint(.ppt/.pptx)等文件格式）。

   demo部分的 ``index.wxml`` 页面有图片上传（从相册）、文件上传（从客户端会话）的UI演示。

<a id="contribute-code"></a>

### 贡献代码

1. 登录 https://github.com

2. Fork `git@github.com:gpake/qiniu-wxapp-sdk.git`

3. 创建您的特性分支 (git checkout -b new-feature)

4. 提交您的改动 (git commit -am 'Added some features or fixed a bug')

5. 将您的改动记录提交到远程 git 仓库 (git push origin new-feature)

6. 然后到 github 网站的该 git 远程仓库的 new-feature 分支下发起 Pull Request

<a id="license"></a>
### 基于 GPL V3 协议发布:

> [GPL V3 LICENSE](https://github.com/gpake/qiniu-wxapp-sdk/blob/master/LICENSE)
