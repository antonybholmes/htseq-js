import fs = require("fs");
import zlib = require("zlib");
import * as bamutils from './bamutils';
import { StringifyOptions } from "querystring";

export const SEQ_DECODER = [
  "=",
  "A",
  "C",
  "x",
  "G",
  "x",
  "x",
  "x",
  "T",
  "x",
  "x",
  "x",
  "x",
  "x",
  "x",
  "N"
];

export const CIGAR_DECODER = [
  "M",
  "I",
  "D",
  "N",
  "S",
  "H",
  "P",
  "=",
  "X",
  "?",
  "?",
  "?",
  "?",
  "?",
  "?",
  "?"
];


export const HEADER_BUFFER_SIZE = 10000;
export const READ_STRAND_FLAG = 0x10;
export const MATE_STRAND_FLAG = 0x20;
export const BAM1_MAGIC_BYTES = Buffer.from([0x42, 0x41, 0x4d, 0x01]); // BAM\1
export const BAM1_MAGIC_NUMBER = BAM1_MAGIC_BYTES.readInt32LE(0);


export class BAMReader {
  // Which block we are in
  blockOffset: number = 0;

  _file: string;
  _chrMap: ChrMap = null;

  constructor(file: string) {
    this._file = file; //fs.openSync(file, "r");
  }

  get chrMap(): ChrMap {
    if (this._chrMap === null) {

    }

    return this._chrMap;
  }

  private _parseBamHeader() {
    let fd = fs.openSync(this._file, "r");

    let buffer = Buffer.alloc(HEADER_BUFFER_SIZE);

    fs.readSync(fd, buffer, 0, HEADER_BUFFER_SIZE, 0);

    let bamBuffer = BAMBinaryReader.from(buffer);

    let bc: number = 0;
    let chrToIndex = {};
    let chrNames = [];
    let chrAliasTable = {};

    let lRef: number = -1;
    let lName: number = -1;
    let name: string;
    let magic: number = -1;
    let lText: number = -1;
    let samHeader: string;
    let nRef: number = -1;

    magic = bamBuffer.readInt(); //bamutils.readString(buf, bc, 4);

    if (magic === BAM1_MAGIC_NUMBER) {
      lText = bamBuffer.readInt();
      samHeader = bamBuffer.readString(lText);
      nRef = bamBuffer.readInt();

      console.log("hmm", magic, lText, nRef);

      for (let i: number = 0; i < nRef; ++i) {
        lName = bamBuffer.readInt();
        console.log("lName", lName);

        name = bamBuffer.readStringNullTerm(lName);
        lRef = bamBuffer.readInt();

        console.log(lName, name, lRef);

        chrToIndex[name] = i;
        chrNames[i] = name;
      }
    }

    return {
      offset: bc,
      chrNames: chrNames,
      chrToIndex: chrToIndex
    };
  }

  parseAlignments(buf, offset: number) {
    let blockSize: number = -1;
    let refId: number = -1;
    let pos: number = -1;
    let lReadName: number = -1;
    let mapQ: number = -1;
    let bin: number = -1;
    let readName: string;
    let nCigarOp: number = -1;
    let lSeq: number = -1;
    let nextRefId: number = -1;
    let flag: number = -1;
    let nextPos: number = -1;
    let tlen: number = -1;
    let cigar: Array<Number>;
    let seq: string;
    let qual: string;

    // Alignment offset counter
    let ac: number = -1;
    //let blockEnd:number = -1;

    //console.log(buf.toString(offset));

    while (offset < buf.length) {
      ac = offset;

      [blockSize, ac] = bamutils.readInt(buf, ac);
      [refId, ac] = bamutils.readInt(buf, ac);
      [pos, ac] = bamutils.readInt(buf, ac);
      [lReadName, ac] = bamutils.readByte(buf, ac);
      [mapQ, ac] = bamutils.readByte(buf, ac);
      [bin, ac] = bamutils.readShort(buf, ac);
      [nCigarOp, ac] = bamutils.readShort(buf, ac);
      [flag, ac] = bamutils.readShort(buf, ac);
      [lSeq, ac] = bamutils.readInt(buf, ac);
      [nextRefId, ac] = bamutils.readInt(buf, ac);
      [nextPos, ac] = bamutils.readInt(buf, ac);
      [tlen, ac] = bamutils.readInt(buf, ac);
      [readName, ac] = bamutils.readStringNullTerm(buf, ac, lReadName);

      [cigar, ac] = readCigar(buf, ac, nCigarOp);

      [seq, ac] = readSeq(buf, ac, lSeq);

      [qual, ac] = readQualPhred33(buf, ac, lSeq);

      //console.log(blockSize, readName, offset, seq, cigar, qual);

      // Go to the next block
      offset += blockSize + 4;
    }

    return {
      offset: offset
    };
  }

  static fromFile(file: string) {
    return new BamReader
  }
}

class BAMBinaryReader extends bamutils.BinaryReader {
  /**
   * Specialized binary reader with methods specifically for BAM files.
   * 
   * @param data Raw data buffer.
   */
  constructor(data: Buffer) {
    super(data);
  }

  /**
   * Read the sequence.
   * 
   * @param length Length of read in bases.
   */
  readSeq(length: number): string {
    let seq = [];

    const end = this._offset + ((length + 1) >> 1);

    for (let i: number = this._offset; i < end; ++i) {
      var sb = this._data[i];
      seq.push(SEQ_DECODER[(sb & 0xf0) >> 4]);
      seq.push(SEQ_DECODER[sb & 0x0f]);
    }

    // seq might have one extra character (if lseq is an odd number) which is why we
    // slice the array to remove the unused 4bits
    this._offset += length;

    return seq.slice(0, length).join("");
  }

  readCigar(length: number): string {
    let op: number = -1;
    let opChar: string;
    let opLen: number;
    let cigar: string = "";
    let lengthOnRef: number = 0;

    for (let i: number = 0; i < length; ++i) {
      op = this.readInt();

      opLen = op >> 4;
      opChar = CIGAR_DECODER[op & 0xf];

      if (
        opChar == "M" ||
        opChar == "EQ" ||
        opChar == "X" ||
        opChar == "D" ||
        opChar == "N" ||
        opChar == "="
      ) {
        lengthOnRef += opLen;
      }

      // Concatenate with rest of cigar
      cigar += opLen + opChar;
    }

    return cigar;
  }

  readQualPhred33(length: number): string {
    let seq: string = "";
    let v: number;

    for (let i: number = 0; i < length; ++i) {
      seq += String.fromCharCode(this.readByte());
    }

    //let seq = buf.slice(offset, offset + length).map(x => String.fromCharCode(x + 33)).join("")

    return seq;
  }

  from(buffer: Buffer): BAMBinaryReader {
    return new BAMBinaryReader(buffer);
  }
}


export function readSeq(buf: Buffer, offset: number, length: number) {
  let seq = [];

  const end = offset + ((length + 1) >> 1);

  for (let i: number = offset; i < end; ++i) {
    var sb = buf[i];
    seq.push(SEQ_DECODER[(sb & 0xf0) >> 4]);
    seq.push(SEQ_DECODER[sb & 0x0f]);
  }

  // seq might have one extra character (if lseq is an odd number) which is why we
  // slice the array to remove the unused 4bits
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
      opChar == "M" ||
      opChar == "EQ" ||
      opChar == "X" ||
      opChar == "D" ||
      opChar == "N" ||
      opChar == "="
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


export class ChrMap {
  private _chrToIndex;
  private _chrNames;

  constructor(chrToIndex: Object, chrNames: Array<String>) {
    this._chrToIndex = chrToIndex;
    this._chrNames = chrNames;
  }

  getIndex(chr: string): number {
    return this._chrToIndex[chr];
  }

  getChr(index: number): string {
    return this._chrNames[index];
  }
}