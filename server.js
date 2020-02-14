const config = require('config');
const moment = require('moment');

const express = require('express');
const app = express();

const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: config.get('elasticsearch.uri') });

const { count, countAround } = require('./services/count');
const { statsByArrondissement, statsByType, statsByMonth, statsPropreteByArrondissement } = require('./services/stats');

app.get('/', function (req, res) {
    res.send('DansMaRue Stats API');
});

app.get('/_count', function (req, res) {
    const from = req.query.from;
    const to = req.query.to;
    if (from !== undefined && !moment(from, 'YYYY-MM-DD', true).isValid()) {
        res.status(400).send('Unvalid query parameter: from');
    } else {
        if (to !== undefined && !moment(to, 'YYYY-MM-DD', true).isValid()) {
            res.status(400).send('Unvalid query parameter: to');
        } else {
            count(client, from, to, (data) => {
                res.json(data);
            });
        }
    }
});

app.get('/around/_count', function (req, res) {
    const lat = req.query.lat;
    const lon = req.query.lon;
    const radius = req.query.radius;
    if (!lat || isNaN(parseFloat(lat))) {
        res.status(400).send('Missing or malformed query parameter: lat');
    } else {
        if (!lon || isNaN(parseFloat(lon))) {
            res.status(400).send('Missing or malformed query parameter: lon');
        } else {
            countAround(client, parseFloat(lat), parseFloat(lon), radius, (data) => {
                res.json(data);
            });
        }
    }
});

app.get('/stats/_ByArrondissement', function (req, res) {
    statsByArrondissement(client, (data) => {
        res.json(data);
    });
});

app.get('/stats/_ByType', function (req, res) {
    statsByType(client, (data) => {
        res.json(data);
    });
});

app.get('/stats/_ByMonth', function (req, res) {
    statsByMonth(client, (data) => {
        res.json(data);
    });
});

app.get('/stats/proprete/_ByArrondissement', function (req, res) {
    statsPropreteByArrondissement(client, (data) => {
        res.json(data);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log(`Server listening on port ${port}`);
});
