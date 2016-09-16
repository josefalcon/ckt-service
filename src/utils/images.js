var gcloud = require('google-cloud');
var config = require('./config');

var CLOUD_BUCKET = config.get('CLOUD_BUCKET');

var storage = gcloud.storage({
  projectId: config.get('GCLOUD_PROJECT'),
});
var bucket = storage.bucket(CLOUD_BUCKET);

// Mostly taken from: https://github.com/GoogleCloudPlatform/nodejs-getting-started/blob/master/3-binary-data/lib/images.js

function getPublicUrl(filename) {
  return 'https://storage.googleapis.com/' + CLOUD_BUCKET + '/' + filename;
}

function upload(file) {
  return new Promise((resolve, reject) => {
    var gcsname = Date.now() + file.originalname;
    var bucketFile = bucket.file(gcsname);

    var stream = bucketFile.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    stream.on('error', (err) => {
      file.cloudStorageError = err;
      reject(err);
    });

    stream.on('finish', () => {
      file.cloudStorageObject = gcsname;
      file.cloudStoragePublicUrl = getPublicUrl(gcsname);
      resolve();
    });

    stream.end(file.buffer);
  });
}

function sendUploadsToGCS(req, res, next) {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  Promise.all(req.files.map(upload))
    .then(() => next())
    .catch(next);
}

var multer = require('multer')({
  inMemory: true,
  fileSize: 5 * 1024 * 1024, // no larger than 5mb
  rename: function (fieldname, filename) {
    // generate a unique filename
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();
  }
});

module.exports = {
  getPublicUrl: getPublicUrl,
  sendUploadsToGCS: sendUploadsToGCS,
  multer: multer
};
