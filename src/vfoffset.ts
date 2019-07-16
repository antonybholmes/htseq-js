export class VFOffset {
  private _coffset: number;
  private _uoffset: number;

  constructor(coffset: number, uoffset: number) {
    this._coffset = coffset;
    this._uoffset = uoffset;
  }

  /**
   * Returns the byte offset to the start of a BGZF block.
   */
  public get coffset(): number {
    return this._coffset;
  }

  /**
   * Returns the byte offset into the uncompressed
   * cdata.
   */
  public get uoffset(): number {
    return this._uoffset;
  }

  public toString(): string {
    return this._coffset + ':' + this._uoffset;
  }
}