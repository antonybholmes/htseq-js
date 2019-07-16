import fs = require("fs");
import { VFOffset } from "./vfoffset";
import { BUFFER_SIZE } from "./bam";


export class BinaryReader {
  
  public static fromFile(file: string, offset?: number) {
    if (offset === undefined) {
      offset = 0;
    }

    const fd = fs.openSync(file, "r");
    const buffer: Buffer = Buffer.alloc(BUFFER_SIZE);
    fs.readSync(fd, buffer, offset, BUFFER_SIZE, 0);
    return this.fromBuffer(buffer);
  }

  public static fromBuffer(buffer: Buffer) {
    return new BinaryReader(buffer);
  }

  private _data: Buffer;
  private _offset: number = 0;
  private _lastIndex: number = 0;

  constructor(data?: Buffer) {
    if (data) {
      this.buffer = data;
    }
  }

  /**
   * Change the underlying buffer.
   */
  public set buffer(data: Buffer) {
    this._data = data;
    this._lastIndex = data.length - 1;
    this.reset();
  }

  public get buffer(): Buffer {
    return this._data;
  }

  /**
   * Read data from file into current buffer.
   * 
   * @param file      File to read from.
   * @param offset    offset in the buffer to start writing at. 
   * @param length    number of bytes to read.
   * @param position  byte offset to begin reading from in file.
   */
  public readSync(file: string, offset: number, length: number, position: number) {
    const fd = fs.openSync(file, "r");
    fs.readSync(fd, this._data, offset, length, position);
    fs.closeSync(fd);
    this.reset();
  }

  public get length(): number {
    return this._data.length;
  }

  public get offset(): number {
    return this._offset;
  }

  public set offset(offset: number) {
    this._offset = offset;
  }

  /**
   * Set the buffer pointer to 0.
   */
  public reset() {
    this.offset = 0;
  }

  /**
   * Returns true if pointer is at end of buffer, i.e. we
   * cannot consume anymore tokens.
   */
  public eob(): boolean {
    return this._offset < this._lastIndex;
  }

  /**
   * Skip n bytes in buffer from current position.
   * 
   * @param bytes Number of bytes to skip.
   */
  public skip(bytes: number) {
    this._offset += bytes;
  }

  /**
   * Extract a slice of the underlying data buffer.
   * 
   * @param start   Start index in array.
   * @param end     End index in array.
   */
  public slice(start: number, end: number): Buffer {
    return this._data.slice(start, end);
  }

  public readByte(offset?: number): number {
    if (offset) {
      this.offset = offset;
    }

    const ret: number = this._data[this._offset];
    ++this._offset;
    return ret;
  }

  public readShort(): number {
    const ret: number = this._data.readUInt16LE(this._offset);
    this._offset += 2;
    return ret;
  }

  /**
   * Read an int from the current position in the buffer.
   */
  public readInt(): number {
    const ret: number = this._data.readUInt32LE(this._offset);
    this._offset += 4;
    return ret;
  }

  public readLong(): BigInt {
    const ret: BigInt = this._data.readBigUInt64LE(this._offset);
    this._offset += 8;
    return ret;
  }

  /**
   * Length of the string.
   * 
   * @param len     Length of string.
   */
  public readString(len: number): string {
    const ret: string = this._data.toString("utf8", this._offset, this._offset + len);
    this._offset += len;
    return ret;
  }

  /**
   * Read a null terminated string of specified length.
   * 
   * @param len length of string including null char.
   */
  public readStringNullTerm(len: number): string {
    const ret: string = this._data.toString("utf8", this._offset, this._offset + len - 1);
    this._offset += len;
    return ret;
  }

  /**
   * Returns a virtual file offset object. This consumes 64 bits (8 bytes) and
   * assume upper 48 bits is a 32bit int and lower 16 bits are a short.
   */
  public readVFOffset(): VFOffset {
    // Since numbers are little endian, and we are using 48bits (6 bytes)
    // for the int, skip the first 2 bytes of the 8 and read the next 4
    // as an int, and then consume the remaining two as a short
    const coffset: number = this._data.readUInt32LE(this._offset + 2);
    const uoffset: number = this._data.readUInt16LE(this._offset + 6);

    this._offset += 8;

    return new VFOffset(coffset, uoffset);
  }

  /**
   * Return a string representation of the underlying array.
   */
  public toString(): string {
    return this._data.toString();
  }
}