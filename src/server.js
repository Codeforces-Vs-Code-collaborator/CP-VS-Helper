const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// const runTest = require("./runTests"); // Uncomment if needed

const app = express();
const port = 10048;

app.use(cors());
app.use(bodyParser.json());

let problemUrl = "";

app.post('/', async (req, res) => {
    const { url } = req.body;
    let nameOfProblem = req.body.name;
    console.log(req.body);
    console.log(nameOfProblem);

    if (!url) {
        return res.status(400).json({ message: "No URL provided!" });
    }

    console.log("Received URL:", url);
    problemUrl = url;

    try {
        // Uncomment if you have a runTest function
        // await runTest(url); 
        res.json({ message: `Tests started for URL: ${url}` });
    } catch (error) {
        console.error("Error running tests:", error);
        res.status(500).json({ message: "Failed to run tests." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// module.exports = { problemUrl };
