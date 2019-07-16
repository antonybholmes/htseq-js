import { expect } from 'chai';
import 'mocha';
import { BAMReader } from '../bamreader';

describe('Header function', () => {
  it('Should return a heading string.', () => {
    const file: string = "/ifs/scratch/cancer/Lab_RDF/ngs/chip_seq/data/human/hg19/rdf/katia/CB4_BCL6_RK040/reads/test.bam";

    const reader: BAMReader = new BAMReader(file);
    reader.read(0);
    expect(reader.headerText).to.be.a('string');
  });
});