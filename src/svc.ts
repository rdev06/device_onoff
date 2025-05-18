const SERVICE_NAME = 'GateController';
const Description = 'Gate Controller which takes instruction from websocket and try to open/close the gate';
const EXECUTABLE_PATH = process.execPath;

function runCommand(commands: string[]) {
    console.log(commands.join(' '))
    // Bun.spawnSync(commands, {
    //   stdout: 'inherit',
    //   stderr: 'inherit'
    // });
}

export function start() {
  stop();
  console.log('Installing service...');
  runCommand(['sc.exe', 'create', SERVICE_NAME, `binPath= "${EXECUTABLE_PATH} run"`, 'start= auto']);
  runCommand(['sc.exe', 'description', SERVICE_NAME, Description]);
  runCommand(['sc.exe', 'failure', SERVICE_NAME, 'reset= 86400', 'actions= restart/5000/restart/5000/restart/5000']);

  console.log('Starting service...');
  runCommand(['sc.exe', 'start', SERVICE_NAME]);
}

export function stop() {
  console.log('Stopping service...');
  runCommand(['sc.exe', 'stop', SERVICE_NAME]);

  console.log('Deleting service...');
  runCommand(['sc.exe', 'delete', SERVICE_NAME]);
}
