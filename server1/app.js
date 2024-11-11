const express = require('express');
const NodeCache = require('node-cache');
const cassandra = require('cassandra-driver');

const app = express();
const cache = new NodeCache({ stdTTL: 10 });  // Cache cu expirare de 10 secunde
const PORT = 3001;  // schimbă la 3002 pentru server2

// Configurare client Cassandra
const cassandraClient = new cassandra.Client({
    contactPoints: [process.env.CASSANDRA_HOST],
    localDataCenter: 'datacenter1',
    keyspace: 'my_keyspace'
});

// Conectare la Cassandra
cassandraClient.connect()
    .then(() => console.log("Conectat la Cassandra"))
    .catch(err => console.error("Eroare la conectare", err));

// Endpoint pentru /data
app.get('/data', async (req, res) => {
    console.log("Request received on Server 1");  // Log pentru identificarea serverului
    const key = 'data';
    const cachedData = cache.get(key);

    if (cachedData) {
        console.log('Cache hit');
        return res.json(cachedData);
    }

    // Interogare Cassandra
    try {
        const query = 'SELECT * FROM my_table';
        const result = await cassandraClient.execute(query);
        const data = result.rows;

        // Cache și răspuns
        cache.set(key, data);
        res.json(data);
    } catch (error) {
        console.error("Eroare la interogare Cassandra", error);
        res.status(500).send("Eroare server");
    }
});

app.listen(PORT, () => {
    console.log(`Server rulând pe portul ${PORT}`);
});
