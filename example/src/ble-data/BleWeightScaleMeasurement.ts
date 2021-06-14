import {BaseBleDataSerializer} from './BaseBleDataSerializer';
import {BleTimestampSerializer} from './BleTimestamp';

type BleWeightScaleMeasurementUnit = 'SI' | 'Imperial';

/** BLE Weight Scale Measurement data
 * ref:
 * https://www.bluetooth.com/wp-content/uploads/Sitecore-Media-Library/Gatt/Xml/Characteristics/org.bluetooth.characteristic.weight_measurement.xml
 * https://stackoverflow.com/questions/63771111/bluetooth-low-energy-weight-measurement-characteristic-timestamps
 */
export type BleDataWeightMeasurment = {
  flags: {
    measurmentUnits: BleWeightScaleMeasurementUnit;
    timeStampPresent: boolean;
    userIDPresent: boolean;
    bmiAndHeightPresent: boolean;
  };
  weight: number; // NaN のとき ‘Measurement Unsuccessful’ であることを表す  Ref. [1]
  timestamp: Date;
  userID: number;
  bmi: number;
  height: number;
};
// [1]: The special value of 0xFFFF can be used to indicate ‘Measurement Unsuccessful’ to the Client. If this is used, all optional fields other than the Time Stamp field and the User ID field shall be disabled.

/**
 * BLE 体重測定値をシリアライズ・デシリアライズをする
 * Note: userID, bmi, height に未対応。
 */
export class BleWeightScaleMeasurementSerializer extends BaseBleDataSerializer<
  BleDataWeightMeasurment
> {
  deserialize(bytes: number[]): BleDataWeightMeasurment {
    const bitFlag = bytes[0];
    const measurmentUnits = this.bitCheck(bitFlag, 0) ? 'Imperial' : 'SI';
    const timeStampPresent = this.bitCheck(bitFlag, 1);
    const userIDPresent = this.bitCheck(bitFlag, 2);
    const bmiAndHeightPresent = this.bitCheck(bitFlag, 3);
    const weight = this.deserializeWeightValue(
      bytes.slice(1, 3),
      measurmentUnits,
    );
    const timestamp = new BleTimestampSerializer().deserialize(
      bytes.slice(3, 10),
    );

    return {
      flags: {
        measurmentUnits,
        timeStampPresent,
        userIDPresent,
        bmiAndHeightPresent,
      },
      weight,
      timestamp,
      userID: NaN,
      bmi: NaN,
      height: NaN,
    };
  }
  serialize(_: BleDataWeightMeasurment): number[] {
    throw new Error('Method not implemented.');
  }

  private deserializeWeightValue(
    weightBytes: number[],
    measurementUnits: BleWeightScaleMeasurementUnit,
  ): number {
    if (weightBytes[0] === 0xff && weightBytes[1] === 0xff) {
      return NaN;
    }
    const weightRawValue = this.deserializeDataToUInt16LE(weightBytes);
    // Note: A&D UC-352BLEでポンド単位に変更する方法が不明。アカウント設定で変更しても機器に反映されなかった。
    // resolutionは BLEの体重データ仕様で、単位によって値が変わる。
    // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.weight.xml

    // unitによって解像度が異なる
    const resolution = measurementUnits === 'SI' ? 0.005 : 0.01;
    return weightRawValue * resolution;
  }
}
