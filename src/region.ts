export class Region {
  private _chr: string;
  private _start: number;
  private _end: number;

  constructor(chr: string, start: number, end: number) {
    this._chr = chr;
    this._start = start;
    this._end = end;
  }

  public get chr(): string {
    return this._chr;
  }

  public get start(): number {
    return this._start;
  }

  public get end(): number {
    return this._end;
  }
}