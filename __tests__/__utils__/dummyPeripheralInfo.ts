export const dummyPeripheralInfo = (id: string) => ({
  id: id,
  rssi: Number(id),
  advertising: {},
  name: `testPeripheral${id}`,
});
