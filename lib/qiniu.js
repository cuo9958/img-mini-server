//上传服务服务
const qiniu = require("qiniu");
const config = require('config');
const Redis = require('ioredis');

console.log(config.get('redis'))
const redisClient = new Redis(config.get('redis'));

let uploadToken = "";

class QiniuService {

    constructor() {
        this.update();
        setInterval(() => {
            this.update();
        }, 60000);
    }

    //更新token
    async update() {
        const {
            app
        } = this;
        try {
            let data = await redisClient.get('img_mini_qiniu_token');
            if (data) {
                data = JSON.parse(data);
                if (Date.now() - data.time < 3400000) {
                    uploadToken = data.token;
                    return;
                }
            }
        } catch (error) {
            console.log(error);
        }
        const qiniu_config = config.qiniu;
        const mac = new qiniu.auth.digest.Mac(qiniu_config.accessKey, qiniu_config.secretKey);
        const options = {
            scope: qiniu_config.scope,
        };
        const putPolicy = new qiniu.rs.PutPolicy(options);
        uploadToken = putPolicy.uploadToken(mac);
        redisClient.set('img_mini_qiniu_token', JSON.stringify({
            token: uploadToken,
            time: Date.now()
        }));

    }
    //使用流上传
    uploadStream(filename, readableStream, prefix = "") {
        const {
            app
        } = this;
        const qiniu_config = config.qiniu;
        const qnconfig = new qiniu.conf.Config();
        qnconfig.zone = qiniu.zone.Zone_z0;
        const formUploader = new qiniu.form_up.FormUploader(qnconfig);
        const putExtra = new qiniu.form_up.PutExtra();

        return new Promise((a, b) => {
            formUploader.putStream(uploadToken, prefix + filename, readableStream, putExtra, function (respErr,
                respBody, respInfo) {
                if (respErr) {
                    return b(respErr);
                }
                if (respInfo.statusCode === 200) {
                    a({
                        filename: filename,
                        path: qiniu_config.path,
                        url: qiniu_config.path + "/" + prefix + filename
                    });
                } else {
                    b();
                }
            });
        });
    }

}

module.exports = new QiniuService();