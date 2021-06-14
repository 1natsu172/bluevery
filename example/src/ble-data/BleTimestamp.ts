import {BaseBleDataSerializer} from './BaseBleDataSerializer';

/**
 * BLE Timestamp をシリアライズ・デシリアライズする
 */
export class BleTimestampSerializer extends BaseBleDataSerializer<Date> {
  /**
   * 以下の形式のbyte arrayをDateに変換する。year が Little Endianであることを考慮する。
   * |year (16bit)|month(8bit)|day(8bit)|hours(8bit)|minutes(8bit)|seconds(8bit)|
   */
  deserialize(bytes: number[]): Date {
    const [, , month, day, hours, minutes, seconds] = bytes;
    const year = this.deserializeDataToUInt16LE(bytes.slice(0, 2));
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  /*
   * Dateを以下の形式のbyte arrayに変換する。year が Little Endianであることを考慮する。
   * |year (16bit)|month(8bit)|day(8bit)|hours(8bit)|minutes(8bit)|seconds(8bit)|
   */
  serialize(date: Date): number[] {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const buffer = new ArrayBuffer(2);
    const dv = new DataView(buffer);
    dv.setUint16(0, year, true);
    const serialized = [
      ...new Uint8Array(buffer),
      month,
      day,
      hours,
      minutes,
      seconds,
    ];
    //console.log(`serialized: ${JSON.stringify(serialized)}`);
    return serialized;
  }
}
