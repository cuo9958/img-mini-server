/**
 *
 */
const express = require('express');
const multer = require('multer')

const qiniu = require('../lib/qiniu');
const pngquant = require('imagemin-pngquant');
const gifsicle = require('imagemin-gifsicle');
const mozjpeg = require('imagemin-mozjpeg');
const sr = require("stream");

const Png = pngquant({
    speed: 7
});
const Gif = gifsicle();

const Jpg = mozjpeg({
    quality: 90
});

const router = express.Router();

const upload2 = multer({
    limits: {
        fieldSize: "5MB"
    }
})

router.post('/upload/img', upload2.single('file'), async function (req, res, next) {
    let file_buffer = null;
    const headType = req.file.buffer.toString("hex", 0, 8)
    const headType2 = req.file.buffer.toString("hex", req.file.buffer.length - 2)
    let imgType = '';
    if (headType.indexOf('89504e470d0a1a0a') === 0) {
        imgType = 'png'
    }
    if (headType.indexOf('474946383961') === 0) {
        imgType = 'gif'
    }
    if (headType.indexOf('474946383761') === 0) {
        imgType = 'gif'
    }
    if (headType.indexOf('ffd8') === 0 && headType2 === 'ffd9') {
        imgType = 'jpg'
    }
    if (req.query.mini === 0) {
        file_buffer = req.file.buffer;
    } else {
        if (imgType === 'jpg') {
            file_buffer = await Jpg(req.file.buffer);
        }
        if (imgType === 'png') {
            file_buffer = await Png(req.file.buffer);
        }
        if (imgType === 'gif') {
            file_buffer = await Gif(req.file.buffer);
        }
    }

    if (file_buffer === null || imgType === '') {
        return res.json({
            code: 0,
            msg: "图片格式不支持"
        });
    }

    let old_name = req.file.originalname;
    console.log("上传文件", old_name);
    let ext = old_name.split(".");
    let filename = "img_" + Date.now() + Math.round(Math.random() * 100) + "." + imgType;

    let file_size = 0;
    file_size = file_buffer.length;
    const readsr = new sr.PassThrough();
    readsr.end(file_buffer);
    const result = await qiniu.uploadStream(filename, readsr, "mini/");
    res.json({
        code: 1,
        data: result,
        size: file_size
    })
});

/**
 * 处理数据库数据
 */
router.get('/format', function (req, res, next) {

    res.send("test1");

});

module.exports = router;
