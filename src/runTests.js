const { getLeetCodeProblemDetails, runCppOnTestCases } = require("./test"); // Update import

// Example usage for LeetCode
(async () => {
    const problemUrl = 'https://leetcode.com/problems/two-sum/';  // Use correct URL
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
