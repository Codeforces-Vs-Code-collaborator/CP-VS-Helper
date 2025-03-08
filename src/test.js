const fs = require("fs");
const { exec } = require("child_process");
const axios = require("axios");
const cheerio = require("cheerio");

// Updated function to scrape LeetCode problem details
async function getLeetCodeProblemDetails(problemUrl) {
    try {
        const response = await axios.get(problemUrl);

        const $ = cheerio.load(response.data);

        // Extract problem title
        const problemTitle = $("div[data-cy='question-title'] h1").text().trim();

        // Extract input/output format
        const inputFormat = $("div[data-cy='input-format'] pre").text().trim();
        const outputFormat = $("div[data-cy='output-format'] pre").text().trim();

        // Extract sample test cases (LeetCode includes example test cases in a "Testcase" section)
        const testCases = [];
        $("div.test-case").each((_, elem) => {
            const input = $(elem).find(".input pre").text().trim();
            const output = $(elem).find(".output pre").text().trim();
            testCases.push({ input, output });
        });

        return { problemTitle, inputFormat, outputFormat, testCases };

    } catch (error) {
        console.error("Error fetching problem details:", error);
        return null;
    }
}

// Function to run C++ code on test cases
function runCppOnTestCases(cppFilePath, testCases) {
    const executable = "a.out";  // Compiled output filename

    // Step 1: Compile the C++ file
    exec(`g++ ${cppFilePath} -o ${executable}`, (err, stdout, stderr) => {
        if (err || stderr) {
            console.error("Compilation error:", err || stderr);
            return;
        }

        console.log("Compilation successful!");

        // Step 2: Run each test case
        testCases.forEach((test, index) => {
            const inputFile = `input_${index}.txt`;
            const outputFile = `output_${index}.txt`;

            // Write input to a file
            fs.writeFileSync(inputFile, test.input);

            // Execute the compiled program
            exec(`./${executable} < ${inputFile} > ${outputFile}`, (err, stdout, stderr) => {
                if (err || stderr) {
                    console.error(`Error running test case ${index + 1}:`, err || stderr);
                    return;
                }

                // Read output file
                const programOutput = fs.readFileSync(outputFile, "utf8").trim();
                const expectedOutput = test.output.trim();

                // Compare program output with expected output
                console.log(`Test Case ${index + 1}:`);
                console.log(`Input:\n${test.input}`);
                console.log(`Expected Output:\n${expectedOutput}`);
                console.log(`Your Output:\n${programOutput}`);
                console.log(programOutput === expectedOutput ? "✅ Passed" : "❌ Failed");
                console.log("--------------------------------------------------");

                // Cleanup: Remove temporary input/output files
                fs.unlinkSync(inputFile);
                fs.unlinkSync(outputFile);
            });
        });
    });
}

// Sample usage of the functions
(async () => {
    const problemUrl = 'https://leetcode.com/problems/two-sum/'; // Example URL (Two Sum)
    const problemDetails = await getLeetCodeProblemDetails(problemUrl);

    if (problemDetails) {
        console.log(`Problem Title: ${problemDetails.problemTitle}`);
        console.log(`Input Format: ${problemDetails.inputFormat}`);
        console.log(`Output Format: ${problemDetails.outputFormat}`);
        
        // Run C++ code on the fetched test cases
        const cppFilePath = './your_cpp_file.cpp'; // Path to your C++ file
        runCppOnTestCases(cppFilePath, problemDetails.testCases);
    }
})();

module.exports = { getLeetCodeProblemDetails, runCppOnTestCases };
