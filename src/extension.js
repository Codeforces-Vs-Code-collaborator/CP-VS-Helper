const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");  //to create the teminal and run the code 
const axios = require("axios");
const puppeteer = require("puppeteer-extra");  //not used aage
const StealthPlugin = require("puppeteer-extra-plugin-stealth");  //not used aage

let currentProblemData = null;
let workspacePath = "";

async function processProblemData(jsonData) {
  console.log("inside the process problem data");
  if (!jsonData || !jsonData.name || !jsonData.tests) {
    console.log("Invalid problem data received:", jsonData);
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
    console.log("Created workspace folder:", workspacePath);
  }

  const solutionPath = path.join(workspacePath, "solution.cpp");
  if (!fs.existsSync(solutionPath)) {
    const boilerplate = `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`;  //will update to my boilerplate code later, can give a command to user to select their cusom bioilerplpates later
    fs.writeFileSync(solutionPath, boilerplate);
    console.log("Created solution.cpp with boilerplate.");
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
  console.log("inside the execute test cases");
  if (!jsonData || !jsonData.name || !jsonData.tests) {
    console.log("Invalid problem data received:", jsonData);
    return;
  }
  currentProblemData = jsonData;
  const problemName = jsonData.name.replace(/[^a-zA-Z0-9]/g, "_");
  //we have the workspacePath gloablly stored provided we run the task
  if (!workspacePath || workspacePath.length == 0) {
    console.log(
      "the workspace path is not defined, eecute the commands in sequence"
    );
    return;
  }

  const solutionPath = path.join(workspacePath, "solution.cpp");
  const executablePath = path.join(workspacePath, "solution");
  const jsonFilePath = path.join(workspacePath, "data.json");

  const tests = jsonData.tests; // Extract test cases

  if (!Array.isArray(tests)) {
      console.error("Invalid test cases format");
      return;
  }

  const compileCommand = `g++ -o "${executablePath}" "${solutionPath}"`;
  exec(compileCommand, { cwd: workspacePath }, (compileErr, _, compileStderr) => {
      if (compileErr) {
          console.error("Compilation Error:\n", compileStderr);
          return;
      }
      console.log("Compilation Successful!\n");

      tests.forEach((test, index) => {
          console.log("------ FOR TEST CASE ------");
          console.log(test.input);
          const terminal = spawn(`${executablePath}`, { cwd: workspacePath, shell: true });
          terminal.stdin.write(test.input);
          terminal.stdin.end();

          let outputData = "";

          terminal.stdout.on("data", (data) => {
              outputData += data.toString();
          });

          terminal.stderr.on("data", (data) => {
              console.error(`Error executing test case ${index + 1}:\n`, data.toString());
          });

          terminal.on("close", () => {
              console.log("------ YOUR OUTPUT IS ------");
              console.log(outputData.trim());
              console.log("------ CORRECT OUTPUT IS ------");
              console.log(test.output.trim());
              console.log("-----------------------------\n");
              console.log("-----------------------------\n");
          });
      });
  });
}

async function fetchDataToExecute() {
  try {
    const response = await axios.get("http://localhost:10048/bodyData");  //isko fir se likhna pad raha hai correct it
    executeTestCases(response.data);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to fetch problem data from server.");
  }
}

function activate(context) {
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
}

function deactivate() {
  console.log("Extension deactivated.");
}
module.exports = {
  activate,
  deactivate,
};


/*

further suggestions

files ko code wise organise karo in future


*/