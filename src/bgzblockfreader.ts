import fs = require("fs");
import zlib = require("zlib");
import { Alignment } from "./alignment";
import { ChrMap } from "./chrmap";
import { BAMBlockReader } from "./bamblockreader";
import { BinaryReader } from "./binaryreader";
import { BUFFER_SIZE } from "./bam";
import { VFOffset } from "./vfoffset";

/**
 * A buffer for reading BGZF blocks. The first block (starting at byte 0)
 * contains a header.
 */
export class BGZFBlockReader extends BinaryReader  {
  private _file: string;
  // Which block we are in
  private _chrMap: ChrMap = null;
  private _bamBlock: BAMBlockReader = new BAMBlockReader();
  private _c: number = -1;
  private _id1: number = -1;
  private _id2: number = -1;
  private _si1: number = -1;
  private _si2: number = -1;
  private _sLen: number = -1;
  private _bSize: number = -1;
  private _iSize: number = -1;
  private _xLen: number = -1;
  private _cDataRange: number[] =  [-1, 1];
  private _crc32: number;
  private _block: number = 0;
  private _bgzfOffset: number = -1;
  private _blockOffset: number = -1;
  

  constructor(file: string) {
    super(Buffer.alloc(BUFFER_SIZE));
    
    this._file = file;
  }

  public get file(): string {
    return this._file;
  }

  /**
   * Returns a mapping between chr names and record ids.
   */
  public get chrMap(): ChrMap {
    if (this._chrMap === null) {
      // Make sure we are reading block 0
      this.readInflate(0);
      this._chrMap = this._bamBlock.chrMap;
    }

    return this._chrMap;
  }

  public setBlockByVFOffset(vfoffset: VFOffset) {
    // Assume block correctly set by parent so
    // inflate uncompressed data
    this.inflate();

    this._bamBlock.setBlockByVFOffset(vfoffset);
  }


  /**
   * Read the block into memory.
   */
  public read(offset: number) {
    if (offset === undefined) {
      offset = this.offset;
    }

    if (offset === -1) {
      offset = 0;
    }

    if (offset !== this._bgzfOffset) {
      // Cache bgzf block

      this.readSync(this._file, 0, BUFFER_SIZE, offset);

      this._bgzfOffset = offset;

      // Invalidate the block cache since we moved blocks.
      this._blockOffset = -1;
    }

    // this._buffer.offset = offset;
    this._id1 = this.readByte();
    this._id2 = this.readByte();

    // size of extra field: CM(1) + FLG(1) + MTIME(4) + XFL(1) + OS(1) = 8
    this.skip(8);
    this._xLen = this.readShort();
    this._si1 = this.readByte();
    this._si2 = this.readByte();
    this._sLen = this.readShort();
    this._bSize = this.readShort();

    const lCData: number = this._bSize - this._xLen - 19;
    
    // Start and end of data block in bytes
    this._cDataRange[0] = 12 + this._xLen;
    this._cDataRange[1] = this._cDataRange[0] + lCData;

    // Skip past compressed data
    this.skip(lCData);

    this._crc32 = this.readInt();
    
    // Size of uncompressed data
    this._iSize = this.readInt();

    return this.offset;
  }

  /**
   * Read a block and inflate the compressed data. Byte offset
   * must be the start of a block as no error checking is
   * performed.
   * 
   * @param offset byte offset in file.
   */
  public readInflate(offset: number) {
    this.read(offset);
    this.inflate();
  }

  /**
   * Return the header text unprocessed. This typically
   * contains chromosomes and their sizes.
   */
  public get headerText(): string {
    this.readInflate(0);

    return this._bamBlock.headerText;
  }

  public readAlignment(): Alignment {
    this.inflate();

    return this._bamBlock.readAlignment();
  }

  /**
   * Returns true if more alignments can be read.
   */
  public hasAlignments(): boolean {
    return this._bamBlock.hasAlignments();
  }

  public toString(): string {
    return this.buffer.toString();
  }

  /**
   * Inflate the data for the current block and cache if not already done so.
   */
  private inflate() {
    if (this._blockOffset !== this._bgzfOffset) {
      const gzBuffer = this.slice(this._cDataRange[0], this._cDataRange[1]);

      // Set the underlying buffer of the block reader so it can extract
      // reads etc.
      this._bamBlock.buffer = zlib.inflateRawSync(gzBuffer);
      this._blockOffset = this._bgzfOffset;
    }
  }
}