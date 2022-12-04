type TokenFunction = () => string;
type AnyFunction = (...args: any[]) => any;

export type RegionCode = 'ECN' | 'NCN' | 'SCN' | 'NA' | 'ASG' | '';


interface QiniuConfig {
    qiniuRegion?: RegionCode;
    qiniuBucketURLPrefix?: string;
    qiniuUploadToken?: string;
    qiniuUploadTokenURL?: string;
    qiniuUploadTokenFunction?: TokenFunction;
    qiniuShouldUseQiniuFileName?: boolean;
}


/**
 * 针对使用七牛云 API 的数据结构
 */
export interface QiniuOptions {
    key?: string;
    region?: RegionCode;
    domain?: string;
    uptoken?: string;
    uptokenURL?: string;
    uptokenFunc?: TokenFunction;
    shouldUseQiniuFileName?: boolean;
}

/**
 * 针对 upload 函数的数据结构
 */
export interface QiniuUploadOptions {
    filePath: string;
    success?: AnyFunction;
    fail?: AnyFunction;
    options?: QiniuOptions | null;
    progress?: WechatMiniprogram.UploadTaskOnProgressUpdateCallback;
    cancelTask?: AnyFunction;
    before?: () => void;
    complete?: WechatMiniprogram.UploadFileCompleteCallback;
}


const config: QiniuConfig = {
    // bucket 所在区域。ECN, SCN, NCN, NA, ASG，分别对应七牛云的：华东，华南，华北，北美，新加坡 5 个区域
    qiniuRegion: '',
    // 七牛云bucket 外链前缀，外链在下载资源时用到
    qiniuBucketURLPrefix: '',

    // 获取uptoken方法三选一即可，执行优先级为：uptoken > uptokenURL > uptokenFunc。三选一，剩下两个置空。推荐使用uptokenURL，详情请见 README.md
    // 直接写入uploadtoken
    qiniuUploadToken: '',
    // 从指定 URL 获取 uploadtoken，数据机构见
    qiniuUploadTokenURL: '',
    // uptokenFunc 这个属性的值可以是一个用来生成uptoken的函数，详情请见 README.md
    qiniuUploadTokenFunction: function () { return ''; },

    // qiniuShouldUseQiniuFileName 如果是 true，则文件的 key 由 qiniu 服务器分配（全局去重）。如果是 false，则文件的 key 使用微信自动生成的 filename。出于初代sdk用户升级后兼容问题的考虑，默认是 false。
    // 微信自动生成的 filename较长，导致fileURL较长。推荐使用{qiniuShouldUseQiniuFileName: true} + "通过fileURL下载文件时，自定义下载名" 的组合方式。
    // 自定义上传key 需要两个条件：1. 此处shouldUseQiniuFileName值为false。 2. 通过修改qiniuUploader.upload方法传入的options参数，可以进行自定义key。（请不要直接在sdk中修改options参数，修改方法请见demo的index.js）
    // 通过fileURL下载文件时，自定义下载名，请参考：七牛云“对象存储 > 产品手册 > 下载资源 > 下载设置 > 自定义资源下载名”（https://developer.qiniu.com/kodo/manual/1659/download-setting）。本sdk在README.md的"常见问题"板块中，有"通过fileURL下载文件时，自定义下载名"使用样例。
    qiniuShouldUseQiniuFileName: false
};


/**
 * 在整个程序生命周期中，只需要 init 一次即可。如果需要变更参数，再调用 init 即可
 * @param options 
 */
export function init(options: QiniuOptions) {
    updateConfigWithOptions(options);
}

/**
 * 将用户提供的 options 整合到 config
 * @param options 
 */
function updateConfigWithOptions(options: QiniuOptions) {
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
    if (options.shouldUseQiniuFileName) {
        config.qiniuShouldUseQiniuFileName = options.shouldUseQiniuFileName;
    }
}

export function upload(uploadOptions: QiniuUploadOptions) {
    const { filePath, options } = uploadOptions;
    if (!filePath) {
        console.error('qiniu uploader need filePath to upload');
        return;
    }
    if (options) {
        updateConfigWithOptions(options);
    }
    if (config.qiniuUploadToken) {
        doUpload(uploadOptions);
    } else if (config.qiniuUploadTokenURL) {
        getQiniuToken(() => {
            doUpload(uploadOptions);
        });
    } else if (config.qiniuUploadTokenFunction) {
        config.qiniuUploadToken = config.qiniuUploadTokenFunction();
        if (!config.qiniuUploadToken) {
            console.error('qiniu UploadTokenFunction result is null, please check the return value');
            return;
        }
        doUpload(uploadOptions);
    } else {
        console.error('qiniu uploader need one of [uptoken, uptokenURL, uptokenFunc]');
        return;
    }
}

function doUpload(uploadOptions: QiniuUploadOptions) {
    if (!config.qiniuUploadToken) {
        console.error('qiniu UploadToken is null, please check the init config or networking');
        return;
    }
    const { filePath, success, fail, options, progress, cancelTask, before, complete } = uploadOptions;

    const url = uploadURLFromRegionCode(config?.qiniuRegion || 'ECN');
    if (!url) {
        console.error('qiniu region code is null, please check the init config or networking');
        return;
    }

    let fileName = filePath.split('//')[1];
    if (options && options.key) {
        fileName = options.key;
    }
    let formData: { token: string; key?: string } = {
        token: config.qiniuUploadToken
    };
    if (!config.qiniuShouldUseQiniuFileName) {
        formData['key'] = fileName;
    }
    before && before();
    const uploadTask = wx.uploadFile({
        url: url,
        filePath: filePath,
        name: 'file',
        formData: formData,
        success: function (res) {
            let dataString = res.data;
            try {
                const dataObject = JSON.parse(dataString);
                //do something
                const fileURL = config.qiniuBucketURLPrefix + '/' + dataObject.key;
                dataObject.fileURL = fileURL;
                // imageURL字段和fileURL字段重复，但本sdk不做删除，因为在最初版本使用的是imageURL。直接删除可能导致原有用户升级至新版sdk后出现异常。
                dataObject.imageURL = fileURL;
                console.log(dataObject);
                if (success) {
                    success(dataObject);
                }
            } catch (e) {
                console.log('parse JSON failed, origin String is: ' + dataString);
                fail && fail(e);
            }
        },
        fail: function (error) {
            console.error(error);
            fail && fail(error);
        },
        complete: function (err) {
            complete && complete(err);
        }
    });

    uploadTask.onProgressUpdate(res => {
        progress && progress(res);
    });

    cancelTask && cancelTask(() => {
        uploadTask.abort();
    });
}

/**
 * 从指定 URL
 * @param callback 
 */
function getQiniuToken(callback: () => void) {
    wx.request({
        url: config.qiniuUploadTokenURL || '',
        success: (res: any) => {
            let token = res.data.uptoken;
            if (token && token.length > 0) {
                config.qiniuUploadToken = token;
                callback && callback();
            } else {
                console.error(
                    'qiniuUploader cannot get your token, please check the uptokenURL or server'
                );
            }
        },
        fail: function (error) {
            console.error('qiniu UploadToken is null, please check the init config or networking: ');
            console.error(error);
        }
    });
}



function uploadURLFromRegionCode(code: RegionCode): string | null {
    let uploadURL = null;
    switch (code) {
        case 'ECN':
            uploadURL = 'https://up.qiniup.com';
            break;
        case 'NCN':
            uploadURL = 'https://up-z1.qiniup.com';
            break;
        case 'SCN':
            uploadURL = 'https://up-z2.qiniup.com';
            break;
        case 'NA':
            uploadURL = 'https://up-na0.qiniup.com';
            break;
        case 'ASG':
            uploadURL = 'https://up-as0.qiniup.com';
            break;
        default:
            console.error(
                'please make the region is with one of [ECN, SCN, NCN, NA, ASG]'
            );
    }
    return uploadURL;
}