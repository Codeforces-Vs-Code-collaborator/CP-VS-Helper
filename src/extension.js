const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const axios = require("axios");

let currentProblemData = null;
let workspacePath = "";
let outputChannel;

async function processProblemData(jsonData) {
  outputChannel.appendLine("inside the process problem data");
  if (!jsonData || !jsonData.name || !jsonData.tests) {
    outputChannel.appendLine("Invalid problem data received: " + JSON.stringify(jsonData));
    return;
  }

  currentProblemData = jsonData;

  const uri = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    openLabel: "Select Folder for Problem",
  });

  if (!uri || uri.length === 0) {
    vscode.window.showErrorMessage("No folder selected.");
    return;
  }

  const selectedFolder = uri[0].fsPath;
  const problemName = jsonData.name.replace(/[^a-zA-Z0-9]/g, "_");
  workspacePath = path.join(selectedFolder, problemName);

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
    outputChannel.appendLine("Created workspace folder: " + workspacePath);
  }

  const solutionPath = path.join(workspacePath, "solution.cpp");
  if (!fs.existsSync(solutionPath)) {
    const boilerplate = `//${currentProblemData.url}\n
#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`;
    fs.writeFileSync(solutionPath, boilerplate);
    outputChannel.appendLine("Created solution.cpp with boilerplate.");

    vscode.workspace.openTextDocument(solutionPath).then((doc) => {
      vscode.window.showTextDocument(doc);
    });
    outputChannel.appendLine("Inside solution.cpp file");
  }
}

async function fetchProblemData() {
  try {
    const response = await axios.get("https://cp-code-runner-3.onrender.com/bodyData");
    // const response = await axios.get("http://localhost:10042/bodyData");
    processProblemData(response.data);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to fetch problem data from server.");
  }
}

async function executeTestCases(jsonData) {
  outputChannel.appendLine("inside the execute test cases");
  if (!jsonData || !jsonData.name || !jsonData.tests) {
    outputChannel.appendLine("Invalid problem data received: " + JSON.stringify(jsonData));
    return;
  }
  currentProblemData = jsonData;
  const problemName = jsonData.name.replace(/[^a-zA-Z0-9]/g, "_");
  if (!workspacePath || workspacePath.length === 0) {
    outputChannel.appendLine("The workspace path is not defined, execute the commands in sequence");
    return;
  }

  const solutionPath = path.join(workspacePath, "solution.cpp");
  const executablePath = path.join(workspacePath, "solution");
  const tests = jsonData.tests;

  if (!Array.isArray(tests)) {
    outputChannel.appendLine("Invalid test cases format");
    return;
  }

  const extraTestCasesFile = path.join(workspacePath, "testcases.txt");
  if (fs.existsSync(extraTestCasesFile)) {
    try {
      const extraData = fs.readFileSync(extraTestCasesFile, "utf8");
      // Parse all Codeforces-style test case blocks from the file
      const extraTests = parseExtraTestCases(extraData);
      tests.push(...extraTests);
      outputChannel.appendLine(`Added ${extraTests.length} extra test case(s) from testcases.txt.`);
    } catch (err) {
      outputChannel.appendLine("Error reading extra test cases: " + err.message);
    }
  }
  
  const compileCommand = `g++ -o "${executablePath}" "${solutionPath}"`;
  exec(
    compileCommand,
    { cwd: workspacePath },
    (compileErr, _, compileStderr) => {
      if (compileErr) {
        outputChannel.appendLine("Compilation Error:\n" + compileStderr);
        return;
      }
      outputChannel.appendLine("Compilation Successful!\n");

      tests.forEach((test, index) => {
        const terminal = spawn(`${executablePath}`, {
          cwd: workspacePath,
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
          outputChannel.appendLine(`Error executing test case ${index + 1}:\n` + data.toString());
        });

        terminal.on("close", () => {
          const ourOutput = outputData.trim();
          const expectedOutput = test.output.trim();

          const normalizeOutput = (out) =>
            out.split(/\r?\n/).map(line => line.trim()).join("\n");

          const passed = normalizeOutput(ourOutput) === normalizeOutput(expectedOutput);
          const testStatus = passed ? "✅" : "❌";

          outputChannel.appendLine(`Test Case ${index + 1}: ${testStatus}`);
          outputChannel.appendLine("Input is:");
          outputChannel.appendLine(test.input);
          outputChannel.appendLine("Your output is:");
          outputChannel.appendLine(ourOutput);
          outputChannel.appendLine("Correct output is:");
          outputChannel.appendLine(expectedOutput);
          outputChannel.appendLine("-----------------------------\n");
        });
      });
    }
  );
}


function parseExtraTestCases(fileContent) {
  const extraTests = [];
  // This regex finds blocks that start with "Input:" and contain an "Output:" marker.
  const regex = /Input:\s*([\s\S]*?)\s*Output:\s*([\s\S]*?)(?=(Input:|$))/g;
  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    const inputPart = match[1].trim();
    const outputPart = match[2].trim();
    if (inputPart && outputPart) {
      extraTests.push({ input: inputPart, output: outputPart });
    }
  }
  return extraTests;
}

async function fetchDataToExecute() {
  try {
    
    const response = await axios.get("https://cp-code-runner-3.onrender.com/bodyData");
    // const response = await axios.get("http://localhost:10042/bodyData");
    executeTestCases(response.data);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to fetch problem data from server.");
  }
}

async function showTestCaseInputForm() {
  return new Promise((resolve, reject) => {
    const panel = vscode.window.createWebviewPanel(
      "testCaseInput", 
      "Add Custom Test Case", 
      vscode.ViewColumn.One, 
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'submit':
            resolve(message.data);
            panel.dispose();
            break;
          case 'cancel':
            reject(new Error("User cancelled the input."));
            panel.dispose();
            break;
        }
      },
      undefined,
      []
    );
  });
}

function getWebviewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Add Custom Test Case</title>
</head>
<body>
  <form id="testCaseForm">
    <label for="input">Test Case Input:</label><br>
    <textarea id="input" rows="6" cols="50" placeholder="Enter test case input"></textarea><br>
    <label for="output">Test Case Output:</label><br>
    <textarea id="output" rows="6" cols="50" placeholder="Enter test case output"></textarea><br><br>
    <button type="button" id="submit">Submit</button>
    <button type="button" id="cancel">Cancel</button>
  </form>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('submit').addEventListener('click', () => {
      const input = document.getElementById('input').value;
      const output = document.getElementById('output').value;
      if (!input || !output) {
        alert("Both fields must be filled!");
        return;
      }
      vscode.postMessage({ command: 'submit', data: { input, output }});
    });
    document.getElementById('cancel').addEventListener('click', () => {
      vscode.postMessage({ command: 'cancel' });
    });
  </script>
</body>
</html>`;
}

async function addCustomTestCase() {
  if (!workspacePath) {
    vscode.window.showErrorMessage("No workspace selected. Run 'Run Problem' first.");
    return;
  }

  try {
    const { input, output } = await showTestCaseInputForm();
    // Parse and normalize the test case input/output before storing.
    const formattedInput = parseTestCaseInput(input);
    const formattedOutput = output.trim();
    // Format the test case with markers
    const formattedTestCase = `Input:\n${formattedInput}\nOutput:\n${formattedOutput}\n`;
    
    const testCaseFilePath = path.join(workspacePath, "testcases.txt");
    fs.appendFileSync(testCaseFilePath, formattedTestCase);
    vscode.window.showInformationMessage("Test Case added successfully!");
    outputChannel.appendLine(`Added Test Case:\n${formattedTestCase}`);
  } catch (err) {
    vscode.window.showWarningMessage("Test case addition was cancelled or failed.");
  }
}

/**
 * parseTestCaseInput normalizes the input string.
 * It replaces Windows line endings, trims whitespace, and ensures it ends with a newline.
 */
function parseTestCaseInput(input) {
  let normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized.endsWith("\n")) {
    normalized += "\n";
  }
  return normalized;
}

function activate(context) {
  outputChannel = vscode.window.createOutputChannel("Test Cases Output");
  outputChannel.show();

  console.log("Extension activated.");
  let runProblemCommand = vscode.commands.registerCommand("extension.runProblem", fetchProblemData);
  context.subscriptions.push(runProblemCommand);
  let compileAndRunTestCases = vscode.commands.registerCommand("extension.compileAndRunTestCases", fetchDataToExecute);
  context.subscriptions.push(compileAndRunTestCases);
  let addCustomTestCaseCommand = vscode.commands.registerCommand("extension.addCustomTestCase", addCustomTestCase);
  context.subscriptions.push(addCustomTestCaseCommand);
}

function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
  console.log("Extension deactivated.");
}

module.exports = {
  activate,
  deactivate,
};
