
/**
 * Represents a bam alignment
 */
export class Alignment {
  private _chr: string;
  private _position: number;
  private _name: string;

  constructor(chr: string, position: number, name: string) {
    this._chr = chr;
    this._position = position;
    this._name = name;
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

  public toString(): string {
    return [this._chr, this._position, this._name].join(', ')
  }
}