type Config = {
  ws: string;
  deviceId: string;
  gate: {
    ip: string;
    port: number;
  };
};

type Task = {
  id: string; // this is unique message id
  type: 'open' | 'close' | 'upgrade';
  meta?: string;
};

import DeviceClient from './deviceClient';

// @ts-ignore
const file = Bun.file(process.cwd() + '/config.json');
const config: Config = await file.json();

const device = new DeviceClient({ target: config.gate });

let socket: WebSocket;
let retryCount = 0;
const maxRetries = 10;
const baseDelay = 5000; // 5 seconds

export default function connect() {
  socket = new WebSocket(config.ws, { headers: { 'device-id': config.deviceId } });

  socket.addEventListener('open', () => {
    console.log('WebSocket connected');
    retryCount = 0; // reset retry count on successful connect
  });

  socket.addEventListener('message', async (event) => {
    let task: Task;
    try {
      task = JSON.parse(event.data);
    } catch (error) {
      socket.send(
        JSON.stringify({
          deviceId: config.deviceId,
          status: 'error',
          msg: 'Unable to parse msg in [JSON]: ' + event.data
        })
      );
      return;
    }
    if (task?.id) {
      try {
        if (['open', 'close'].includes(task.type)) {
          // device.openOrClose expects 'open' | 'close', so assertion is safe here
          await device.openOrClose(task.type as 'open' | 'close');
          socket.send(
            JSON.stringify({
              id: task.id,
              deviceId: config.deviceId,
              status: 'success',
              msg: `Action ${task.type} sent successfully to hardware`
            })
          );
        } else {
          // console.log(task);
          socket.send(JSON.stringify({ id: task.id, deviceId: config.deviceId, status: 'unknown', msg: 'This type is unknown to us' }));
        }
      } catch (error) {
        socket.send(
          JSON.stringify({
            id: task.id,
            status: 'error',
            name: error.name,
            msg: error.message
          })
        );
      }
    }
  });

  function scheduleReconnect() {
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Reconnecting in ${delay / 1000} seconds... (retry ${retryCount + 1} of ${maxRetries})`);
      setTimeout(() => {
        retryCount++;
        connect();
      }, delay);
    } else {
      console.log('Max retry attempts reached. Giving up.');
    }
  }

  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    scheduleReconnect();
  });

  socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
    // Close socket if not already closed, to trigger reconnect logic
    if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
      socket.close();
    }
  });
}
