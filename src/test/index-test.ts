import { expect } from 'chai';
import 'mocha';
import { BAMReader } from '../bamreader';
import { Alignment } from '../alignment';

describe('VFOffset function', () => {
  it('Should return a list of vfoffsets.', () => {
    const file: string = "/ifs/scratch/cancer/Lab_RDF/ngs/chip_seq/data/human/hg19/rdf/katia/CB4_BCL6_RK040/reads/test.bam";

    const reader: BAMReader = new BAMReader(file);

    const alignments: Alignment[] = reader.getAlignments("chr1", 10000, 20000);

    console.log(alignments);

    expect(reader.headerText).to.be.a('string');
  });
});