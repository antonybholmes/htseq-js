
/**
 * Represents a bam alignment
 */
export class Alignment {
  private _chr: string;
  private _position: number;
  private _name: string;
  private _cigar: string;
  private _seq: string;
  private  _qual: string;

  constructor(chr: string, 
    position: number, 
    name: string,
    cigar: string,
    seq: string,
    qual: string) {
    this._chr = chr;
    this._position = position;
    this._name = name;
    this._cigar = cigar;
    this._seq = seq;
    this._qual = qual;
  }

  public get chr(): string {
    return this._chr;
  }

  public get position(): number {
    return this._position;
  }

  public get name(): string {
    return this._name;
  }

  public get cigar(): string {
    return this._cigar;
  }

  public get seq(): string {
    return this._seq;
  }

  public get qual(): string {
    return this._qual;
  }

  public toString(): string {
    return [this._chr, 
      this._position, 
      this._name,
      this._cigar,
      this._seq,
      this._qual].join(', ')
  }
}