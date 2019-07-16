import fs = require("fs");
import zlib = require("zlib");
import { Alignment } from "./alignment";
import { ChrMap } from "./chrmap";
import { BAMBlockReader } from "./bamblockreader";
import { BinaryReader } from "./binaryreader";
import { BGZFBlockReader } from "./bgzblockfreader";
import { BAI } from "./bai";
import { VFOffset } from "./vfoffset";

/**
 * Extracts BAM records from a BAM file.
 */
export class BAMReader {
  private _bgzfBlock: BGZFBlockReader = null;
  private _bai: BAI;


  constructor(bam: string, bai?: string) {
    if (bai === undefined) {
      bai = bam + ".bai";
    }

    this._bgzfBlock = new BGZFBlockReader(bam);
    this._bai = new BAI(bai);
  }

  public get bam(): string {
    return this._bgzfBlock.file;
  }

  public get bai(): string {
    return this._bai.file;
  }

  /**
   * Return a list of alignments in a region.
   * 
   * @param chr 
   * @param start 
   * @param end 
   */
  public getAlignments(chr: string, start: number, end: number): Alignment[] {
    return this._getAlignments(chr, start, end);
  }



  public setBlockByVFOffset(vfoffset: VFOffset) {
    console.log('BAMReader', 'setBlockByVFOffset', vfoffset);

    this.read(vfoffset.coffset);

    this._bgzfBlock.setBlockByVFOffset(vfoffset);
  }

  /**
   * Returns a mapping between chr names and record ids.
   */
  public get chrMap(): ChrMap {
    this.read(0);

    return this._bgzfBlock.chrMap;
  }

  public get headerText(): string {
    this.read(0);

    return this._bgzfBlock.headerText;
  }

  /**
   * Read a bgzf block into memory.
   * 
   * @param offset    Byte offset to start of bgzf block.
   */
  public read(offset: number) {
    console.log('BAMReader', 'read', offset);

    return this._bgzfBlock.read(offset);
  }

  public readAlignment(): Alignment {
    return this._bgzfBlock.readAlignment();
  }

  public hasAlignments(): boolean {
    return this._bgzfBlock.hasAlignments();
  }

  public toString(): string {
    return this._bgzfBlock.toString();
  }


  private getVOffsets(chr: string, start: number, end: number): VFOffset[] {
    console.log('ref', chr, this.chrMap.getRef(chr));
    return this._bai.getVFOffsets(this.chrMap.getRef(chr), start, end);
  }

  private _getAlignments(chr: string, start: number, end: number): Alignment[] {
    const vfoffsets: VFOffset[] = this.getVOffsets(chr, start, end);
    const ret: Alignment[] = [];
    let alignment: Alignment;

    vfoffsets.forEach(function(voffset) {
      console.log('dssdsd', voffset);

      // Set position
      this.setBlockByVFOffset(voffset);

      while (this.hasAlignments()) {
        alignment = this.readAlignment();

        if (alignment.position >= start && alignment.position < end) {
          ret.push(this.readAlignment());
        }
      }

    },
    this);

    return ret;
  }
}