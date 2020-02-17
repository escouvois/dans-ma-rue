const config = require("config");
const csv = require("csv-parser");
const fs = require("fs");
const { Client } = require("@elastic/elasticsearch");
const indexName = config.get("elasticsearch.index_name");

async function run() {
  // Create Elasticsearch client
  const client = new Client({ node: config.get("elasticsearch.uri") });

  // Création de l'indice
  checkIndices(client, indexName);
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
    acc.push({ anomalie })
    return acc
  }, []);

  return { body };
}

function checkIndices(client, name) {
  client.indices.exists({ index: name }, (err, res, status) => {
      if (res) {
          console.log('index already exists');
      } else {
          client.indices.create({ index: name }, (err, res, status) => {
              console.log(err, res, status);
          });
      }
  });
}
