const config = require('config');
const indexName = config.get('elasticsearch.index_name');

exports.statsByArrondissement = (client, callback) => {
    // TODO Compter le nombre d'anomalies par arondissement
    client.search({
        index: indexName,
        body: {
            size: 0,
            aggs: {
                "arrondissements": {
                    terms: {
                        field: "anomalie.arrondissement.keyword",
                        size: 30
                    }
                }
            }
        }
    }).then(resp => {
        callback(resp.body.aggregations.arrondissements.buckets)
    })
}

exports.statsByType = (client, callback) => {
    // TODO Trouver le top 5 des types et sous types d'anomalies
    client.search({
        index: indexName,
        body: {
            "size": 0,
            "aggs" : {
                "types" : {
                    "terms": {
                        "field": "anomalie.type.keyword",
                        "size" : 5
                    },
                    aggs: {
                        "sous_types" : {
                            "terms": {
                                "field": "anomalie.sous_type.keyword",
                                "size" : 5
                            }
                        }
                    }
                }
            }
        }
    }).then(resp => {
        const res = resp.body.aggregations.types.buckets.map(b=>
            {
                return {
                    "type": b.key,
                    "count":b.doc_count,
                    "sous_types":b.sous_types.buckets.map(st=> {
                        return {
                            "sous_type":st.key,
                            "count":st.doc_count
                        }
                    })
                }

            })

        callback(res);
    })
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
