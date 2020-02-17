const config = require('config');
const indexName = config.get('elasticsearch.index_name');

exports.count = (client, from, to, callback) => {
    
    client
    .count({
      index: indexName,
      body: {
        query: {
          range: {
            "anomalie.timestamp" : {
              gte: from,
              lte: to
            }
          }
        }
      }
    })
    .then(resp => {
        callback({
            count: resp.body.count
        })
    });

    
}

exports.countAround = (client, lat, lon, radius, callback) => {
    // TODO Compter le nombre d'anomalies autour d'un point géographique, dans un rayon donné
    callback({
        count: 0
    })
}