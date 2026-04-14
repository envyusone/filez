import 'dotenv/config';
import client from "./client.js"; // Changed 'db' to 'client' to match your client.js

async function seed() {
  try {
    await client.connect();

    console.log("Cleaning tables...");
    await client.query("DROP TABLE IF EXISTS files CASCADE;");
    await client.query("DROP TABLE IF EXISTS folders CASCADE;");

    console.log("Creating tables...");
    await client.query(`
      CREATE TABLE folders (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );
      CREATE TABLE files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        size INTEGER NOT NULL,
        folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
        CONSTRAINT unique_file_in_folder UNIQUE (name, folder_id)
      );
    `);

    console.log("Seeding folders...");
    const folderNames = ['Documents', 'Images', 'Work'];
    const folders = [];

    for (const name of folderNames) {
      const { rows: [folder] } = await client.query(
        "INSERT INTO folders (name) VALUES ($1) RETURNING *;",
        [name]
      );
      folders.push(folder);
    }

    console.log("Seeding files...");
    for (const folder of folders) {
      for (let i = 1; i <= 5; i++) {
        await client.query(
          "INSERT INTO files (name, size, folder_id) VALUES ($1, $2, $3);",
          [
            `${folder.name}_file_${i}.txt`, 
            Math.floor(Math.random() * 1000) + 1, 
            folder.id
          ]
        );
      }
    }

    console.log("🌱 Database seeded.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await client.end();
  }
}

seed();