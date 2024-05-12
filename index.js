import fs from "fs";
import path from "path";
import * as url from "url";
import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const credentialFilename = "service-credentials.json";
const scopes = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: credentialFilename,
  scopes: scopes,
});

// Initialize Google Drive API
const drive = google.drive({ version: "v3", auth });

// Route to list files in a specific folder by folder ID
app.get("/files/:folderId", async (req, res) => {
  const folderId = req.params.folderId;

  try {
    // Fetch files from the specified folder
    const response = await drive.files.list({
      pageSize: 10,
      fields: "files(name, id)",
      q: `'${folderId}' in parents`, // Filter by the specified folder ID
    });
    const files = response.data.files;
    // Array to hold all download promises
    const downloadPromises = [];

    for (const file of files) {
      const downloadPromise = new Promise((resolve, reject) => {
        // Download each file and save it to the "uploads" folder
        const destPath = path.join(__dirname, "uploads", file.name);
        const destStream = fs.createWriteStream(destPath);
        const fileStream = drive.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "stream" }
        );

        fileStream.then((stream) => {
          if (!stream || !stream.data) {
            console.error(
              `Error downloading file ${file.name}: File stream is undefined`
            );
            reject(`Failed to download file ${file.name}`);
            return;
          }

          stream.data
            .on("error", (err) => {
              console.error(`Error downloading file ${file.name}:`, err);
              reject(`Failed to download file ${file.name}`);
            })
            .pipe(destStream)
            .on("finish", () => {
              console.log(`File ${file.name} downloaded successfully`);
              resolve();
            });
        });
      });

      // Add the download promise to the array
      downloadPromises.push(downloadPromise);
    }

    // Wait for all download promises to resolve
    await Promise.all(downloadPromises);

    res.json(files);
  } catch (err) {
    console.error("Error listing files:", err);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
