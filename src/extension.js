const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const axios = require("axios");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

let currentProblemData = null;
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
  const workspacePath = path.join(selectedFolder, problemName);

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
    console.log("Created workspace folder:", workspacePath);
  }

  const solutionPath = path.join(workspacePath, "solution.cpp");
  if (!fs.existsSync(solutionPath)) {
    const boilerplate = `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`;
    fs.writeFileSync(solutionPath, boilerplate);
    console.log("Created solution.cpp with boilerplate.");
  }

  const executablePath = path.join(workspacePath, "solution");

  exec(`g++ -o "${executablePath}" "${solutionPath}"`, (error) => {
    if (error) {
      console.log("Compilation Error:", error.message);
      return;
    }
    console.log("Compilation successful.");

    vscode.workspace.openTextDocument(solutionPath).then((document) => {
      vscode.window.showTextDocument(document);
    });
    vscode.window.showInformationMessage(
      `Problem "${jsonData.name}" set up successfully!`
    );
  });
}

async function fetchProblemData() {
  try {
    const response = await axios.get("http://localhost:10048/bodyData");
    processProblemData(response.data);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to fetch problem data from server.");
  }
}

async function submitToCodeforces() {
  if (!currentProblemData) {
    vscode.window.showErrorMessage("No problem data available for submission.");
    return;
  }

  const problemUrl = currentProblemData.url;
  if (typeof problemUrl !== "string" || !problemUrl.trim()) {
    vscode.window.showErrorMessage(
      "No valid 'url' property found in problem data."
    );
    return;
  }

  const regex =
    /^https?:\/\/codeforces\.com\/(?:contest|problemset)\/problem\/(\d+)\/([A-Za-z0-9]+)$/;
  const match = problemUrl.match(regex);

  if (!match) {
    vscode.window.showErrorMessage("Invalid Codeforces URL format.");
    return;
  }

  const contestId = match[1];
  const problemIndex = match[2];

  const workspacePath = vscode.workspace.rootPath;
  console.log("line 116 par hoon");
  if (!workspacePath) {
    vscode.window.showErrorMessage("No active workspace found.");
    return;
  }
  const problemFolderName = currentProblemData.name.replace(
    /[^a-zA-Z0-9]/g,
    "_"
  );
  const solutionPath = path.join(
    workspacePath,
    problemFolderName,
    "solution.cpp"
  );

  if (!fs.existsSync(solutionPath)) {
    vscode.window.showErrorMessage("Solution file not found.");
    return;
  }
  const solutionCode = fs.readFileSync(solutionPath, "utf-8");
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  try {
    const cookies = [
      {
        name: "JSESSIONID",
        value: "A06C096E5DA9A31B7A23585AE41AF288", // Paste from DevTools
        domain: "codeforces.com", // Must match exactly
        path: "/", // Usually "/"
        httpOnly: true, // Match DevTools
        secure: true, // Match DevTools
      },
    ];

    await page.setCookie(...cookies);
    await page.goto(`https://codeforces.com/contest/${contestId}/submit`);

    await page.select("select[name='submittedProblemIndex']", problemIndex);

    await page.evaluate((code) => {
      document.querySelector("textarea[name='source']").value = code;
    }, solutionCode);

    await page.select("select[name='programTypeId']", "54");
    await page.evaluate(() => {
      const btn = document.querySelector("input[type='submit']");
      if (btn) {
        btn.scrollIntoView();
      }
    });

    await page.click("input[type='submit']", { force: true });
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    vscode.window.showInformationMessage(`Submitted solution for ${problemId}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Submission failed: ${error.message}`);
  } finally {
    // await browser.close();
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
// console.log("line 195 par hoon");
function activate(context) {
  console.log("Extension activated.");
  // Command to set up the problem (create folder, solution.cpp, and compile)
  let runProblemCommand = vscode.commands.registerCommand(
    "extension.runProblem",
    fetchProblemData
  );
  context.subscriptions.push(runProblemCommand);
  // Command to submit the solution to Codeforces
  let submitCommand = vscode.commands.registerCommand(
    "extension.submitToCodeforces",
    submitToCodeforces
  );
  context.subscriptions.push(submitCommand);
}

function deactivate() {
  console.log("Extension deactivated.");
}

module.exports = {
  activate,
  deactivate,
};