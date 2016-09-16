var nconf = require('nconf');
nconf
  .argv()
  .env([
    'STORAGE_BUCKET',
    'GCLOUD_PROJECT',
    'PORT',
  ])
  .defaults({
    PORT: 3000
  });

module.exports = nconf;
