#!/usr/bin/env tsx

import * as app from "./app/app";
import Database from 'better-sqlite3';
import * as fs from 'fs';

function printUsage() {
  console.log(`Usage:
./budgeteer.ts reset
./budgeteer.ts load path-to-transactions.csv
./budgeteer.ts highest
./budgeteer.ts report
./budgeteer.ts select* "WHERE tx_date > '2023-10-31' ORDER BY amount ASC" `);
}

function main() {
  if (process.argv.length < 3) {
    printUsage();
    return;
  }

  const db = new Database(app.DATABASE, { verbose: console.log });
  db.pragma('journal_mode = WAL');

  switch (process.argv[2]) {
    case "select*":
      let w = process.argv[3] ? process.argv[3] : "ORDER BY amount ASC LIMIT 10"
      const selectResults = app.getSelect(db, w);
      app.printTransactions(selectResults);
      return;
    case "highest":
      const highest = app.getSelect(db, "WHERE name <> 'PAYMENT REVERSAL' ORDER BY amount ASC LIMIT 10");
      app.printTransactions(highest);
      return;
    case "report":
      const res = app.getSelect(db, "ORDER BY tx_date;");
      const report = app.mkTxReport(res);
      console.log(report);
      return;
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
    default:
      printUsage()
      return;
  }
}

main();
