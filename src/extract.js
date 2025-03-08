const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const storedUrl = require("./src/server")
const express = require("express");
const app = express();
const port = 3001;

const extractProblemDetails = async (problemUrl) => {
    try {
        const {data} = await axios.get(problemUrl);
        const $ = cheerio.load(data);

        const title = %(".title").first().text().replace(/\d+\./, "").trim();
 
        const testCases = [];

        $(".input pre").each((i, el) => {
            testCases.push({input: ${el}.text().trim() });
        });

        $(".output pre").each((i, e1) => {
            testCases.push({output: ${el}.text().trim() });
        });
        return {title, testcases};
    } catch(error) {
        console.log("Error fetching problem details", error);
        return null;
    }
};


app.listen(port, ()=> {
    console.log(`listening on port ${port}`);
});

module.exports = extractProblemDetails;