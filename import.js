const config = require('config');
const csv = require('csv-parser');
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const indexName = config.get('elasticsearch.index_name');

async function* generator() {
    const stream = fs.createReadStream('dataset/dans-ma-rue.csv')
        .pipe(csv({ separator: ';' }));
    let chunk = [];
    let counter = 0;
    for await (const value of stream) {
        counter++;
        chunk.push(value);
        if (counter === 20000) {
            yield chunk;
            chunk = [];
            counter = 0;
        }
    }
    yield chunk;
}

const itemToDocument = data => ({
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

function createBulkInsertQuery(anomalies) {
    const body = anomalies.reduce((acc, data) => {
        const anomalie = itemToDocument(data);
        acc.push({ index: { _index: indexName, _type: '_doc', _id: anomalie.object_id } })
        acc.push(anomalie);
        return acc
    }, []);
    return { body };
}

async function sendBulk(client, chunk) {
    const query = createBulkInsertQuery(chunk);
    await client.bulk(query);
}

async function sendBulks(client) {
    const iterator = generator();
    let chunk = await iterator.next();
    while(!chunk.done) {
        const value = chunk.value;
        await sendBulk(client, value);
        console.log(`Sent bulk of size ${value.length}`);
        chunk = await iterator.next();
    }
}

async function deleteIndex(client) {
    await client.indices.delete({ index : indexName });
}

async function createIndex(client) {
    await client.indices.create({ index: indexName });
}

async function putMapping(client) {
    await client.indices.putMapping({
        index: indexName,
        body: {
            properties: {
                "location" : {
                    type: 'geo_point'
                }
            }
        }
    });
}

async function run() {
    const client = new Client({ node: config.get("elasticsearch.uri") });
    await deleteIndex(client);
    await createIndex(client);
    await putMapping(client);
    await sendBulks(client);
    console.log('Finished');
}

run().catch(error => console.log(error));