var ds = require('./utils/datastore');

var KIND = 'Unit';

function list (limit, token) {
  var q = ds.createQuery(KIND)
    .limit(limit)
    .order('created')
    .start(token);
  return ds.runQuery(q);
}

module.exports = {
  create: (data) => update(null, data),
  read: (id) => ds.get(KIND, id),
  update: (id, data) => ds.save(KIND, id, data, ['image', 'audio']),
  delete: (id) => ds.delete(KIND, id),
  list: list,
};
