const config = require('config');
const csv = require('csv-parser');
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const indexName = config.get('elasticsearch.index_name');

async function run () {
    // Create Elasticsearch client
    const client = new Client({ node: config.get('elasticsearch.uri') });

    // TODO il y a peut être des choses à faire ici avant de commencer ... 

    // Read CSV file
    fs.createReadStream('dataset/dans-ma-rue.csv')
        .pipe(csv({
            separator: ';'
        }))
        .on('data', (data) => {
            // TODO ici on récupère les lignes du CSV ...
            console.log(data);
        })
        .on('end', () => {
            // TODO il y a peut être des choses à faire à la fin aussi ?
            console.log('Terminated!');
        });
}

run().catch(console.error);
