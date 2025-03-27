const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const axios = require("axios");
const state = require("../state");
const { parseExtraTestCases } = require("../utils/parseTestCases");

async function executeTestCases(jsonData) {
  state.outputChannel.appendLine("inside the execute test cases");
  if (!jsonData || !jsonData.name || !jsonData.tests) {
    state.outputChannel.appendLine(
      "Invalid problem data received: " + JSON.stringify(jsonData)
    );
    return;
  }
  state.currentProblemData = jsonData;
  const problemName = jsonData.name.replace(/[^a-zA-Z0-9]/g, "_");
  if (!state.workspacePath || state.workspacePath.length === 0) {
    state.outputChannel.appendLine(
      "The workspace path is not defined, execute the commands in sequence"
    );
    return;
  }

  const solutionPath = path.join(state.workspacePath, "solution.cpp");
  const executablePath = path.join(state.workspacePath, "solution");
  const tests = jsonData.tests;

  if (!Array.isArray(tests)) {
    state.outputChannel.appendLine("Invalid test cases format");
    return;
  }

  const extraTestCasesFile = path.join(state.workspacePath, "testcases.txt");
  if (fs.existsSync(extraTestCasesFile)) {
    try {
      const extraData = fs.readFileSync(extraTestCasesFile, "utf8");
      const extraTests = parseExtraTestCases(extraData);
      tests.push(...extraTests);
      state.outputChannel.appendLine(
        `Added ${extraTests.length} extra test case(s) from testcases.txt.`
      );
    } catch (err) {
      state.outputChannel.appendLine(
        "Error reading extra test cases: " + err.message
      );
    }
  }

  const compileCommand = `g++ -o "${executablePath}" "${solutionPath}"`;
  exec(
    compileCommand,
    { cwd: state.workspacePath },
    (compileErr, _, compileStderr) => {
      if (compileErr) {
        state.outputChannel.appendLine("Compilation Error:\n" + compileStderr);
        return;
      }
      state.outputChannel.appendLine("Compilation Successful!\n");

      tests.forEach((test, index) => {
        const terminal = spawn(`${executablePath}`, {
          cwd: state.workspacePath,
          shell: true,
        });
        const inputLines = test.input.split(/\r?\n/);
        inputLines.forEach((line) => {
          terminal.stdin.write(line + "\n");
        });
        terminal.stdin.end();

        let outputData = "";
        terminal.stdout.on("data", (data) => {
          outputData += data.toString();
        });

        terminal.stderr.on("data", (data) => {
          state.outputChannel.appendLine(
            `Error executing test case ${index + 1}:\n` + data.toString()
          );
        });

        terminal.on("close", () => {
          const ourOutput = outputData.trim();
          const expectedOutput = test.output.trim();

          const normalizeOutput = (out) =>
            out
              .split(/\r?\n/)
              .map((line) => line.trim())
              .join("\n");

          const passed =
            normalizeOutput(ourOutput) === normalizeOutput(expectedOutput);
          const testStatus = passed ? "✅" : "❌";

          state.outputChannel.appendLine(
            `Test Case ${index + 1}: ${testStatus}`
          );
          state.outputChannel.appendLine("Input is:");
          state.outputChannel.appendLine(test.input);
          state.outputChannel.appendLine("Your output is:");
          state.outputChannel.appendLine(ourOutput);
          state.outputChannel.appendLine("Correct output is:");
          state.outputChannel.appendLine(expectedOutput);
          state.outputChannel.appendLine("-----------------------------\n");
        });
      });
    }
  );
}

async function fetchDataToExecute() {
  try {
    const response = await axios.get("http://127.0.0.1:10042/bodydata");
    await executeTestCases(response.data);
  } catch (error) {
    vscode.window.showErrorMessage("fetchProblemData in ExecuteTestCases.");
    vscode.window.showErrorMessage("Failed to fetch problem data from server.");
  }
}

module.exports = { executeTestCases, fetchDataToExecute };