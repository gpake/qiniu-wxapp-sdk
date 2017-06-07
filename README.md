
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

- 上传

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
>2. 修改 uploadFile 域名(比如华北 https 上传地址为：`https://up-z1.qbox.me`，地址不清楚请参见[https地址附录](#region))
>3. 如果需要下载文件，则还需要一同设置 **downloadFile 域名**，为你的 bucket 下载地址
>4. 保存即可

| 字段名             | 内容                             |
| --------------- | ------------------------------ |
| request 域名      | https://yourServce.com         |
| uploadFile 域名   | https://up.qbox.me （根据存储区域填写）  |
| downloadFile 域名 | https://baldkf.bkt.clouddn.com |

<a id="region"></a>

存储区域对应 HTTPS 地址，参考[官方文档](https://support.qiniu.com/hc/kb/article/210702)

| 存储区域 | 区域代码 | HTTPS 地址               |
| ---- | ---- | ---------------------- |
| 华东   | ECN  | https://up.qbox.me     |
| 华北   | NCN  | https://up-z1.qbox.me  |
| 华南   | SCN  | https://up-z2.qbox.me  |
| 北美   | NA   | https://up-na0.qbox.me |

**注意！！**目前微信限制每月只能修改三次域名白名单。

<a id="usage"></a>
### 安装

暂时支持一种安装方式

- 通过 Github 上的 gpake/qiniu-wxapp-sdk 仓库获取

直接克隆仓库

```
git clone https://github.com/gpake/qiniu-wxapp-sdk.git
```

qiniuUploader.js 文件在 sdk 目录。

### 使用

#### 上传功能

1. 在需要使用的页面引用js 文件：

```javascript
const qiniuUploader = require("../../../utils/qiniuUploader");
```

2. 在需要使用上传功能的页面，开心的使用：

```JavaScript
Page({
  didPressChooseImage: function() {
    var that = this;
    // 选择图片
    wx.chooseImage({
      count: 1,
      success: function (res) {
        var filePath = res.tempFilePaths[0];
        // 交给七牛上传
        qiniuUploader.upload(filePath, (res) => {
          // 每个文件上传成功后,处理相关的事情
          // 其中 info 是文件上传成功后，服务端返回的json，形式如
          // {
          //    "hash": "Fh8xVqod2MQ1mocfI4S4KpRL6D98",
          //    "key": "gogopher.jpg"
          //  }
          // 参考http://developer.qiniu.com/docs/v6/api/overview/up/response/simple-response.html
          that.setData({
            'imageURL': res.imageURL,
          });
        }, (error) => {
		  console.log('error: ' + error);
        }, {
          region: 'ECN',
          domain: 'bzkdlkaf.bkt.clouddn.com', // // bucket 域名，下载资源时用到。如果设置，会在 success callback 的 res 参数加上可以直接使用的 ImageURL 字段。否则需要自己拼接
          key: 'customFileName.jpg', // [非必须]自定义文件 key。如果不设置，默认为使用微信小程序 API 的临时文件名
          // 以下方法三选一即可，优先级为：uptoken > uptokenURL > uptokenFunc
          uptoken: '[yourTokenString]', // 由其他程序生成七牛 uptoken
          uptokenURL: 'UpTokenURL.com/uptoken', // 从指定 url 通过 HTTP GET 获取 uptoken，返回的格式必须是 json 且包含 uptoken 字段，例如： {"uptoken": "[yourTokenString]"}
          uptokenFunc: function() {return '[yourTokenString]';}
        });
      }
    })
  }
});

// domain 为七牛空间（bucket)对应的域名，选择某个空间后，可通过"空间设置->基本设置->域名设置"查看获取
// key：通过微信小程序 Api 获得的图片文件的 URL 已经是处理过的临时地址，可以作为唯一文件 key 来使用。
```

<a id="demo"></a>

### DEMO

请使用微信web开发者工具打开 demo 文件夹，然后配置 index.js 中的相关参数以使用 demo。

<a id="api"></a>

### API

```javascript
var options = {
  region: 'East', // 是你注册bucket的时候选择的区域的代码
  // ECN, SCN, NCN, NA，分别对应七牛的：华东，华南，华北，北美四个区域
  // 详情可以参见「说明」部分的第一条
  
  domain: 'bzkdlkaf.bkt.clouddn.com', // // bucket 域名，下载资源时用到。如果设置，会在 success callback 的 res 参数加上可以直接使用的 ImageURL 字段。否则需要自己拼接

  // 以下方法三选一即可，优先级为：uptoken > uptokenURL > uptokenFunc
  uptoken: 'xxxxxxxxUpToken', // 由其他程序生成七牛 uptoken
  uptokenURL: 'UpTokenURL.com/uptoken', // 从指定 url 通过 HTTP GET 获取 uptoken，返回的格式必须是 json 且包含 uptoken 字段，例如： {"uptoken": "0MLvWPnyy..."}
  uptokenFunc: function() {
    // do something to make a uptoken
    return 'zxxxzaqdfUpToken';
  },
  shouldUseQiniuFileName: false // 如果是 true，则文件 key 由 qiniu 服务器分配 (全局去重)。默认是 false: 即使用微信产生的 filename
};
qiniuUploder.init(options);


// 如果使用了 init 方法，则 upload 函数的 options 可以省略。如果没有 init，upload 中也没有 options 则会报错。
// 这里的 options 和 init 中的传入参数一样，只会修改传入的参数
// 上传之前会检查 uptoken 是否存在
// options 参数可以比 init 的时候多出一个参数：[key] 用于指定本次上传文件的名称
qiniuUploader.upload(wxappFilePath, [succeedCallback, [failedCallback, [options]]]);
// 其中 wxappFilePath，是通过微信小程序官方 API：wx.chooseImage，在 success callback得到 var filePath = res.tempFilePaths[0];
```

<a id="note"></a>
### 说明

1. 对于存储空间的存储区域，[创建存储空间](https://portal.qiniu.com/bucket/create)的时候可以选择。
   1. 当前一共有四个区域可以选择：[华东，华北，华南，北美]，对应着不同的服务器地址
   2. 如果你不知道在哪里看当前空间的存储区域，可以登录七牛后台，在[这个页面的右下角](https://portal.qiniu.com/bucket)查看
   3. **对于存储区域和 options 中 region 代码可以参考[这个表格](#region)**
2. SDK 依赖 uptoken，可以直接设置 `uptoken`  、通过提供 Ajax 请求地址 `uptokenURL` 或者通过提供一个能够返回 uptoken 的函数 `uptoken_func` 实现。
   - 如果没用设置过uptoken, uptoken_url 两个参数中必须有一个被设置
   - 如果提供了多个，其优先级为 uptoken > uptoken_url
   - 其中 uptoken 是直接提供上传凭证，uptoken_url 是提供了获取上传凭证的地址
   - uptoken : '<Your upload token>', // uptoken 是上传凭证，由其他程序生成
   - uptoken_url: '/uptoken',                // Ajax 请求 uptoken 的 Url，**强烈建议设置**（服务端提供）
3. 如果您想了解更多七牛的上传策略，建议您仔细阅读 [七牛官方文档-上传](http://developer.qiniu.com/code/v6/api/kodo-api/index.html#up)。
   七牛的上传策略是在后端服务指定的。
4. 如果您想了解更多七牛的图片处理，建议您仔细阅读 [七牛官方文档-图片处理](http://developer.qiniu.com/code/v6/api/kodo-api/index.html#image)
5. SDK 示例生成 uptotken 时，指定的 `Bucket Name` 为公开空间，所以可以公开访问上传成功后的资源。若您生成 uptoken 时，指定的 `Bucket Name` 为私有空间，那您还需要在服务端进行额外的处理才能访问您上传的资源。具体参见[下载凭证](http://developer.qiniu.com/article/developer/security/download-token.html)。SDK 数据处理部分功能不适用于私有空间。

<a id="faq"></a>
### 常见问题

1. **关于上传文件名**

   如果在上传的时候没有指定文件 key，会使用 wx.chooesImage 得到的tmp filePath作为文件的 key。例如：`tmp_xxxxxxx.jpg`

2. **设置取消上传、暂停上传：**

   微信小程序上传 API 暂时无法取消、暂停上传操作

3. **限制上传文件的类型：**

   使用微信小程序 API 只能选到图片文件。

   如果是小程序内产生的文件，那么正常使用即可。

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