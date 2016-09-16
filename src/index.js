var express = require('express');
var bodyParser = require('body-parser');
var debug = require('debug')('index');
var uuid = require('uuid');
var cors = require('cors');
var gcloud = require('google-cloud');
var config = require('./utils/config');

var app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

var gcs = gcloud.storage({
  projectId: config.get('GCLOUD_PROJECT'),
});
var bucket = gcs.bucket(config.get('STORAGE_BUCKET'));

app.post('/aac', (req, res) => {
  debug('POST /aac');
  var id = uuid.v4();
  var remoteWriteStream =
    bucket.file(id).save(JSON.stringify(req.body), function(err) {
      if (!err) {
        return res.json({ id: id });
      }
      return res.status(500).json({ error: err });
    });
});

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

var port = config.get('PORT');
process.on('SIGINT', function() {
    process.exit();
});

app.listen(port, function () {
  console.log('Listening on port', port);
});
