<p align="center">
  <img src="res/logo_transparent.png" width="400">
</p>

## Connect virtual cables between any audio source and any audio output

Soundsync is a web and desktop app to manage every audio source and every audio output in your home from a single interface. Link any audio source to multiple speakers connected to any computers on your home network. Soundsync will keep the music synchronized between all of them.

- 🆓 Free to use
- 🕸️ Work with any number of connected devices, audio sources, audio outputs and every link of your choosing
- 🎶 Compatible with a lot of different audio sources (Spotify Connect with a premium account, Windows system audio ; coming soon: Airplay, UPnP)
- 🔊 Broadcast sound to any speaker connected to a computer (Windows, MacOS, Linux, RapsberryPi) or a web browser (Chrome only) and soon Chromecast and more
- 🔗 Group speakers together to synchronize them to the same audio source
- 🎛️ Control everything from a web browser
- 🔓 Not linked to any external service, works offline, no account creation

<p align="center">
  <img src="res/screenshot_controller.png" height="400">
  <img src="res/screenshot_menu.png" height="400">
</p>

<!-- ## Download it

<table width="100%" align="center"><tr>
  <td>
    <h3>Windows</h3>
  </td>
  <td>
    <h3>MacOS</h3>
  </td>
  <td>
    <h3>Linux</h3>
  </td>
  <td>
    <h3>Raspberry</h3>
  </td>
</tr></table> -->

## Project status

Soundsync is still in an early stage. It's evolving quickly but there is still a lot to do. Here are some features that are being considered:

- Handle precise track synchronization
  - Network latency
  - Received time vs. playing time
  - Handle unordered chunks (JitterBuffer / Circular Buffer)
- Bluetooth on linux
- Airplay: Shairport-sync
- UPnP: gmrender-resurrect
- Sink volume with hardware control
- Group of sinks
- Use [waveform-data](https://www.npmjs.com/package/waveform-data) to show activity on webui
- Integration media info on webui
- Synchronize sound with Philips Hue light bulbs
- Create a ready to use RaspberryPi image
- Investigate libsoundio as alternative to rtaudio for better Pulseaudio support

## FAQ

- *Is it Open-source ?* Soundsync code is released under the Business Source License. It is not open-source but free to use as long as you don't use it for production work. It means you can use it at home, in your office but you cannot resell it or sell a service/product that directly use it. If you have special needs, [contact me](mailto:guillaume@besson.co) for a licence.

## Attributions

- Speaker by Mestman from the Noun Project
- Slashed zero by Rflor from the Noun Project
- web browser by Iconstock from the Noun Project
- Computer by iconcheese from the Noun Project
