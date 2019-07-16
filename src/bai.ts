import fs = require("fs");
import { BinaryReader } from "./binaryreader";
import { VFOffset } from "./vfoffset";

export const BAI_MAGIC_BYTES = Buffer.from([0x42, 0x41, 0x49, 0x01]); // BAI\1
export const BAI_MAGIC_NUMBER = BAI_MAGIC_BYTES.readInt32LE(0);
export const END: number = (1 << 29);

/**
 * Size of linear tile
 */
export const LINEAR_TILE = 16384;

export function reg2bins(start: number, end: number) {
  let k: number; 
  
  const list = [];

  if (end > END) {
    end = END;
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
  private _file: string;
  private _bins: object = {};
  private _cache: boolean = true;

  constructor(file: string) {
    console.log('bai', file);
    this._file = file;
  }

  public get file(): string {
    return this._file;
  }

  public getVFOffsets(ref: number, start: number, end: number): VFOffset[] {
    return this.getVFOffsetsByBins(ref, reg2bins(start, end));
  }

  public getVFOffsetsByBins(ref: number, bins: number[]): VFOffset[] {
    this.cache();

    const ret: VFOffset[] = [];
    let indices: object = null;

    if (ref in this._bins) {
      indices = this._bins[ref].binIndex;

      bins.forEach(bin => {
        if (bin in indices) {
          const offsets: [] = indices[bin];

          offsets.forEach(offset => {
            ret.push(offset[0]);
          });
        }
      });
    }

    return ret;
  }

  public cache() {
    if (this._cache) {
      const buffer: Buffer = fs.readFileSync(this._file);
      const baiBuffer = new BinaryReader(buffer);
      const magic: number = baiBuffer.readInt();
      
      if (magic !== BAI_MAGIC_NUMBER) {
        return;
      }

      const nRef: number = baiBuffer.readInt();

      let nBin: number = -1;
      let binNumber: number = -1;
      let nChnk: number = -1;
      let cs: VFOffset;
      let ce: VFOffset;
      let blockMin: number = -1;
      let blockMax: number = -1;
      let nIntv: number;

      for (let ref: number = 0; ref < nRef; ++ref) {
        const binIndex = {};
        const linearIndex = [];

        nBin = baiBuffer.readInt();

        for (let b: number = 0; b < nBin; ++b) {

          binNumber = baiBuffer.readInt();

          if (binNumber === 37450) {
            // This is a psuedo bin, not used but we have to consume the bytes
            nChnk = baiBuffer.readInt(); // Should be 2
            cs = baiBuffer.readVFOffset();   // unmapped beg
            ce = baiBuffer.readVFOffset();   // unmapped end
            const nMapped = baiBuffer.readLong();
            const nUnmapped = baiBuffer.readLong();
          } else {
            binIndex[binNumber] = [];
            nChnk = baiBuffer.readInt(); // # of chunks for this bin

            for (let i: number = 0; i < nChnk; i++) {
              cs = baiBuffer.readVFOffset();   // unmapped beg
              ce = baiBuffer.readVFOffset();   // chunk_end

              if (cs && ce) {
                if (cs.coffset < blockMin) {
                  blockMin = cs.coffset;    // Block containing first alignment
                }

                if (ce.coffset > blockMax) {
                  blockMax = ce.coffset;
                }

                binIndex[binNumber].push([cs, ce]);
              }
            }
          }
        }

        nIntv = baiBuffer.readInt();
        
        for (let i: number = 0; i < nIntv; i++) {
          cs = baiBuffer.readVFOffset();
          linearIndex.push(cs);   // Might be null
        }

        if (nBin > 0) {
          this._bins[ref] = {binIndex, linearIndex};
        }
      }

      this._cache = false;
    }
  }
}