#!/usr/bin/env tsx

import * as util from "./src/util.js";
import { terminal as term } from 'terminal-kit';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import csv from 'csv-parser';

const DATABASE = "db/budgeteer.db"

type Transaction = {
  tx_date: string;
  tx: string;
  name: string;
  memo: string;
  amount: number;
};

function resetDB(db: Database.Database) {
  const resetScript = 
  `
    DROP TABLE IF EXISTS transactions;
    CREATE TABLE transactions (
        tx_date TEXT NOT NULL,
        tx TEXT NOT NULL,
        name TEXT NOT NULL,
        memo TEXT,
        amount REAL NOT NULL,
        UNIQUE(tx_date, name, memo, amount)
    );
  `
  term.yellow("Resetting Database:\n");
  db.exec(resetScript);
  term.yellow("Complete:\n");
}

function insertTransaction(db: Database.Database, transaction: Transaction) {
  const insert: Database.Statement = db.prepare(`INSERT INTO transactions (tx_date, tx, name, memo, amount) VALUES (?, ?, ?, ?, ?)`);
  insert.run(transaction.tx_date, transaction.tx, transaction.name, transaction.memo, transaction.amount);
}

function loadCsvIntoDatabase(db: Database.Database, filePath: string) {
  const transactions: Transaction[] = [];
  console.log(filePath)
  let readStream = fs.createReadStream(filePath);
  readStream
    .on('error', (error) => {
      console.error('An error occurred while initializing read stream:', error);
      db.close();
    }); 

  readStream
    .pipe(csv())
    .on('data', (data) => {
      console.log('ok');
      transactions.push({
      tx_date: data.Date,
      tx: data.Transaction,
      name: data.Name,
      memo: data.Memo,
      amount: parseFloat(data.Amount),
    })})
    .on('end', () => {
      try {
        db.exec('BEGIN TRANSACTION;');
        for (const transaction of transactions) {
          insertTransaction(db, transaction);
        }
        db.exec('COMMIT;');
        console.log('CSV data has been loaded into the database successfully.');
      } catch (error) {
        db.exec('ROLLBACK;');
        console.error('An error occurred while inserting data:', error);
      }
      db.close();
    })
    .on('error', (error) => {
      console.error('An error occurred while reading the file:', error);
      db.close();
    }); 
}

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

  const db = new Database(DATABASE, { verbose: console.log });
  db.pragma('journal_mode = WAL');

  switch (process.argv[2]) {
    case "reset":
      resetDB(db);
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
      loadCsvIntoDatabase(db, csvFilePath);
      return;
  }
}

main();
