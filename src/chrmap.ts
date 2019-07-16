/**
 * Map between ref ids and chromosomes. BAM files represent chromosomes using sequential numbers from 0 to n.
 */
export class ChrMap {
  private _chrToRef: object;
  private _chrNames: string[];

  constructor(chrToRef: object, chrNames: string[]) {
    this._chrToRef = chrToRef;
    this._chrNames = chrNames;
  }

  /**
   * Convert chr to numerical id.
   * 
   * @param chr   Chromosome.
   */
  public getRef(chr: string): number {
    return this._chrToRef[chr];
  }

  /**
   * Convert ref id to chromosome.
   * 
   * @param refId   refid
   */
  public getChr(refId: number): string {
    return this._chrNames[refId];
  }
}