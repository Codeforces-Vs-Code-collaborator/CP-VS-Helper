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
    outputChannel.appendLine(
      "Invalid problem data received: " + JSON.stringify(jsonData)
    );
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
    const boilerplate = `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`;
    fs.writeFileSync(solutionPath, boilerplate);
    outputChannel.appendLine("Created solution.cpp with boilerplate.");

    //enter the file as soon as it is created so that the user doesn't have to navigate
    vscode.workspace.openTextDocument(solutionPath).then((doc) => {
      vscode.window.showTextDocument(doc);
    });
    outputChannel.appendLine("Inside solution.cpp file");
  }
}

async function fetchProblemData() {
  try {
    const response = await axios.get("http://localhost:10048/bodyData");
    processProblemData(response.data);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to fetch problem data from server.");
  }
}

async function executeTestCases(jsonData) {
  outputChannel.appendLine("inside the execute test cases");
  if (!jsonData || !jsonData.name || !jsonData.tests) {
    outputChannel.appendLine(
      "Invalid problem data received: " + JSON.stringify(jsonData)
    );
    return;
  }
  currentProblemData = jsonData;
  const problemName = jsonData.name.replace(/[^a-zA-Z0-9]/g, "_");
  if (!workspacePath || workspacePath.length === 0) {
    outputChannel.appendLine(
      "The workspace path is not defined, execute the commands in sequence"
    );
    return;
  }

  const solutionPath = path.join(workspacePath, "solution.cpp");
  const executablePath = path.join(workspacePath, "solution");
  const tests = jsonData.tests;

  if (!Array.isArray(tests)) {
    outputChannel.appendLine("Invalid test cases format");
    return;
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
        terminal.stdin.write(test.input);
        terminal.stdin.end();

        let outputData = "";

        terminal.stdout.on("data", (data) => {
          outputData += data.toString();
        });

        terminal.stderr.on("data", (data) => {
          outputChannel.appendLine(
            `Error executing test case ${index + 1}:\n` + data.toString()
          );
        });

        terminal.on("close", () => {
          const ourOutput = outputData.trim();
          const expectedOutput = test.output.trim();
          const passed = ourOutput === expectedOutput;
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

async function fetchDataToExecute() {
  try {
    const response = await axios.get("http://localhost:10048/bodyData");
    executeTestCases(response.data);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to fetch problem data from server.");
  }
}

function activate(context) {
  outputChannel = vscode.window.createOutputChannel("Test Cases Output");
  outputChannel.show();

  console.log("Extension activated.");
  let runProblemCommand = vscode.commands.registerCommand(
    "extension.runProblem",
    fetchProblemData
  );
  context.subscriptions.push(runProblemCommand);
  let compileAndRunTestCases = vscode.commands.registerCommand(
    "extension.compileAndRunTestCases",
    fetchDataToExecute
  );
  context.subscriptions.push(compileAndRunTestCases);
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
