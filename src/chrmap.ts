export class ChrMap {
  private _chrToRef: object;
  private _chrNames: string[];

  constructor(chrToRef: object, chrNames: string[]) {
    this._chrToRef = chrToRef;
    this._chrNames = chrNames;
  }

  public getRef(chr: string): number {
    return this._chrToRef[chr];
  }

  public getChr(index: number): string {
    return this._chrNames[index];
  }
}