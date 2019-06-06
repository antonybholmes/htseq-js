export function readByte(buf: Buffer, offset: number) {
  return [buf[offset], offset + 1];
}

export function readShort(buf: Buffer, offset: number) {
  return [buf.readUInt16LE(offset), offset + 2];
}

export function readInt(buf: Buffer, offset: number) {
  //return {v:buffer.readUInt32LE(offset), offset:(offset + 4)};
  return [buf.readUInt32LE(offset), offset + 4];
}

export function readIntArray(buf: Buffer, offset: number, l: number) {
  let ret: Array<Number> = [];
  let v: number = -1;

  for (let i: number = 0; i < l; ++i) {
    [v, offset] = readInt(buf, offset);

    ret.push(v);
  }

  return ret;
}

export function readString(buf, offset: number, l: number) {
  return [buf.toString("utf8", offset, offset + l), offset + l];
}

export function readStringNullTerm(buf, offset: number, l: number) {
  return [buf.toString("utf8", offset, offset + l - 1), offset + l];
}

export class VFOffset {
  private _coffset: number;
  private _uoffset: number;

  constructor(coffset: number, uoffset: number) {
    this._coffset = coffset;
    this._uoffset = uoffset;
  }

  get coffset(): number {
    return this._coffset;
  }

  get uoffset(): number {
    return this._uoffset;
  }

  public toString(): string {
    return this._coffset + ':' + this._uoffset;
  }
}

export class BinaryReader {
  protected _data: Buffer;
  protected _offset: number = 0;

  constructor(data: Buffer) {
    this._data = data;
  }

  get offset(): number {
    return this._offset;
  }

  set offset(offset: number) {
    this._offset = offset;
  }

  slice(start: number, end: number): Buffer {
    return this._data.slice(start, end);
  }

  readByte(offset?: number): number {
    if (offset) {
      this.offset = offset;
    }

    let ret: number = this._data[this._offset];
    ++this._offset;
    return ret;
  }

  readShort(): number {
    let ret: number = this._data.readUInt16LE(this._offset);
    this._offset += 2;
    return ret;
  }

  readInt(): number {
    let ret: number = this._data.readUInt16LE(this._offset);
    this._offset += 4;
    return ret;
  }

  readLong(): BigInt {
    let ret: BigInt = this._data.readBigUInt64LE(this._offset);
    this._offset += 8;
    return ret;
  }

  readString(len: number): string {
    let ret: string = this._data.toString("utf8", this._offset, this._offset + len);
    this._offset += len;
    return ret;
  }

  readStringNullTerm(len: number): string {
    let ret: string = this._data.toString("utf8", this._offset, this._offset + len - 1);
    this._offset += len;
    return ret;
  }

  readVFOffset(): VFOffset {
    // 64 bits, assume upper 48 is 32bit int and
    // lower 16 bits are short

    let coffset: number = this._data.readUInt32LE(this._offset + 2);
    let uoffset: number = this._data.readUInt16LE(this._offset + 6);

    this._offset += 8;

    return new VFOffset(coffset, uoffset);
  }

  static from(buffer: Buffer) {
    return new BinaryReader(buffer);
  }
}

