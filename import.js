const config = require("config");
const csv = require("csv-parser");
const fs = require("fs");
const { Client } = require("@elastic/elasticsearch");
const indexName = config.get("elasticsearch.index_name");

async function run() {
  // Create Elasticsearch client
  const client = new Client({ node: config.get("elasticsearch.uri") });

  try{
    await client.indices.delete({
      index : indexName
    });
  } catch (error) {
    console.log("Index can't be deleted. Error : " + error.message);
  }

  await client.indices.create({ index: indexName })

  await client.indices.putMapping({
    index: indexName,
    body: {
      properties: {
        "location" : {
          type: 'geo_point'
        }
      }
    }
  })

  let anomalies = [];
  // Read CSV file
  fs.createReadStream("dataset/dans-ma-rue.csv")
    .pipe(
      csv({
        separator: ";"
      })
    )
    .on("data", data => {
      anomalies.push({
        "timestamp": new Date(data.DATEDECL),
        "object_id": data.OBJECTID,
        "annee_declaration" : data["ANNEE DECLARATION"],
        "mois_declaration" : data["MOIS DECLARATION"],
        "mois_annee_declaration" : ('0' + data["MOIS DECLARATION"]).slice(-2) + '/' + data["ANNEE DECLARATION"],
        "type" : data.TYPE,
        "sous_type" : data.SOUSTYPE,
        "code_postal" : data.CODE_POSTAL,
        "ville" : data.VILLE,
        "arrondissement" : data.ARRONDISSEMENT,
        "prefixe" : data.PREFIXE,
        "intervenant" : data.INTERVENANT,
        "conseil_de_quartier" : data["CONSEIL DE QUARTIER"],
        "location" : data.geo_point_2d
      });
    })
    .on("end", async () => {
      while(anomalies.length) {
        try {
          let response = await client.bulk(createBulkInsertQuery(anomalies.splice(0,20000)));
          console.log(`Inserted ${response.body.items.length} anomalies`);
        } catch (error) {
          console.trace(error)
        }
      }
    });
}


run().catch(console.error);

// Fonction utilitaire permettant de formatter les données pour l'insertion "bulk" dans elastic
function createBulkInsertQuery(anomalies) {
  const body = anomalies.reduce((acc, anomalie) => {
    acc.push({ index: { _index: indexName, _type: '_doc', _id: anomalie.object_id } })
    acc.push(anomalie)
    return acc
  }, []);

  return { body };
}

