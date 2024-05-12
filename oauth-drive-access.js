import fs from "fs";
import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Initialize Google Drive API
const drive = google.drive({
  version: "v3",
});

// OAuth2 credentials
const credentials = JSON.parse(fs.readFileSync("./credentials.json", "utf-8")); // Path to your client credentials JSON file

const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Generate an authentication URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive.readonly"],
});

// Exchange authorization code for access token
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    res.send(
      "Authentication successful! You can now use the /files endpoint to fetch PDF files."
    );
  } catch (error) {
    console.error("Error retrieving access token:", error);
    res.status(500).send("Error retrieving access token");
  }
});

// Route to list files in a specific folder by folder ID
app.get("/files/:folderId", async (req, res) => {
  const folderId = req.params.folderId;

  try {
    // Check if access token is available
    if (!oAuth2Client.credentials) {
      return res.status(401).json({
        error: "Authentication required. Please authorize the application.",
      });
    }

    // Set the access token
    oAuth2Client.setCredentials(oAuth2Client.credentials);

    // Fetch files from the specified folder
    const response = await drive.files.list({
      auth: oAuth2Client,
      pageSize: 10,
      fields: "files(name, id)",
      q: `'${folderId}' in parents`, // Filter by the specified folder ID
    });

    const files = response.data.files;
    res.json(files);
  } catch (err) {
    console.error("Error listing files:", err);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Authorize the application by visiting: ${authUrl}`);
});
