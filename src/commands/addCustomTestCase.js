const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const state = require("../state");
const { getWebviewContent } = require("../webview");
const { parseTestCaseInput } = require("../utils/parseTestCases");

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
        if (message.command === "submit") {
          resolve(message.data);
          panel.dispose();
        } else if (message.command === "cancel") {
          reject(new Error("User cancelled the input."));
          panel.dispose();
        }
      }
    );
  });
}

async function addCustomTestCase() {
  if (!state.workspacePath) {
    vscode.window.showErrorMessage("No workspace selected. Run 'Run Problem' first.");
    return;
  }

  try {
    const { input, output } = await showTestCaseInputForm();
    const formattedInput = parseTestCaseInput(input);
    const formattedOutput = output.trim();
    const formattedTestCase = `Input:\n${formattedInput}\nOutput:\n${formattedOutput}\n`;
    
    const testCaseFilePath = path.join(state.workspacePath, "testcases.txt");
    fs.appendFileSync(testCaseFilePath, formattedTestCase);
    vscode.window.showInformationMessage("Test Case added successfully!");
    state.outputChannel.appendLine(`Added Test Case:\n${formattedTestCase}`);
  } catch (err) {
    vscode.window.showWarningMessage("Test case addition was cancelled or failed.");
  }
}

module.exports = { addCustomTestCase };
