![Sounsync logo](./res/logo_transparent.png)

## Virtual cables between any audio source and any speaker in your home

Soundsync is a set of applications that connect every speaker in you home to a single interface where you can plug in virtual cables between any audio source and any number of speakers.

- 🆓 Free to use
- 🎶 Compatible with a lot of different audio source (Spotify Connect, Windows system audio and soon Airplay, UPnP)
- 🔊 Broadcast sound to any speaker connected to a computer (Windows, MacOS, Linux, RapsberryPi), and soon to a web page and Chromecast
- 🔗 Group speakers together to synchronize them to the same audio source
- 🔓 Not linked to any external service, works offline

[Insert screenshots here]

## Project status

Soundsync is still in a early stage. It's evolving quickly but there is still a lot to do. Here are some features that are being considered:

- Handle source stoping by reference counting of sinks being piped to
- Handle reconnection
  - With controller
- Handle precise track synchronization
  - Network latency
  - Received time vs playing time
  - Handle Unordered chunks (JitterBuffer / Circular Buffer)
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

- *Is it Open-source ?* Soundsync is using the Business Source License. It is not open-source but free to use as long as you don't use it for production work. It means you can use it at home, in your office but you cannot resell it or sell a service/product that directly use it. If you have a special need, contact me.

## Attributions

- Speaker by Mestman from the Noun Project
- Slashed zero by Rflor from the Noun Project
