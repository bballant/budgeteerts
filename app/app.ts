import { terminal as term } from 'terminal-kit';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import csv from 'csv-parser';

export function getMessage(): string { return "Hello Morld!" }

export const DATABASE = "db/budgeteer.db"

export type Transaction = {
  tx_date: string,
  tx: string,
  name: string,
  memo: string,
  amount: number,
}

export type MonthTotal = {
    yearMonth: string,
    total: number
}

export type TxReport = {
    monthTotals: MonthTotal[],
    maxDebits: Transaction[],
    monthlyAverage: number,
    maxMonth: string,
    maxMonthAmount: number,
    minMonth: string,
    minMonthAmount: number
}

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

// always filter certain things
function staticFilter(transactions: Transaction[]): Transaction[] {
    return transactions.filter((tx) => {
        return tx.name != 'PAYMENT REVERSAL';
    })
}

export function getSelect(db: Database.Database, whereClause: string): Transaction[] {
    try {
        // debits are negative so it's acutally the lowest
        const statement = db.prepare(`SELECT * FROM transactions ${whereClause};`);
        const transactions: Transaction[] = statement.all() as Transaction[];
        return staticFilter(transactions);
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

export function printTransactions(transactions: Transaction[]) {
    const txRows = transactions.map(tx => [tx.tx_date, String(tx.amount), tx.name]);
    const tableRows = [ ["date", "amount", "description"] ].concat(txRows)
    term.table(tableRows);
}

function debitTotal(transactions: Transaction[]): number {
    const debits = transactions.reduce((acc, tx) => {
        const amt = tx.amount
        if (amt < 0) {
            acc.push(Math.abs(amt));
        }
        return acc
    }, [] as number[]);
    return debits.reduce((sum, x) => sum + x);
}

function standardDeviation(values: number[], mean: number): number {
  const squareDiffs = values.map(value => (value - mean) ** 2);
  return Math.sqrt(squareDiffs.reduce((sum, value) => sum + value, 0) / values.length);
}

function monthlyAverage(monthReports: MonthTotal[]): number {
    return monthReports.reduce((sum, m) => sum + m.total, 0) / monthReports.length
}

function mkMonthTotals(transactions: Transaction[]): MonthTotal[] {
    const byMonth = transactions.reduce((acc, tx) => {
        const key = tx.tx_date.substring(0, 7);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(tx);
        return acc;
    }, {} as Record<string, Transaction[]>);

    const allMonths = Object.entries(byMonth).map(([k, v]) => {
        return {
            yearMonth: k,
            total: debitTotal(v)
        }
    })

    const monthAvgs = allMonths.map(m => m.total);
    const unfilteredAvg = monthlyAverage(allMonths);
    const stdDev = standardDeviation(monthAvgs, unfilteredAvg);
    const threshold = 2;
    return allMonths.filter((m) => {
        return Math.abs(m.total - unfilteredAvg) <= threshold * stdDev
    });
}

export function mkTxReport(transactions: Transaction[]): TxReport {
    transactions.sort((a, b) => a.amount - b.amount); // asc
    const max3 = transactions.slice(0, 3); // max negative = max debit
    const monthTotals = mkMonthTotals(transactions).sort((m1, m2) => {
        return m1.yearMonth.localeCompare(m2.yearMonth);
    })
    
    const mAvg = monthlyAverage(monthTotals);

    const maxMonth = monthTotals.reduce((macc, m) => {
        return m.total > macc.total ? m : macc
    });

    const minMonth = monthTotals.reduce((macc, m) => {
        return m.total < macc.total ? m : macc
    });

    return {
        monthTotals: monthTotals,
        maxDebits: max3,
        monthlyAverage: mAvg,
        maxMonth: maxMonth.yearMonth,
        maxMonthAmount: maxMonth.total,
        minMonth: minMonth.yearMonth,
        minMonthAmount: minMonth.total 
    }
}