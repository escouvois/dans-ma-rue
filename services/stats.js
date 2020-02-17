const config = require('config');
const indexName = config.get('elasticsearch.index_name');

exports.statsByArrondissement = (client, callback) => {
    // TODO Compter le nombre d'anomalies par arondissement
    callback([]);
}

exports.statsByType = (client, callback) => {
    // TODO Trouver le top 5 des types et sous types d'anomalies
    callback([]);
}

exports.statsByMonth = (client, callback) => {
    // Trouver le top 10 des mois avec le plus d'anomalies
    // TODO - Aggréger mois/année dans la key dans le résultat
    client.search({
        index: indexName,
        body: {
            size: 0,
            aggs: {
                "mois": {
                    terms: {
                        field: "anomalie.mois_declaration.keyword",
                        size: 10
                    }
                }
            }
        }
    }).then(resp => {
        callback(resp.body.aggregations.mois.buckets)
    })
}

exports.statsPropreteByArrondissement = (client, callback) => {
    // Trouver le top 3 des arrondissements avec le plus d'anomalies concernant la propreté
    client.search({
        index: indexName,
        body: {
            size: 0,
            aggs: {
                "arrondissementsByType": {
                    filter: { term: { "anomalie.type.keyword": "Propreté" }},
                    aggs: {
                        "arrondissements": {
                            terms: {
                                field: "anomalie.arrondissement.keyword",
                                size: 3
                            }
                        }
                    }
                }
            }
        }
    }).then(resp => {
        callback(resp.body.aggregations.arrondissementsByType.arrondissements.buckets)
    })
}
