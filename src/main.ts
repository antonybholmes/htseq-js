import fs = require("fs");
import zlib = require("zlib");
import * as bam from './bam';
import { BinaryReader } from "./binaryreader";
import { VFOffset } from "./vfoffset";
import { BAMReader } from "./bamreader";
import { BAI_MAGIC_NUMBER } from "./bai";


const BUFFER_SIZE: number  = 100000;
const buffer = Buffer.alloc(BUFFER_SIZE); // new Uint8Array(5000);

// console.log(reader.chrMap);

// let c: number = 0;

// while (reader.hasAlignments()) {
//   reader.readAlignment();

//   ++c;
// }

// console.log(c);

// while (block < 2) {
//   bamBuffer.offset = blockOffset;
//   id1 = bamBuffer.readByte();
//   id2 = bamBuffer.readByte();

//   // size of extra field: CM(1) + FLG(1) + MTIME(4) + XFL(1) + OS(1) = 10
//   bamBuffer.skip(8);
//   xLen = bamBuffer.readShort();
//   si1 = bamBuffer.readByte();
//   si2 = bamBuffer.readByte();
//   sLen = bamBuffer.readShort();
//   bSize = bamBuffer.readShort();

//   console.log("----");
//   console.log("block", block, blockOffset);
//   console.log(id1);
//   console.log(id2);
//   console.log(si1);
//   console.log(si2);
//   console.log(sLen);
//   console.log(bSize);

//   let length: number = bSize - xLen - 19;

//   let start: number = blockOffset + 12 + xLen;
//   let end: number = start + length;

//   const gzBuffer = bamBuffer.slice(start, end);

//   bamBuffer.offset = end;

//   crc32 = bamBuffer.readInt();
//   iSize = bamBuffer.readInt();

//   console.log("isize", bSize, iSize, gzBuffer.length, bamBuffer.offset);

//   //const a = new Uint8Array(data, start, length)

//   // let d = buffer.slice(c, c + l);

//   // //console.log(d.toString());

//   let dataBuffer = zlib.inflateRawSync(gzBuffer);

//   let bc = 0;
//   let header: any;
//   let alignment: any;

//   //console.log(dataBuffer.toString());

//   if (block == 0) {
//     // The header is only present in the first block
//     // All subsequent blocks just feature alignments
//     header = bam.parseBamHeader(dataBuffer, bc);
//     bc = header.offset;
//   }

//   alignment = bam.parseAlignments(dataBuffer, bc);
//   bc = alignment.offset;

//   // bSize is the block size minus one byte, so to get to the
//   // end of the block, add bSize + 1
//   blockOffset += bSize + 1;
  
//   ++block;
// }



// let file = "/ifs/scratch/cancer/Lab_RDF/ngs/chip_seq/data/human/hg19/rdf/katia/CB4_BCL6_RK040/reads/test.bam.bai";

// buffer = fs.readFileSync(file);

// let baiBuffer = new BinaryReader(buffer);

// let offset: number = 0;
// let nBin: number = -1;
// let binNumber: number = -1;
// let nChnk: number = -1;
// let cs: VFOffset;
// let ce: VFOffset;
// let blockMin: number = -1;
// let blockMax: number = -1;
// let nIntv: number;
// let indices = [];

// let magic: number = baiBuffer.readInt(); //readString(4);
// let nRef: number = baiBuffer.readInt();

// console.log('magic', magic, BAI_MAGIC_NUMBER);

// for (let ref: number = 0; ref < nRef; ++ref) {

//   let binIndex = {};
//   let linearIndex = [];

//   nBin = baiBuffer.readInt();

//   console.log('ref', ref, nBin);

//   for (let b: number = 0; b < nBin; ++b) {

//     binNumber = baiBuffer.readInt();

//     console.log('bin', b, binNumber);

//     if (binNumber === 37450) {
//       // This is a psuedo bin, not used but we have to consume the bytes
//       nChnk = baiBuffer.readInt(); // Should be 2
//       cs = baiBuffer.readVFOffset();   // unmapped beg
//       ce = baiBuffer.readVFOffset();   // unmapped end
//       var n_maped = baiBuffer.readLong();
//       var nUnmapped = baiBuffer.readLong();
//     } else {
//       binIndex[binNumber] = [];
//       nChnk = baiBuffer.readInt(); // # of chunks for this bin

//       for (let i: number = 0; i < nChnk; i++) {
//         cs = baiBuffer.readVFOffset();   // unmapped beg
//         ce = baiBuffer.readVFOffset();   //chunk_end

//         console.log('vf', cs.toString(), ce);

//         if (cs && ce) {
//           if (cs.coffset < blockMin) {
//             blockMin = cs.coffset;    // Block containing first alignment
//           }

//           if (ce.coffset > blockMax) {
//             blockMax = ce.coffset;
//           }

//           binIndex[binNumber].push([cs, ce]);
//         }
//       }
//     }
//   }

//   nIntv = baiBuffer.readInt();

//   console.log('nv', nIntv);

//   for (let i: number = 0; i < nIntv; i++) {
//     cs = baiBuffer.readVFOffset();

//     console.log('vf', cs);

//     linearIndex.push(cs);   // Might be null
//   }

//   if (nBin > 0) {
//     indices[ref] = {binIndex: binIndex, linearIndex: linearIndex}
//   }
// }