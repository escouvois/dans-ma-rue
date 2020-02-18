const config = require('config');
const indexName = config.get('elasticsearch.index_name');

exports.statsByArrondissement = (client, callback) => {
    // Compter le nombre d'anomalies par arondissement
    client.search({
        index: indexName,
        body: {
            size: 0,
            aggs: {
                "arrondissements": {
                    terms: {
                        field: "arrondissement.keyword",
                        size: 30
                    }
                }
            }
        }
    }).then(resp => {
        const res = resp.body.aggregations.arrondissements.buckets
            .map(o => {
                return {
                    "arrondissement":o.key,
                    "count":o.doc_count
                }
            });
        callback(res);
    })
}

exports.statsByType = (client, callback) => {
    // Trouver le top 5 des types et sous types d'anomalies
    client.search({
        index: indexName,
        body: {
            size: 0,
            aggs : {
                "types" : {
                    terms: {
                        field: "type.keyword",
                        size : 5
                    }
                },"soustypes" : {
                    terms: {
                        field: "sous_type.keyword",
                        size : 5
                    }
                }
            }
        }
    }).then(resp => {
        callback({top_types : resp.body.aggregations.types.buckets,
            top_soustypes : resp.body.aggregations.soustypes.buckets
            })
    })
}

exports.statsByMonth = (client, callback) => {
    // Trouver le top 10 des mois avec le plus d'anomalies
    client.search({
        index: indexName,
        body: {
            size: 0,
            aggs: {
                "mois": {
                    terms: {
                        field: "mois_annee_declaration.keyword",
                        size: 10
                    }
                }
            }
        }
    }).then(resp => {
        const res = resp.body.aggregations.mois.buckets
            .map(o => {
                return {
                    "month":o.key,
                    "count":o.doc_count
                }
            });
        callback(res);
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
                    filter: { term: { "type.keyword": "Propreté" }},
                    aggs: {
                        "arrondissements": {
                            terms: {
                                field: "arrondissement.keyword",
                                size: 3
                            }
                        }
                    }
                }
            }
        }
    }).then(resp => {
        const res = resp.body.aggregations.arrondissementsByType.arrondissements.buckets
            .map(o => {
                return {
                    "arrondissement":o.key,
                    "count":o.doc_count
                }
            });
        callback(res);
    })
}
