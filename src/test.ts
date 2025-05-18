import DeviceClient from './deviceClient';

const gate = new DeviceClient();

await gate.openOrClose('open');

console.log('gate opened');
