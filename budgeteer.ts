#!/usr/bin/env tsx

import * as util from "./src/util.js";

const getRandomElement = (arr: string[]): string => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
};

if (process.argv.length < 3) {
    console.error("Please provide a list of strings.");
    process.exit(1);
}

const inputStrings = process.argv.slice(2);
console.log(getRandomElement(inputStrings));
console.log("message:" + util.getMessage());
