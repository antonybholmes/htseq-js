import { BinaryReader } from "./binaryreader";
import { ChrMap } from "./chrmap";
// import { runInThisContext } from "vm";
import { Alignment } from "./alignment"
import { VFOffset } from "./vfoffset";

export const READ_STRAND_FLAG: number = 0x10;
export const MATE_STRAND_FLAG: number = 0x20;
export const BAM1_MAGIC_BYTES: Buffer = Buffer.from([0x42, 0x41, 0x4d, 0x01]); // BAM\1

// Indentify header in block
export const BAM_MAGIC_NUMBER: number = BAM1_MAGIC_BYTES.readInt32LE(0);


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

/**
 * Represents an uncompressed BAM block taken from a BGZF block.
 */
export class BAMBlockReader extends BinaryReader {
  // Cache current alignment.

  private _headerText: string = null;
  private _chrMap: ChrMap = null;
  private _blockSize: number = -1;
  private _refId: number = -1;
  private _pos: number = -1;
  private _lReadName: number = -1;
  private _mapQ: number = -1;
  private _bin: number = -1;
  private _readName: string = null;
  private _nCigarOp: number = -1;
  private _lSeq: number = -1;
  private _nextRefId: number = -1;
  private _flag: number = -1;
  private _nextPos: number = -1;
  private _tlen: number = -1;
  private _cigar: string = null;
  private _seq: string = null;
  private _qual: string = null;
  private _record: Alignment = null;

  /**
   * Specialized binary reader with methods specifically for BAM files.
   * 
   * @param data Raw data buffer.
   */
  constructor(data?: Buffer) {
    super(data);
  }

  /**
   * Returns a mapping between ref ids and chrosomes. This must be
   * called on a block starting with the magic BAM number (typically the
   * first block), otherwise it will fail.
   */
  public get chrMap(): ChrMap {
    if (this._chrMap === null) {
      // Make sure we are at beginning of block
      this.reset();

      const magic: number = this.readInt(); // bamutils.readString(buf, bc, 4);
      
      // Only the header contains the magic number plus other
      // reference list, all other blocks just contain the alignments
      // so if this is not the header, reset the buffer and skip
      if (magic === BAM_MAGIC_NUMBER) {
        const chrToIndex: object = {};
        const chrNames = [];
        const chrAliasTable = {};

        const lText: number = this.readInt();
        const text: string = this.readString(lText);
        const nRef: number = this.readInt();

        let lRef: number = -1;
        let lName: number = -1;
        let name: string;

        for (let i: number = 0; i < nRef; ++i) {
          lName = this.readInt();
          name = this.readStringNullTerm(lName);
          lRef = this.readInt();

          chrToIndex[name] = i;
          chrNames[i] = name;
        }
        
        this._chrMap = new ChrMap(chrToIndex, chrNames);
      } else {
        // Assume we are in a block of alignments so reset
        // buffer pointer back to 0 so we can read all of
        // the alignments
        this.reset();
      }
    }

    return this._chrMap;
  }

  /**
   * Getter that returns the unformatted heading text.
   */
  public get headerText() {
    if (this._headerText === null) {
      this.reset();

      const magic: number = this.readInt();
    
      // Only the header contains the magic number plus other
      // reference list, all other blocks just contain the alignments
      // so if this is not the header, reset the buffer and skip
      if (magic === BAM_MAGIC_NUMBER) {
        const lText: number = this.readInt();
        this._headerText = this.readString(lText);
      } else {
        // Since this is not the magic number, it must be a block of 
        // alignments so reset the buffer pointer to 0 so that the 
        // alignments can be read.
        this.reset();
      }
    }

    return this._headerText
  }

  /**
   * Sets the buffer position within the uncompressed data using
   * the coffset field of the virtual file offset.
   * 
   * @param vfoffset   A virtual file offset object.
   */
  public setBlockByVFOffset(vfoffset: VFOffset) {
    this.offset = vfoffset.uoffset;
  }

  public readAlignment(): Alignment {
    const offset = this.offset;
    this._blockSize = this.readInt();
    this._refId = this.readInt();
    // One based positioning
    this._pos = this.readInt() + 1;
    this._lReadName = this.readByte();
    this._mapQ = this.readByte();
    this._bin = this.readShort();
    this._nCigarOp = this.readShort();
    this._flag = this.readShort();
    this._lSeq = this.readInt();
    this._nextRefId = this.readInt();
    this._nextPos = this.readInt();
    this._tlen = this.readInt();
    this._readName = this.readStringNullTerm(this._lReadName);
    this._cigar = this.readCigar(this._nCigarOp);
    this._seq = this.readSeq(this._lSeq);
    this._qual = this.readQualPhred33(this._lSeq);

    // convert refid back to chr string
    const chr: string = this.chrMap.getChr(this._refId);

    this._record = new Alignment(chr, 
      this._pos, 
      this._readName,
      this._cigar,
      this._seq,
      this._qual);

    // Skip to end of block
    this.offset = offset + this._blockSize + 4;

    // Next record is located at offset + blockSize + 4 because
    // blockSize is the size of the record excluding itself (32bits/4 bytes)
    return this._record;
  }

  public hasAlignments(): boolean {
    return this.eob();
  }


  /**
   * Read the sequence.
   * 
   * @param length Length of read in bases.
   */
  public readSeq(length: number): string {
    const seq = [];

    // Divide by 2 using bit shift.
    const l = (length + 1) >> 1;

    const end = this.offset + l;

    for (let i: number = this.offset; i < end; ++i) {
      const sb = this.buffer[i];
      seq.push(SEQ_DECODER[(sb & 0xf0) >> 4]);
      seq.push(SEQ_DECODER[sb & 0x0f]);
    }

    // Since we look at the buffer directly, manually update position.
    this.offset += l;

    // seq might have one extra character (if lseq is an odd number) which is why we
    // slice the array to remove the unused 4bits
    return seq.slice(0, length).join("");
  }

  public readCigar(length: number): string {
    let op: number = -1;
    let opChar: string;
    let opLen: number;
    let cigar: string = "";
    let lengthOnRef: number = 0;

    for (let i: number = 0; i < length; ++i) {
      op = this.readInt();

      opLen = op >> 4;
      opChar = CIGAR_DECODER[op & 0xf];

      if (opChar === "M" ||
        opChar === "EQ" ||
        opChar === "X" ||
        opChar === "D" ||
        opChar === "N" ||
        opChar === "=") {
        lengthOnRef += opLen;
      }

      // Concatenate with rest of cigar
      cigar += opLen + opChar;
    }

    return cigar;
  }

  public readQualPhred33(length: number): string {
    let seq: string = "";

    for (let i: number = 0; i < length; ++i) {
      seq += String.fromCharCode(this.readByte() + 33);
    }

    console.log('len', seq.length);

    // let seq = buf.slice(offset, offset + length).map(x => String.fromCharCode(x + 33)).join("")

    return seq;
  }

  public readPhred33(length: number): number[] {
    let ret: number[] = [];

    for (let i: number = 0; i < length; ++i) {
      ret.push(this.readByte());
    }

    // let seq = buf.slice(offset, offset + length).map(x => String.fromCharCode(x + 33)).join("")

    return ret;
  }


}