import { spawn } from 'child_process';

const ENTRYPOINT_ENV_FLAG = 'FROM_SOUNDSYNC_ENTRYPOINT';

// This hack is necessary for Electron because it's not possible to add the --js-flags arg
// once the app is built and packaged by electron-builder and we need this flag for wasm multithreading
// This file should not be used when starting Soundsync without Electron and with NodeJS directly (or Electron with ELECTRON_RUN_AS_NODE env variable)

if (process.env[ENTRYPOINT_ENV_FLAG]) {
  // eslint-disable-next-line global-require
  require('./index');
} else {
  const args = [
    `--js-flags=--experimental-wasm-threads`,
    ...process.argv.slice(process.argv[1]?.endsWith('.js') ? 2 : 1),
  ];
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      [ENTRYPOINT_ENV_FLAG]: '1',
    },
  });
  child.on('exit', (code) => {
    process.exit(code);
  });
}
