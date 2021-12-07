const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')

aws.config.update({
    accessKeyId: process.env.S3_IAM_USER_KEY,
    secretAccessKey: process.env.S3_IAM_USER_SECRET,
    Bucket: 'smart-interact-bucket',
    region: 'ca-central-1'
});
const s3 = new aws.S3()
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'smart-interact-bucket',
        acl: 'public-read',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname })
        },
        key: (req, file, cb) => {
            cb(null, Date.now().toString() + '-' + file.originalname)
        }
    })
})
const s3delete = async (fileName) => {

    await s3.deleteObject({
        Bucket: process.env.BUCKET_NAME,
        Key: fileName
    }, function (err, data) {
        if (err) console.log(err, err.stack);
    })
}
module.exports = { upload, s3delete }