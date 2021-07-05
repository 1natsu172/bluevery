export abstract class BaseBleDataSerializer<T> {
  abstract deserialize(bytes: number[]): T;
  abstract serialize(data: T): number[];

  protected bitCheck(num: number, bit: number) {
    // eslint-disable-next-line no-bitwise
    return (num >> bit) % 2 === 1;
  }

  protected deserializeDataToUInt16LE(data: number[]): number {
    const dv = new DataView(new ArrayBuffer(2));
    dv.setUint8(0, data[0]);
    dv.setUint8(1, data[1]);
    return dv.getUint16(0, true);
  }
}
