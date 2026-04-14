import express from "express";
import client from "./db/client.js";

const app = express();

app.use(express.json());

app.get("/files", async (req, res, next) => {
  try {
    const { rows } = await client.query(`
      SELECT files.*, folders.name AS folder_name 
      FROM files 
      JOIN folders ON files.folder_id = folders.id;
    `);
    res.send(rows);
  } catch (error) {
    next(error);
  }
});

app.get("/folders", async (req, res, next) => {
  try {
    const { rows } = await client.query("SELECT * FROM folders;");
    res.send(rows);
  } catch (error) {
    next(error);
  }
});

app.get("/folders/:id", async (req, res, next) => {
  try {
    const { rows } = await client.query(`
      SELECT folders.*, json_agg(files.*) AS files
      FROM folders
      LEFT JOIN files ON folders.id = files.folder_id
      WHERE folders.id = $1
      GROUP BY folders.id;
    `, [req.params.id]);

    const folder = rows[0];

    if (!folder) {
      return res.status(404).send({ message: "Folder not found" });
    }

      folder.files = [];
    }

    res.send(folder);
  } catch (error) {
    next(error);
  }
});

app.post("/folders/:id/files", async (req, res, next) => {
  try {
    const folderId = req.params.id;

    // 1. Check if folder exists
    const folderCheck = await client.query("SELECT * FROM folders WHERE id = $1", [folderId]);
    if (folderCheck.rows.length === 0) {
      return res.status(404).send({ message: "Folder not found" });
    }

    // 2. Check if request body is provided/empty (Fixes your 500 error)
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send({ message: "Request body not provided" });
    }

    // 3. Check for required fields
    const { name, size } = req.body;
    if (!name || !size) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    // 4. Create the file
    const { rows: [newFile] } = await client.query(`
      INSERT INTO files (name, size, folder_id) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `, [name, size, folderId]);

    res.status(201).send(newFile);
  } catch (error) {
    next(error);
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send({ 
    message: err.message || "Internal Server Error" 
  });
});

export default app;