import { terminal as term } from 'terminal-kit';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import csv from 'csv-parser';

export function getMessage(): string { return "Hello Morld!" }

export const DATABASE = "db/budgeteer.db"

export type Transaction = {
  tx_date: string;
  tx: string;
  name: string;
  memo: string;
  amount: number;
};

export function resetDB(db: Database.Database) {
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

export function loadCsvIntoDatabase(db: Database.Database, filePath: string) {
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