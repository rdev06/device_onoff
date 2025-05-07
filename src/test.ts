import DeviceClient from '.';

const gate = new DeviceClient();

await gate.openOrClose({ ip: '127.0.0.1' }, 'open');

console.log('gate opened');
