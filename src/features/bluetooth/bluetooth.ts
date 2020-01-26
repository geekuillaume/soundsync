import tmp from 'tmp';
import { write } from 'fs';
import { promisify } from 'util';
import { spawn, exec } from 'child_process';
import debug from 'debug';
import Bluez from 'bluez';

const log = debug('soundsync:bluetooth');
const writePromise = promisify(write);
const execPromise = promisify(exec);

tmp.setGracefulCleanup();

interface BluetoothConfig {
  name: string;
}

export const startBluetoothDaemon = async (config: BluetoothConfig) => {
  const configData = `
  [General]
    Name = ${config.name}
    FastConnectable = true
  [Policy]
    AutoEnable=true
  `;
  const [err, path, fd, cleanup]: Parameters<tmp.FileCallback> = await new Promise((r) => tmp.file((...args) => r(args)));

  await writePromise(fd, configData);
  log('Starting bluetoothd process');
  const bluetoothdProcess = spawn('bluetoothd', [
    '-n', '-d',
    '-f', path,
    '--noplugin=hostname'
  ]);
  log('Starting bluealsa process');
  const bluealsaProcess = spawn('bluealsa', [
    '-p', 'a2dp-sink'
  ]);

  // bluetoothdProcess.stderr.on('data', (d) => console.log(d.toString()));
  bluealsaProcess.stderr.on('data', (d) => console.log(d.toString()));
  await new Promise(r => setTimeout(r, 2000));

  const bluetooth = new Bluez();
  await bluetooth.init()
  await bluetooth.registerDummyAgent();
  const adapter = await bluetooth.getAdapter('hci0');
  await adapter.setProperty("Discoverable", true);
  await adapter.setProperty("DiscoverableTimeout", 0);
  await adapter.setProperty("Pairable", true);
  await adapter.setProperty("PairableTimeout", 0);

  adapter.

  // try {
  //   await execPromise('bluetoothctl discoverable on');
  //   await execPromise('bluetoothctl pairable on')
  // } catch (e) {
  //   console.error(e);
  // }
}

// arecord -D bluealsa:SRV=org.bluealsa,DEV=98:09:CF:40:B7:1B,PROFILE=a2dp -r 48000 -c 2 -f s16_LE
