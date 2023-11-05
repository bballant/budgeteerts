#!/usr/bin/env tsx

import * as app from "./app/app";
import Database from 'better-sqlite3';
import * as fs from 'fs';

function printUsage() {
  console.log(`Usage:
./budgeteer.ts reset
./budgeteer.ts load path-to-transactions.csv`);
}

function main() {
  if (process.argv.length < 3) {
    printUsage();
    return;
  }

  const db = new Database(app.DATABASE, { verbose: console.log });
  db.pragma('journal_mode = WAL');

  switch (process.argv[2]) {
    case "test":
      console.log(app.getMessage());
      return;
    case "reset":
      app.resetDB(db);
      return;
    case "load":
      if (process.argv.length < 4) {
        printUsage();
        return;
      }
      const csvFilePath = process.argv[3];
      if (!fs.existsSync(csvFilePath)) {
        console.log(`File ${csvFilePath} not found.`)
        printUsage();
        return;
      }
      app.loadCsvIntoDatabase(db, csvFilePath);
      return;
  }
}

main();
