const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');  // <-- Added this for serving static files

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(__dirname));

// Serve the index.html file for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



app.post('/saveData', (req, res) => {
    const data = req.body;
    fs.readFile('transactions.json', 'utf8', (err, fileData) => {
        if (err) {
            console.error("Error reading transactions.json:", err);
            return res.status(500).send({ status: 'error', message: 'Error reading transactions.json' });
        }
        const jsonData = JSON.parse(fileData || '[]');
        jsonData.push(data);
        fs.writeFile('transactions.json', JSON.stringify(jsonData), 'utf8', (err) => {
            if (err) {
                console.error("Error writing to transactions.json:", err);
                return res.status(500).send({ status: 'error', message: 'Error writing to transactions.json' });
            }
            res.send({ status: 'success' });
        });
    });
});

app.get('/getPrices', async (req, res) => {
    const tickers = req.query.tickers.split(',');
    const apiKey = '755ad903-1328-413e-8b38-bad27e31d448';
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${tickers.join(',')}`;
    try {
        const response = await fetch(url, {
            headers: {
                'X-CMC_PRO_API_KEY': apiKey
            }
        });
        const data = await response.json();
        fs.writeFile('prices.json', JSON.stringify(data), 'utf8', (err) => {
            if (err) {
                console.error("Error writing to prices.json:", err);
                return res.status(500).send({ status: 'error', message: 'Error writing to prices.json' });
            }
            res.send(data);
        });
    } catch (err) {
        console.error("Error fetching prices:", err);
        res.status(500).send({ status: 'error', message: 'Error fetching prices' });
    }
});

app.get('/getData', (req, res) => {
    fs.readFile('transactions.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading transactions.json:", err);
            return res.status(500).send({ status: 'error', message: 'Error reading transactions.json' });
        }
        res.send(data);
    });
});
