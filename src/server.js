const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 10042;

app.use(cors());
app.use(bodyParser.json());

let problemData = null; 

app.post("/", async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ message: "No URL provided!" });
    }
    
    problemData = req.body;
    console.log("Received problem data:", problemData);
    
    res.json({ message: "Problem data received successfully!" });
});

app.get("/bodyData", (req, res) => {
    if (!problemData) {
        return res.status(404).json({ message: "No problem data available!" });
    }
    res.json(problemData);
});

// ✅ Added a default route for health checks
app.get("/", (req, res) => {
    res.send("Server is running! 🚀");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");

// const app = express();
// const port = 10042;

// app.use(cors());
// app.use(bodyParser.json());

// let problemData = null; 

// app.post("/", async (req, res) => {
//     const { url } = req.body;
//     if (!url) {
//         return res.status(400).json({ message: "No URL provided!" });
//     }
//     problemData = req.body;

//     console.log("Received problem data:", problemData);
// });

// app.get("/bodyData", (req, res) => {
//     if (!problemData) {
//         return res.status(404).json({ message: "No problem data available!" });
//     }
//     res.json(problemData);
// });

// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });


// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const app = express();
// const port = 10048;

// app.use(cors());
// app.use(bodyParser.json());

// let problemData = null; //to store the problem data
// let reqArr = [];

// app.post('/', async (req, res) => {
//     const { url } = req.body;

//     if (!url) {
//         return res.status(400).json({ message: "No URL provided!" });
//     }

//     problemData = req.body; // this will be needed in the extenion.js file
//     reqArr.push(problemData); //

//     // console.log("Received problem data:", problemData);
//     console.log("All requests so far: ", reqArr);
//     res.json(reqArr);
// });

// app.get('/bodyData', (req, res) => {
//     if (reqArr.length === 0) {
//         return res.status(404).json({ message: "No problem data available!" });
//     }
//     res.json(reqArr);  // send the stored data in json format
// });

// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });
