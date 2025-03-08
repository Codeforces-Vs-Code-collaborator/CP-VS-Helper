const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 10048;

app.use(cors());
app.use(bodyParser.json());

let problemData = null; //to store the problem data

app.post('/', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: "No URL provided!" });
    }

    problemData = req.body; // store the body data since it will be needed by extension.js file
    console.log("Received problem data:", problemData);

    res.json({ message: `Problem data received successfully!` });
});

app.get('/bodyData', (req, res) => {
    if (!problemData) {
        return res.status(404).json({ message: "No problem data available!" });
    }
    res.json(problemData);  // send the stored data in json format
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
