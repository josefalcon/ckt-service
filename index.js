var express = require('express');
var bodyParser = require('body-parser');
var debug = require('debug')('index');
var uuid = require('uuid');

var app = express();
app.use(bodyParser.json());

var projectId = process.env.GCLOUD_PROJECT;
var gcloud = require('google-cloud')({
  projectId: projectId
});

var gcs = gcloud.storage();
var bucket = gcs.bucket('ckt');

app.post('/aac', (req, res) => {
  debug('POST /acc');
  var id = uuid.v4();
  var remoteWriteStream =
    bucket.file(id).save(JSON.stringify(req.body), function(err) {
      if (!err) {
        return res.json({ id: id });
      }
      return res.status(500).json({ error: err });
    });
});

var port = process.env.PORT || 3000;
process.on('SIGINT', function() {
    process.exit();
});

app.listen(port, function () {
  console.log('Listening on port', port);
});
