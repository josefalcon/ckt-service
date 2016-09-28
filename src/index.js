var express = require('express');
var bodyParser = require('body-parser');
var debug = require('debug')('index');
var cors = require('cors');
var gcloud = require('google-cloud');
var uuid = require('uuid');
var config = require('./utils/config');
var uploader = require('./utils/uploader');
var datastore = require('./utils/datastore');
var unit = require('./unit-model');

var app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

var gcs = gcloud.storage({
  projectId: config.get('GCLOUD_PROJECT'),
});
var bucket = gcs.bucket(config.get('CLOUD_BUCKET'));

const applicationJson = { metadata: { contentType: "application/json" } };

app.post(
  '/aac',
  uploader.multer.fields([
    { name: 'image' },
    { name: 'audio' },
  ]),
  uploader.sendUploadsToGCS,
  (req, res) => {
    debug('POST /aac');

    // JF TODO: these need to be validated, assert same length, etc.
    var images = req.files.image.map(file => file.cloudStoragePublicUrl);
    var audios = req.files.audio.map(file => file.cloudStoragePublicUrl);
    var values = JSON.parse(req.body.values);

    var units = [];
    for (var i = 0; i < images.length; i++) {
      units.push({ image: images[i], value: values[i], audio: audios[i] });
    }

    datastore.createAll('Unit', units, ['audio', 'image'])
      .then((entity) => res.json(entity))
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: error });
      });
  }
);

app.get('/aac/:id', (req, res) => {
  var id = req.params.id;
  if (!id) {
    return res.status(404).end();
  }

  debug('GET /aac', id);
  var file = bucket.file(id);
  file.getMetadata((err, metadata) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res
      .set('Content-Type', 'application/json')
      .set('Content-Length', metadata.size);

    file.createReadStream().pipe(res);
  });
});

app.get('/unit/:id', (req, res) => {
  var id = req.params.id;
  if (!id) {
    return res.status(404).end();
  }

  debug('GET /unit', id);
  unit.read(id)
    .then((entity) => res.json(entity))
    .catch((error) => res.status(500).json(error));
});

app.get('/unit', (req, res) => {
  debug('GET /unit');
  unit.list(10)
    .then((entity) => res.json(entity))
    .catch((error) => res.status(500).json(error));
});

var port = config.get('PORT');
app.listen(port, function () {
  console.log('Listening on port', port);
});
