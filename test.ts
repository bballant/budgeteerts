#!/usr/bin/env tsx

// import { terminal as term } from 'terminal-kit';
// 
// const base = "/home/bballant/c/rs/image-workspace/source/small/"
// const images = [
//   "20220213-01-DSCF5205-RT.jpg",
//   "20220220-46-DSCF5302.jpg",
//   "20220220-71-DSCF5327.jpg",
//   "20220220-79-DSCF5335.jpg",
//   "20220220-89-DSCF5345.jpg",
//   "20220220-93-DSCF5349.jpg",
//   "20220226-23-DSCF0117.jpg",
//   "20220226-31-DSCF0125.jpg",
//   "20220226-33-DSCF0127.jpg",
//   "20220226-35-DSCF0129.jpg",
//   "20220226-40-DSCF0134.jpg",
//   "20220227-06-DSCF0156.jpg",
//   "20220227-17-DSCF0165.jpg",
//   "20220227-24-DSCF0175.jpg",
//   "20220410-19-DSCF0578.jpg",
//   "3Y8A4565.jpg",
//   "5903317853_50166482d1_k.jpg",
//   "5903322485_9d9d095f47_k.jpg",
//   "DSCF3424.jpg",
//   "DSCF3426.jpg",
//   "IMG_1969.jpg",
//   "IMG_1970.jpg",
//   "IMG_2125.jpg",
//   "IMG_2126.jpg",
//   "IMG_3875.jpg",
// ]
// 
// 
// term.red("Cool\n");

//for (let img of images) {
//  term.drawImage(base + img);
//}

import * as fs from 'fs';

function testReadStream(filePath: string) {
  let readStream = fs.createReadStream(filePath);

  readStream
    .on('error', (error) => {
      console.error('An error occurred:', error);
    })
    .on('readable', () => {
      let chunk;
      while (null !== (chunk = readStream.read())) {
        console.log(`Received ${chunk.length} bytes of data.`);
        console.log(chunk.toString());
      }
    })
    .on('end', () => {
      console.log('There will be no more data to read.');
    });
}

function main() {
  // Replace 'path/to/your/file.csv' with the actual file path
  testReadStream('/home/bballant/Downloads/cc-2843-11-01-2022_11-01-2023.csv');
}

main();