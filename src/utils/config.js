var nconf = require('nconf');
var path = require('path');

nconf
  .argv()
  .env([
    'CLOUD_BUCKET',
    'GCLOUD_PROJECT',
    'PORT',
  ])
  .file({ file: path.join(process.cwd(), 'config.json') })
  .defaults({
    PORT: 3000
  });

module.exports = nconf;
