// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const vscode = require("vscode"); // Added to show notifications from server

const app = express();
const DEFAULT_PORT = 10042;
let currentPort = DEFAULT_PORT;

app.use(cors());
app.use(bodyParser.json());

let problemData = null;
let server = null;

app.post("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "No URL provided!" });
    }

    problemData = req.body;
    console.log("Received problem data:", problemData);

    res.json({ message: "Problem data received successfully!" });
  } catch (error) {
    console.error("Error handling POST request:", error);
    vscode.window.showErrorMessage(`Server error: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/bodyData", (req, res) => {
  try {
    if (!problemData) {
      return res.status(404).json({ message: "No problem data available!" });
    }
    res.json(problemData);
  } catch (error) {
    console.error("Error handling GET request:", error);
    vscode.window.showErrorMessage(`Server error: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("CodeAide server is running! 🚀");
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  vscode.window.showErrorMessage(`Server error: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

/**
 * Starts the Express server
 * @param {number} [port=DEFAULT_PORT] - Port to start server on
 * @returns {Promise<void>}
 */
function startServer(port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    if (server) {
      vscode.window.showWarningMessage("Server is already running");
      return resolve();
    }

    currentPort = port;
    server = app.listen(port, "127.0.0.1", () => {
      console.log(`Server is running on port ${port}`);
      vscode.window.showInformationMessage(`CodeAide server started on port ${port}`);
      resolve();
    });

    server.on("error", (err) => {
      server = null;
      console.error("Server error:", err);
      
      let userMessage = `Failed to start server: ${err.message}`;
      if (err.code === 'EADDRINUSE') {
        userMessage = `Port ${port} is already in use. Please try another port.`;
      }
      
      vscode.window.showErrorMessage(`CodeAide: ${userMessage}`, { modal: true });
      reject(err);
    });
  });
}

/**
 * Stops the running Express server
 * @returns {Promise<void>}
 */
function stopServer() {
  return new Promise((resolve, reject) => {
    if (!server) {
      vscode.window.showWarningMessage("No server is currently running");
      return resolve();
    }

    server.close((err) => {
      if (err) {
        console.error("Error stopping server:", err);
        vscode.window.showErrorMessage(`Failed to stop server: ${err.message}`);
        return reject(err);
      }

      server = null;
      console.log(`Server on port ${currentPort} stopped`);
      vscode.window.showInformationMessage(`CodeAide server stopped`);
      resolve();
    });
  });
}

/**
 * Get current server port
 * @returns {number}
 */
function getCurrentPort() {
  return currentPort;
}

module.exports = {
  startServer,
  stopServer,
  getCurrentPort
};
