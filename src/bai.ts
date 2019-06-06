import * as bamutils from './bamutils';

export const BAI1_MAGIC_BYTES = Buffer.from([0x42, 0x41, 0x49, 0x01]); // BAI\1
export const BAI1_MAGIC_NUMBER = BAI1_MAGIC_BYTES.readInt32LE(0);


export function reg2bins(start: number, end: number) {
  let i: number = 0;
  let k: number; 
  
  let list = [];

  if (end >= 1 << 29) {
    end = 1 << 29;
  }

  --end;

  list.push(0);

  for (k = 1 + (start >> 26); k <= 1 + (end >> 26); ++k) {
    list.push(k);
  }

  for (k = 9 + (start >> 23); k <= 9 + (end >> 23); ++k) {
    list.push(k);
  }

  for (k = 73 + (start >> 20); k <= 73 + (end >> 20); ++k) {
    list.push(k);
  }

  for (k = 585 + (start >> 17); k <= 585 + (end >> 17); ++k) {
    list.push(k);
  }

  for (k = 4681 + (start >> 14); k <= 4681 + (end >> 14); ++k) {
    list.push(k);
  }

  return list;
}

export class BAI {
  
}