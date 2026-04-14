import pg from "pg";
import 'dotenv/config';

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'filez',
  password: 'password', 
});

export default db;