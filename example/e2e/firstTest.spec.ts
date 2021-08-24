import {device, by, element} from 'detox';

describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it.only('should have welcome screen', async () => {
    await element(by.id('selectService:BatteryService')).tap();
    // await element(
    //   by.label('Log out').and(by.type('_UIAlertControllerActionView')),
    // ).tap();
    // expect(1).toBe(1);
  });

  it('should show hello screen after tap', async () => {
    await element(by.id('hello_button')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it('should show world screen after tap', async () => {
    await element(by.id('world_button')).tap();
    await expect(element(by.text('World!!!'))).toBeVisible();
  });
});
