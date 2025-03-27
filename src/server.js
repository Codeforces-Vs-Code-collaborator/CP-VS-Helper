const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const vscode = require("vscode"); 

const app = express();
const SUPPORTED_PORTS = [4244, 6174, 10042, 10043, 10045, 27121];
let currentPort = null;
let server = null;
let problemData = null;

app.use(cors());
app.use(bodyParser.json());

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
 * Starts the Express server on an available port
 */
async function startServer() {
  for (const port of SUPPORTED_PORTS) {
    try {
      await new Promise((resolve, reject) => {
        server = app.listen(port, "127.0.0.1", () => {
          currentPort = port;
          console.log(`✅ Server running on port ${port}`);
          vscode.window.showInformationMessage(`CodeAide server started on port ${port}`);
          resolve();
        });

        server.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.warn(`⚠ Port ${port} in use, trying next...`);
            reject(err);
          } else {
            reject(err);
          }
        });
      });
      break; // Stop trying once a port is found
    } catch (error) {
      continue; // Try next port
    }
  }

  if (!server) {
    vscode.window.showErrorMessage("❌ Failed to start server: No available ports.");
  }
}

/**
 * Stops the running Express server
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

      console.log(`🛑 Server on port ${currentPort} stopped`);
      vscode.window.showInformationMessage(`CodeAide server stopped`);
      server = null;
      resolve();
    });
  });
}

/**
 * Get current server port
 */
function getCurrentPort() {
  return currentPort;
}

module.exports = { startServer, stopServer, getCurrentPort };
