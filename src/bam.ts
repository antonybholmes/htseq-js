import fs = require("fs");
import zlib = require("zlib");

// import StringifyOptions from "querystring";




export const BUFFER_SIZE: number = 100000;
export const READ_STRAND_FLAG: number = 0x10;
export const MATE_STRAND_FLAG: number = 0x20;
export const BAM1_MAGIC_BYTES: Buffer = Buffer.from([0x42, 0x41, 0x4d, 0x01]); // BAM\1
export const BAM1_MAGIC_NUMBER: number = BAM1_MAGIC_BYTES.readInt32LE(0);












/* export function readSeq(buf: Buffer, offset: number, length: number) {
  let seq = [];

  const end = offset + ((length + 1) >> 1);

  for (let i: number = offset; i < end; ++i) {
    var sb = buf[i];
    seq.push(SEQ_DECODER[(sb & 0xf0) >> 4]);
    seq.push(SEQ_DECODER[sb & 0x0f]);
  }

  return [seq.slice(0, length).join(""), offset + length];
}

export function readCigar(buf: Buffer, offset: number, length: number) {
  let op: number = -1;
  let opChar: string;
  let opLen: number;
  let cigar: string = "";
  let lengthOnRef: number = 0;

  for (let i: number = 0; i < length; ++i) {
    [op, offset] = bamutils.readInt(buf, offset);

    opLen = op >> 4;
    opChar = CIGAR_DECODER[op & 0xf];

    if (
      opChar === "M" ||
      opChar === "EQ" ||
      opChar === "X" ||
      opChar === "D" ||
      opChar === "N" ||
      opChar === "="
    ) {
      lengthOnRef += opLen;
    }

    // Concatenate with rest of cigar
    cigar += opLen + opChar;
  }

  return [cigar, offset];
}

export function readQualPhred33(buf: Buffer, offset: number, length: number) {
  let seq: string = "";
  let v: number;

  for (let i: number = 0; i < length; ++i) {
    [v, offset] = bamutils.readByte(buf, offset)
    seq += String.fromCharCode(v);
  }

  //let seq = buf.slice(offset, offset + length).map(x => String.fromCharCode(x + 33)).join("")

  return [seq, offset]
}
 */
