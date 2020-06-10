<p align="center">
  <img src="res/logo_transparent.png" width="400">
</p>

## Connect virtual cables between any audio source and any audio output

Soundsync is a web and desktop app to manage every audio source and every audio output in your home from a single interface. Link any audio source to multiple speakers connected to any devices on your home network. Soundsync will keep the music synchronized between all of them.

- 🆓 Free to use
- 🕸️ Work with any number of connected devices, audio sources, audio outputs and every link of your choosing
- 🎶 Compatible with a lot of different audio sources (Spotify Connect with a premium account, Airplay, Hardware Audio input (line in / microphone), Linux system audio ; coming soon: Windows system audio, UPnP and more)
- 🔊 Broadcast sound to any speaker connected to a computer (Windows, MacOS, Linux, RapsberryPi) or a web browser (Chrome, Firefox) and soon Chromecast and more
- 🔗 Group speakers together to synchronize them to the same audio source
- 🎛️ Control everything from a web browser
- 🔓 Not linked to any external service, works offline, no account creation

<p align="center">
  <img src="res/screenshot_controller.png" height="400">
  <img src="res/screenshot_menu.png" height="400">
</p>

## Quick start

Download and install Soundsync for you operating system on every device in your home you want to use.

<table width="100%" align="center"><tr>
  <td align="center">
    <h3>Windows</h3>
    <p><a href="https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/Soundsync_Setup_0.1.0.exe">Download development version</a></p>
  </td>
  <td align="center">
    <h3>MacOS</h3>
    <p><a href="https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/Soundsync-0.1.0.dmg">Download development version</a></p>
  </td>
  <td align="center">
    <h3>Linux</h3>
    <p><a href="https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync_0.1.0_amd64.deb">Download development version (.deb for Ubuntu/Debian)</a></p>
    <p><a href="https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync-0.1.0.pacman">Download development version (.pacman for Archlinux)</a></p>
  </td>
  <td align="center">
    <h3>Linux ARM (Raspberry)</h3>
    <p><a href="https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync_0.1.0_armv7l.deb">Download development version (.deb for Ubuntu/Debian/Raspbian)</a></p>
  </td>
</tr></table>

Now go to https://soundsync.app/ to control every Soundsync install on your home network.

## Project status

Soundsync is still in an early stage. It's evolving quickly but there is still a lot to do. Here are some features that are being considered:

- Bluetooth on linux
- UPnP: gmrender-resurrect
- Updating info for Spotify sink from WebUI
- Allow changing the name of a peer from the webui
- Group of sinks
- Use [waveform-data](https://www.npmjs.com/package/waveform-data) to show activity on webui
- Integration of media info on webui
- Synchronize sound with Philips Hue light bulbs
- Create a ready to use RaspberryPi image
- Chromecast support
- Windows loopback support
- Sonos support
- Stop audio device when no audio has been received for a while to save energy
- Allow devices on multiple networks to be connected together

## FAQ

- *Is it Open-source ?* Soundsync code is released under the Business Source License. It is not open-source but free to use as long as you don't use it for production work. It means you can use it at home, in your office but you cannot resell it or sell a service/product that directly use it. If you have special needs, [contact me](mailto:guillaume@besson.co) for a licence.

## Development

### Building opus

```
git submodule update --init --recursive
cd src/utils/opus_vendor
./autogen.sh
emconfigure ./configure --disable-extra-programs --disable-doc --disable-intrinsics --disable-hardening --disable-rtcd --disable-stack-protector
emmake make
cd ../
emcc -s INITIAL_MEMORY=10MB -s MAXIMUM_MEMORY=10MB -O2 -o opus_wasm.js -s EXPORT_ES6=1 -s MODULARIZE=1 -s SINGLE_FILE=1 -s EXPORT_NAME="Opus" -s USE_ES6_IMPORT_META=0 -s FILESYSTEM=0 -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue', 'AsciiToString']" -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_opus_decoder_create','_opus_decode_float','_opus_decoder_destroy','_opus_encoder_create','_opus_encoder_destroy','_opus_encode','_opus_strerror']" -s ENVIRONMENT=node,web ./opus_vendor/.libs/libopus.a
```

## Attributions

- Speaker by Mestman from the Noun Project
- Slashed zero by Rflor from the Noun Project
- web browser by Iconstock from the Noun Project
- Computer by iconcheese from the Noun Project
- AirPlay by Michiel Willemsen from the Noun Project
