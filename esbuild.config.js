import { context, build } from 'esbuild';
import { spawn } from 'child_process';
import { rmSync } from 'fs';

let nodeProcess; // Track the current node process

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: ['esnext'],
  outfile: 'dist/index.js',
  packages: 'external',
  format: 'esm',
  loader: { '.ts': 'ts' }
};

const watchNotify = {
  name: 'watch-notify',
  setup(build) {
    build.onEnd(result => {
      console.info(`Build ended with ${result.errors.length} error(s)`);

      if (nodeProcess) {
        console.log('🔁 Restarting app...');
        nodeProcess.kill(); // Clean up previous process
      }
      // Clear the terminal
      process.stdout.write('\x1Bc');

      nodeProcess = spawn('node', ['--watch', 'dist/index.js'], {
        stdio: 'inherit',
        shell: true,
      });

      nodeProcess.on('exit', (code, signal) => {
        if (signal !== 'SIGTERM') {
          console.log(`🔚 App exited with code ${code}`);
        }
        nodeProcess = null; // Clear ref on exit
      });
    });
  },
};

const MODE = process.env.npm_lifecycle_event || 'build';
if (MODE === 'build') {
  rmSync('dist', {force: true, recursive: true});
  await build({ ...config, minify: true });
  process.exit(0);
}

if(MODE === 'test'){
  config.entryPoints = ['src/test.ts']
}

const ctx = await context({ ...config, sourcemap: true, plugins: [watchNotify] });
await ctx.watch();

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  if (nodeProcess) nodeProcess.kill();
  ctx.dispose();
  process.exit(0);
});
