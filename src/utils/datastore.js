var gcloud = require('google-cloud');
var config = require('./config');

var ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT'),
});

// Translates from Datastore's entity format to
// the format expected by the application.
//
// Datastore format:
//   {
//     key: [kind, id],
//     data: {
//       property: value
//     }
//   }
//
// Application format:
//   {
//     id: id,
//     property: value
//   }
function fromDatastore (obj) {
  obj.data.id = obj.key.id;
  return obj.data;
}

// Translates from the application's format to the datastore's
// extended entity property format. It also handles marking any
// specified properties as non-indexed. Does not translate the key.
//
// Application format:
//   {
//     id: id,
//     property: value,
//     unindexedProperty: value
//   }
//
// Datastore extended format:
//   [
//     {
//       name: property,
//       value: value
//     },
//     {
//       name: unindexedProperty,
//       value: value,
//       excludeFromIndexes: true
//     }
//   ]
function toDatastore (obj, nonIndexed) {
  nonIndexed = nonIndexed || [];
  var results = [];
  Object.keys(obj).forEach(function (k) {
    if (obj[k] === undefined) {
      return;
    }
    results.push({
      name: k,
      value: obj[k],
      excludeFromIndexes: nonIndexed.indexOf(k) !== -1
    });
  });
  return results;
}

function key (kind, id) {
  if (id) {
    return ds.key([kind, parseInt(id, 10)]);
  } else {
    return ds.key(kind);
  }
}

function get (kind, id) {
  return new Promise((resolve, reject) => {
    ds.get(key(kind, id), (err, entity) => {
      if (err) {
        reject(err);
      }
      if (!entity) {
        reject({ code: 404, message: 'Not found' });
      }
      resolve(fromDatastore(entity));
    });
  });
}

function createAll (kind, datas, nonIndexed) {
  var entities = datas.map(data => {
    key: key(kind),
    data: toDatastore(data, nonIndexed),
  });

  return new Promise((resolve, reject) => {
    ds.save(entities, (err) => {
      if (err) {
        reject(err);
      }
      for (var i = 0; i < entities.length; i++) {
        data[i].id = entities[i].key.id;
      }
      resolve(datas);
    });
  });
}

function save (kind, id, data, nonIndexed) {
  var entity = {
    key: key(kind, id),
    data: toDatastore(data, nonIndexed),
  };

  return new Promise((resolve, reject) => {
    ds.save(entity, (err) => {
      if (err) {
        reject(err);
      }
      data.id = entity.key.id;
      resolve(data);
    });
  });
}

function _delete (kind, id) {
  return new Promise((resolve, reject) => {
    ds.delete(key(kind, id), (err, response) => {
      if (err) {
        reject(err);
      }
      resolve(response);
    });
  });
}

function runQuery (query) {
  return new Promise((resolve, reject) => {
    ds.runQuery(query, (err, entities, nextQuery) => {
      if (err) {
        return reject(err);
      }
      var hasMore = entities.length === query.limitVal ? nextQuery.startVal : false;
      resolve(entities.map(fromDatastore), hasMore);
    });
  });
}

module.exports = {
  get: get,
  save: save,
  delete: _delete,
  createQuery: (kind) => ds.createQuery([kind]),
  runQuery: runQuery,
}
