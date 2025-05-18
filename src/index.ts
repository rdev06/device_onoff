import { start, stop } from './svc';
import connect from './ws';


const cmds = ['run', 'start', 'uninstall'];

let exec = Bun.argv[2];

if (!exec || !cmds.includes(exec)) {
  console.error('Execute command out of ' + cmds, 'Using default is `run`');
}

if (exec === 'start') start();
else  if (exec === 'stop') stop();
else if(!exec || exec === 'run') connect();