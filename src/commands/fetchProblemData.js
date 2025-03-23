const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const state = require("../state");

async function processProblemData(jsonData) {
  state.outputChannel.appendLine("inside the process problem data");
  if (!jsonData || !jsonData.name || !jsonData.tests) {
    state.outputChannel.appendLine("Invalid problem data received: " + JSON.stringify(jsonData));
    return;
  }

  state.currentProblemData = jsonData;

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
  state.workspacePath = path.join(selectedFolder, problemName);

  if (!fs.existsSync(state.workspacePath)) {
    fs.mkdirSync(state.workspacePath, { recursive: true });
    state.outputChannel.appendLine("Created workspace folder: " + state.workspacePath);
  }

  const solutionPath = path.join(state.workspacePath, "solution.cpp");
  if (!fs.existsSync(solutionPath)) {
    const boilerplate = `//${state.currentProblemData.url}\n
#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`;
    fs.writeFileSync(solutionPath, boilerplate);
    state.outputChannel.appendLine("Created solution.cpp with boilerplate.");

    vscode.workspace.openTextDocument(solutionPath).then((doc) => {
      vscode.window.showTextDocument(doc);
    });
    state.outputChannel.appendLine("Opened solution.cpp file");
  }
}

async function fetchProblemData() {
  try {
    const response = await axios.get("http://localhost:10042/bodyData");
    await processProblemData(response.data);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to fetch problem data from server.");
  }
}

module.exports = { fetchProblemData };
