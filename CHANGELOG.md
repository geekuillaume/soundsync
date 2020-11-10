# Changelog

<a name="0.4.14"></a>
## 0.4.14 (2020-11-10)

### Changed

- 🎨 Fix scanned airplay devices&#x27; name [[6570ccf](https://github.com/geekuillaume/soundsync/commit/6570ccfe2ec093f2ad28ae531dd08ce6f5a72120)]
- ⚡ Speed up first airplay device scan [[4c7d9dd](https://github.com/geekuillaume/soundsync/commit/4c7d9ddb4af2fde7f40c193f61e35d304824ebad)]
- ⚡ Use SharedArrayBuffer for webaudio when possible [[4ca0f47](https://github.com/geekuillaume/soundsync/commit/4ca0f47c3f9960c36c0a0a0fe3680bb56b300606)]

### Fixed

- 🐛 Fix rendezvous service for peers with a lot of IP addresses [[54b267e](https://github.com/geekuillaume/soundsync/commit/54b267e80247550935eb4c31e7e5a112b54f0205)]
- 🐛 Fix typo to enable airplay source on linux-arm [[7226ee1](https://github.com/geekuillaume/soundsync/commit/7226ee14ce1ca1a0fdc160651107e829d78f73d8)]
- 🐛 Fix race-condition error on webaudio delete [[3d87b6e](https://github.com/geekuillaume/soundsync/commit/3d87b6e2846f1ee004c0fd400dd3a9cb67810bf8)]

### Miscellaneous

- 🚧 Enable security headers to activate SharedArrayBuffer support on Firefox [[b07eaff](https://github.com/geekuillaume/soundsync/commit/b07eaff6a649196704320563859d1ede36fd8aa2)]
- 🚧 Bump to dev version [[c080793](https://github.com/geekuillaume/soundsync/commit/c080793e9a860b8fa669b78e15f91e1bba272d45)]


<a name="0.4.13"></a>
## 0.4.13 (2020-11-07)

### Added

- ✨ Synchronize Chromecast volume with Chromecast system volume [[9b62a6e](https://github.com/geekuillaume/soundsync/commit/9b62a6ea5db7530e89a22a55170db9b708dcc017)]

### Changed

- 🎨 Adds webui start:prod command [[2836a79](https://github.com/geekuillaume/soundsync/commit/2836a793226719209780d1665c1fca78f22d2cb0)]
- 🎨 Disable chromecast debug log and clean code [[b489310](https://github.com/geekuillaume/soundsync/commit/b4893105e75f7a0a5c7266ea3d351ac8efaddfcd)]
- ⚡ Improves chromecast perf and name the sink with the chromecast name [[b4a2034](https://github.com/geekuillaume/soundsync/commit/b4a2034205959f6f053bc4cb3d2e571240596e63)]
- 🎨 Add React key to right location in AddChromecastSink [[b732409](https://github.com/geekuillaume/soundsync/commit/b732409ef96640b2a3c3d7431f92d355a3c08ccc)]
- ⚡ Optimize some React components perf [[45ce705](https://github.com/geekuillaume/soundsync/commit/45ce705a5f6569adae7292a142618473811f5fb1)]
- ⚡ Throttle volume updates on the webui [[f8a2b31](https://github.com/geekuillaume/soundsync/commit/f8a2b3154f932a4b4df145182fa63aa06e23bb15)]
- 🎨 Fix type of useSinks and useSources on webui [[b8beaa3](https://github.com/geekuillaume/soundsync/commit/b8beaa3a718a249f7adbedae412ba6be9642732b)]
- ⚡ Adds direct connect with Chromecast websocket without using rendezvous service [[6e1fb85](https://github.com/geekuillaume/soundsync/commit/6e1fb85dfefe295cd1730f6cc5f0613516e02b13)]
- ⚡ Improves Chromecast search speed [[684d36e](https://github.com/geekuillaume/soundsync/commit/684d36e1602a3f03a84e5c4dee3d958bb6460474)]

### Fixed

- 🐛 Fix peersManager debug button [[d5465ba](https://github.com/geekuillaume/soundsync/commit/d5465baf7bde9afd5d6b932c95442e0bb0cc8a32)]
- 🐛 Fix chromecast detection bug when chromecast is started [[0943b7b](https://github.com/geekuillaume/soundsync/commit/0943b7be353cdd12194eef758deca93dd3b86dc4)]
- 🐛 Adds retry strategy for register to rendezvous service method [[f7f2e66](https://github.com/geekuillaume/soundsync/commit/f7f2e66eda2fe001b24caf6a9b1afa37919fc98a)]
- 🐛 Fix reconnection of httpApiInitiator peer when first try failed [[ccd6129](https://github.com/geekuillaume/soundsync/commit/ccd6129a1e43908b9a6800807653a4edb4795768)]

### Miscellaneous

- 📝 Adds troubleshooting section on the controller [[0c3c7f4](https://github.com/geekuillaume/soundsync/commit/0c3c7f40d520d62a8220a1e633226cfb2cf2635d)]
- 📝 Add info about raspberry pi compatibility [[f5c5299](https://github.com/geekuillaume/soundsync/commit/f5c5299136fb3dee6ed981fd2cda1ca118ab4be8)]
- 🚧 Bump to dev version [[c2a2543](https://github.com/geekuillaume/soundsync/commit/c2a254396847e4d9b484878d3e2b658a1dd9a2e8)]


<a name="0.4.12"></a>
## 0.4.12 (2020-11-03)

### Fixed

- 🐛 Fixed RaspberryPi audio output [[afda8f6](https://github.com/geekuillaume/soundsync/commit/afda8f6fd974252e6e57cb5cf415b6d17f6bc6b4)]

### Miscellaneous

- 🚧 Bump to dev version [[a6e282d](https://github.com/geekuillaume/soundsync/commit/a6e282d33f7e85da3589ed384a33802ba99a3929)]


<a name="0.4.11"></a>
## 0.4.11 (2020-11-02)

### Changed

- 🎨 Improves audio clock drift measures and better handle latencyCorrection changes [[5408c8a](https://github.com/geekuillaume/soundsync/commit/5408c8ab622c3e0d83b38fd7fb8023eb5eb66323)]
- 🎨 Type audiosink events [[123fb0c](https://github.com/geekuillaume/soundsync/commit/123fb0c45dc7ea039dc994ccd05920b43398a3e5)]
- 🎨 Allow Chromcast appid to be set by env vars for debugging purposes [[c232510](https://github.com/geekuillaume/soundsync/commit/c23251032c52c5034c68695664275955a6b9f92d)]

### Removed

- 🔇 Remove log in audioworklet [[b6b9ec6](https://github.com/geekuillaume/soundsync/commit/b6b9ec6893990259c62b56aea82311ef21a00794)]

### Miscellaneous

- 🚧 Add flush audio clock drift measure on webui in debug mode [[032420b](https://github.com/geekuillaume/soundsync/commit/032420ba540ac975fd206ac7ee11d4cb0520aa07)]
- 🚧 Bump to dev version [[fa29f28](https://github.com/geekuillaume/soundsync/commit/fa29f281611d44e8ba8c1d387d86f0cc4ce4b68d)]


<a name="0.4.10"></a>
## 0.4.10 (2020-10-27)

### Changed

- ⚡ Improve webaudio sink sync by copying logic from localdevice sink [[f072df9](https://github.com/geekuillaume/soundsync/commit/f072df919e963e2939b4a84dfd0201e3ebde7ac3)]
- 🎨 Make sink piped state verification in audiosink instead of each sink [[70a7b8f](https://github.com/geekuillaume/soundsync/commit/70a7b8f3f1be30473be20c3a7a00e4a1ef4d7cfb)]

### Fixed

- 🐛 Fix bug when RTCDataChannel is closed but not registered yet [[a4462c3](https://github.com/geekuillaume/soundsync/commit/a4462c3fe08598895438271b107fced7fddd761a)]
- 🐛 Fix crash on Hue bridge add error on webui [[9f6e7b9](https://github.com/geekuillaume/soundsync/commit/9f6e7b9bdf6c05fffa10ce573038ce37cc0ffd0c)]
- 🐛 Retry connecting to hue in case of DTLS error [[3da48c6](https://github.com/geekuillaume/soundsync/commit/3da48c6676aa30136eb036251b2ae7b529e76522)]

### Miscellaneous

- 🚧 Bump to dev version [[bda7507](https://github.com/geekuillaume/soundsync/commit/bda7507db3d138de7c59864e021a0cbbad252102)]


<a name="0.4.9"></a>
## 0.4.9 (2020-10-26)

### Changed

- ⬆️ Upgrade some webui deps [[b54f38e](https://github.com/geekuillaume/soundsync/commit/b54f38e54811940cf21eeeb3ce578739da6b9975)]
- ⚡ Enable webpack cache [[5176fc0](https://github.com/geekuillaume/soundsync/commit/5176fc0065095de193a8e0bbe23577a6872d9e05)]
- 💄 Fix additionnal 0 character showing when no airplay speakers detected [[6b93e12](https://github.com/geekuillaume/soundsync/commit/6b93e12fb8b550ccae655de9f79d328b930aa075)]
- ⚡ Use port on &quot;open controller&quot; systray button and redirect to 127.0.0.1 instead of localhost [[8f615d5](https://github.com/geekuillaume/soundsync/commit/8f615d58cab4c7c5103ffbe0403eabc5fb13c0dc)]

### Removed

- 🔥 Fix AddHueSink crashing webui [[6fcc018](https://github.com/geekuillaume/soundsync/commit/6fcc0189ef8dd1841064a458984a4c535fd7881f)]

### Fixed

- 🐛 Fix localdevice sink being silent when source latency is too big [[19d3e71](https://github.com/geekuillaume/soundsync/commit/19d3e719c981f92a22198ebe208a4d9075e662b2)]

### Miscellaneous

-  👷 Don&#x27;t generate preload meta for sourcemaps [[4041872](https://github.com/geekuillaume/soundsync/commit/4041872caabb9cd8e27b9c08542b99605c6e2448)]
-  👷 Emit sourcemap when building webui for production [[a11e9b2](https://github.com/geekuillaume/soundsync/commit/a11e9b26eaa229ae1a1aa6f4768166bfa88418e2)]
- 🚧 Bump to dev version [[444e3c0](https://github.com/geekuillaume/soundsync/commit/444e3c06cfd6ed387c4b8481075be275cf3a544f)]


<a name="0.4.8"></a>
## 0.4.8 (2020-10-25)

### Added

- 🔊 Adds info about audio sinks and source in /debuginfo route [[854f24b](https://github.com/geekuillaume/soundsync/commit/854f24b01780c14dd50839856c44c78ab19d32b4)]

### Changed

- ⚡ Add cachebuster hash to style.css [[c3dbdf0](https://github.com/geekuillaume/soundsync/commit/c3dbdf0ce8c18154f65594479484745127081ce6)]
- ⚡ Set cache to 365 days [[d69e188](https://github.com/geekuillaume/soundsync/commit/d69e188e11e220463dceb784b509e8bea3ba54de)]
- ⚡ Set logo size in html to prevent layour shift [[5beb845](https://github.com/geekuillaume/soundsync/commit/5beb845564fddfe408f7ab917debc28187d2783f)]
- ⚡ Compress webui in webpack build phase instead of on-the-fly [[8acc5a8](https://github.com/geekuillaume/soundsync/commit/8acc5a8d34006e31a517a44c40601abc2105d8a0)]
- ⬆️ Migrate to webpack 5 and add some optimizations [[13e756e](https://github.com/geekuillaume/soundsync/commit/13e756e1fb6ce1397d2584de84151125e85dd05f)]
- ⚡ Compress webui files when serving locally [[3f53c3c](https://github.com/geekuillaume/soundsync/commit/3f53c3c3f7e7b49dd1dd4312d73735ab9027e4b4)]

### Miscellaneous

- 🚧 Bump to dev version [[f9cf934](https://github.com/geekuillaume/soundsync/commit/f9cf934f1d647f82f56b426d0b50ffc7a5e69a89)]


<a name="0.4.7"></a>
## 0.4.7 (2020-10-23)

### Fixed

- 🐛 Don&#x27;t crash on electron update error [[a086bd3](https://github.com/geekuillaume/soundsync/commit/a086bd3f83b8e513216c85b36d2db83ea133dd1d)]

### Miscellaneous

-  👷 Upload zip package for macos [[9f5b629](https://github.com/geekuillaume/soundsync/commit/9f5b6295f49fac22ef875aa0cd550bf955b134f7)]
- 🚧 Bump to dev version [[fadaced](https://github.com/geekuillaume/soundsync/commit/fadacedc89a11918ddc1355bedc05e5b16934e4c)]


<a name="0.4.6"></a>
## 0.4.6 (2020-10-23)

### Added

- 🔊 Add more info in /debuginfo route [[ef2677f](https://github.com/geekuillaume/soundsync/commit/ef2677fffd04fe398bccdf419bec5486da17f787)]
- 🔊 Improve logs for synchronized audio buffer [[a9879da](https://github.com/geekuillaume/soundsync/commit/a9879daffdc7fb12e2dbc364e66ac14c025709a1)]
- ✨ Adds /logs route to get last 1000 log lines [[4272af6](https://github.com/geekuillaume/soundsync/commit/4272af6b564b7f2177f762522f7d7016d92750c9)]
- 🔊 Active audio drift log byu default [[5048237](https://github.com/geekuillaume/soundsync/commit/50482372386e331154c9b5173426fd851f4d85c7)]

### Changed

- ♻️ Centralize log module [[926e4bf](https://github.com/geekuillaume/soundsync/commit/926e4bfa331915726a7e6d83f7f618885234afec)]
- 💄 Redirect to controller when accessing webui from localhost or direct IP [[2062bcc](https://github.com/geekuillaume/soundsync/commit/2062bcc94aa41a1d04b31619cc63ddc96b885709)]
- 💄 Redirect to /controller when using open button on systray [[7a88199](https://github.com/geekuillaume/soundsync/commit/7a881990d86200a428f9bfb19a78666c6348feaa)]
- 💄 Add message about webaudio sink unavailability [[d908145](https://github.com/geekuillaume/soundsync/commit/d90814536940c12de92079c4b96a89a2c3f734af)]

### Miscellaneous

- 🚧 Bump to dev version [[b5b19a5](https://github.com/geekuillaume/soundsync/commit/b5b19a5a5acdcd3012f3223167f7272b6ccb19e5)]


<a name="0.4.5"></a>
## 0.4.5 (2020-10-21)

### Changed

- 💄 Remove title in systray [[464f2ac](https://github.com/geekuillaume/soundsync/commit/464f2ac860fa05a98717cba98e01acfbd0117b03)]
- ⬆️ Upgrade audioworklet [[26d2152](https://github.com/geekuillaume/soundsync/commit/26d21522a91c44916ea97f82d80c6d996f0d909c)]
- 💄 Adds BetaPopup and simplify some webui text [[a30a218](https://github.com/geekuillaume/soundsync/commit/a30a218e6e52e03255ecf62335a61c91004976d4)]
- ⚡ Improve chunk_stream perfs [[78ec417](https://github.com/geekuillaume/soundsync/commit/78ec417bde0ed57b5f01bd366d7a9b858cc04a4f)]

### Fixed

- 🐛 Don&#x27;t crash on updater error [[7827b67](https://github.com/geekuillaume/soundsync/commit/7827b67638fa9f7ef7f3d5a422f51a7b06d56f10)]
- 🐛 Fix entitlement file for macos build [[81c82c6](https://github.com/geekuillaume/soundsync/commit/81c82c66dd988d596771b8d9c99ccc16eed12831)]
- 🐛 Fix Macos entitlements [[99d70be](https://github.com/geekuillaume/soundsync/commit/99d70bea8ec17ed5070f4edce0b0b6d31be64fcc)]

### Miscellaneous

- 🚧 Again fix for macos entitlement file [[a5aa5e0](https://github.com/geekuillaume/soundsync/commit/a5aa5e0ac8f8d052bbe6bfb4cf8573b1bde041fe)]
-  👷 Adds yarn cache for webui build [[91af0b5](https://github.com/geekuillaume/soundsync/commit/91af0b598d0759655c96a0122c2283b9578ac061)]
-  👷 Adds yarn cache on Github Actions [[84bb329](https://github.com/geekuillaume/soundsync/commit/84bb329aa500f9f7b5de31f59bff9e0ddff1e23d)]
-  👷 Adds MacOS code signing and notarization [[895529c](https://github.com/geekuillaume/soundsync/commit/895529c17659bf9c532749f61a1fa7295bcd99bb)]
- 🚧 Start implementing auto-updater [[3f68968](https://github.com/geekuillaume/soundsync/commit/3f68968cb0a19c046c20ded0b7d9487279cbd9e0)]
- 🚧 Bump to dev version [[3f12feb](https://github.com/geekuillaume/soundsync/commit/3f12febea3c1ac876daaf78fe571299a9235afa4)]


<a name="0.4.4"></a>
## 0.4.4 (2020-10-17)

### Added

- 🔊 Fix out-of-order log [[53dc37d](https://github.com/geekuillaume/soundsync/commit/53dc37dd36917301a63276bc3430b0bbc981aced)]
- 🔊 Don&#x27;t show out-of-order chunk if received after discarded old chunks [[223cbad](https://github.com/geekuillaume/soundsync/commit/223cbad42fbe0b4a077eed56955ca2804141228c)]

### Changed

- ⚡ Force max 100ms max retransmit time for audio chunks webrtc messages [[3f6776d](https://github.com/geekuillaume/soundsync/commit/3f6776d3d40012bc63954aee5045a85e84d91a32)]
- ⚡ Optimize mean calculation performance [[bec36ff](https://github.com/geekuillaume/soundsync/commit/bec36ff5914ad321a44c61038185e64681829076)]
- ⚡ Memoize local audio devices list [[d9170d4](https://github.com/geekuillaume/soundsync/commit/d9170d4309b7830f7633879f901038711c7d32d5)]

### Fixed

- 🐛 Fix bug with local device audio push chunks before having synchronized timedelta with peer leading to silence [[43f54b2](https://github.com/geekuillaume/soundsync/commit/43f54b24faff91bc10eb99e4323866ac32b5e475)]

### Miscellaneous

- 🚧 Bump to dev version [[40f388e](https://github.com/geekuillaume/soundsync/commit/40f388ee1650fe7eed148c63e860cf068a9e2ebc)]


<a name="0.4.3"></a>
## 0.4.3 (2020-10-15)

### Added

- ✨ Support encrypted Airplay [[71d3a3e](https://github.com/geekuillaume/soundsync/commit/71d3a3eab38bff9617a730ea74d14427225520c0)]
- ✨ Check if soundsync is already running before starting [[b6d029c](https://github.com/geekuillaume/soundsync/commit/b6d029ca9a1446053632b82a703f3bb0915ce730)]

### Changed

- 💄 Disable pipe animation on webui because of high CPU/GPU usage [[548ac21](https://github.com/geekuillaume/soundsync/commit/548ac213ea21a38eb9b66174f600c3150649c526)]
- ⬆️ Update to last audioworklet version [[1fa4080](https://github.com/geekuillaume/soundsync/commit/1fa40803ebebe6e9a26ab5515c598016ebe11c71)]
- ⬆️ Upgrades Electron to last version [[5559e39](https://github.com/geekuillaume/soundsync/commit/5559e39941ad04d2f801bc89ce7b61a1aa47ce7d)]

### Fixed

- 🐛 Improves browser compatibility detection and error message [[4618fdd](https://github.com/geekuillaume/soundsync/commit/4618fddf71ef4dd60f51a0ac9baacaf3e732aafc)]
- 🐛 Fix RTCPeerConnection not a constructor error [[9f8b6fa](https://github.com/geekuillaume/soundsync/commit/9f8b6fa17ba15440bcbbc2eb68cc9f091cbe4f2b)]
- 🐛 Fix entrypoint argv parsing when manually starting with npm run start:electron [[3454954](https://github.com/geekuillaume/soundsync/commit/34549544af2f07b98f0aa4742a68bfcd91622f0b)]

### Security

- 🔒 Enable hardened runtime for macos build [[42cdf88](https://github.com/geekuillaume/soundsync/commit/42cdf88ba67a82a64e35052acbf048d9f4ae59a9)]

### Miscellaneous

- 🚧 Improving airplay sink [[bae8e0c](https://github.com/geekuillaume/soundsync/commit/bae8e0cba8a69f508871031d43bc42115bb04d58)]
- 🚧 Signal out of order chunk for first on in stream [[16a34eb](https://github.com/geekuillaume/soundsync/commit/16a34ebf41f8b74cc18ab9486bd37d844619a8d7)]
- 🚧 Airplay sink integration in progress [[1e324b8](https://github.com/geekuillaume/soundsync/commit/1e324b80b4dd64ad00d11b8eaf03134beaabcfa7)]
-  👷 Fix build script package.json indentation [[fd82bef](https://github.com/geekuillaume/soundsync/commit/fd82bef3c82efe54cd44fcc02b4d48ccd2fc5d85)]
- 📝 Adds instructions to start Soundsync directly from the source code [[30bbe55](https://github.com/geekuillaume/soundsync/commit/30bbe557719b64c6805c9066b3504b1c72bd4527)]
- 🚧 WIP Improving Airplay sink compatibility [[4afd9d2](https://github.com/geekuillaume/soundsync/commit/4afd9d25689ce56f778a28a56eb75f1800151ca7)]
- 🚧 Bump to dev version [[4e1198e](https://github.com/geekuillaume/soundsync/commit/4e1198e5ebc650a43900b152e35047d1d24b88c2)]


<a name="0.4.2"></a>
## 0.4.2 (2020-10-05)

### Fixed

- 🐛 Detect localStorage support before loading webui [[cf46734](https://github.com/geekuillaume/soundsync/commit/cf467346bc2a9a08594faef21ee613697dd1ac6c)]
- 🐛 Fix Airplay sink resampler not initialized error [[a7d2519](https://github.com/geekuillaume/soundsync/commit/a7d2519aaa909e7255b9cc1f6b289e076c5b2778)]
- 🐛 Adds webassembly support check on webui [[24cbea8](https://github.com/geekuillaume/soundsync/commit/24cbea887a4aaa01eb5aed8588a8be0252c5e97c)]
- 🐛 Show details if error while connecting to hue bridge [[d702fac](https://github.com/geekuillaume/soundsync/commit/d702fac975d76d763f162f7fe11c2c055775fe7e)]
- 🐛 Don&#x27;t crash if rendezvous service is down, instead log error and try other methods [[83fb569](https://github.com/geekuillaume/soundsync/commit/83fb569de81c5b1f84de436727c0113e514842ac)]

### Miscellaneous

-  👷 Don&#x27;t send sentry sourcemaps if running in dev mode [[95c3168](https://github.com/geekuillaume/soundsync/commit/95c316838c02188219fcc9895afbc7b5a41bf34b)]
- 🚧 Bump to dev version [[50fc865](https://github.com/geekuillaume/soundsync/commit/50fc8658432c6b1ebf8a811b4180f95180789e19)]


<a name="0.4.1"></a>
## 0.4.1 (2020-10-03)

### Changed

- ⬆️ upgrades audioworklet [[9dcd385](https://github.com/geekuillaume/soundsync/commit/9dcd3857ae2be72c763a89684ee77df232eef3d5)]

### Miscellaneous

-  👷 upload webui sourcemaps to sentry [[5ba3741](https://github.com/geekuillaume/soundsync/commit/5ba374101d49d30c070015b362194a9b4971268d)]
- 🚧 Bump to dev version [[c4b8b5e](https://github.com/geekuillaume/soundsync/commit/c4b8b5ea3f9fc34cf142a4b80da100988a8a7c54)]


<a name="0.4.0"></a>
## 0.4.0 (2020-10-01)

### Added

- ✨ Activate audioloopback for Windows [[c9c08ef](https://github.com/geekuillaume/soundsync/commit/c9c08ef1238cd76deae07fc4f61ebe60c42a5bc2)]
- ✨ Add loopback interface creator for pulseaudio [[e5edab3](https://github.com/geekuillaume/soundsync/commit/e5edab3a78fadf8eef1b8a4c79eac3c5a3060e87)]

### Changed

- 💄 Add monitor in name of loopback device [[f5f24c1](https://github.com/geekuillaume/soundsync/commit/f5f24c1c98d633c95862228a9e125bc301fe3b85)]
- ⚡ Tweak audiochannel webrtc options [[935a33b](https://github.com/geekuillaume/soundsync/commit/935a33bcf044c9a42051de3509d2fb78dec58c7e)]

### Fixed

- 🐛 Fix windows loopback device detection [[7772a70](https://github.com/geekuillaume/soundsync/commit/7772a70a7dbb982008e94a1d62d30f4038a64886)]
- 🐛 Fix localdevice source loopback available detection [[fd994cb](https://github.com/geekuillaume/soundsync/commit/fd994cbb8bc9044a255e09f703a7738d79c1d94d)]
- 🐛 Handles all ways of exiting node process in on_exit handler [[6fd0edc](https://github.com/geekuillaume/soundsync/commit/6fd0edcb9c3f87395178541ebebfd801489b06c3)]
- 🐛 Always use exit handler when stopping process [[cb2ac83](https://github.com/geekuillaume/soundsync/commit/cb2ac8304179640f126ecc78020471c2410baafc)]

### Miscellaneous

-  Revert &quot;👷 Only build on github if commit message contains build str&quot; [[169ebf1](https://github.com/geekuillaume/soundsync/commit/169ebf168d10700ff40e3a585df8e4e8d0affc99)]
-  👷 Only build on github if commit message contains build str [[9eaa86e](https://github.com/geekuillaume/soundsync/commit/9eaa86eefd2731e3cc0a3f662e87afa738230981)]
- 🚧 Bump to dev version [[4b8cd56](https://github.com/geekuillaume/soundsync/commit/4b8cd56aa6885ce0f1fd373fe2984eec27717958)]


<a name="0.3.15"></a>
## 0.3.15 (2020-09-29)

### Changed

- ⬆️ Upgrades audioworklet to fix bug with localdevice source [[63dd098](https://github.com/geekuillaume/soundsync/commit/63dd09875154903d8bd63ab9b6569ffe4d8ad210)]

### Miscellaneous

- 🚧 Bump to dev version [[c5c8e5a](https://github.com/geekuillaume/soundsync/commit/c5c8e5adf9cd493b352dfc32aa7a4dae0d6a4a13)]


<a name="0.3.14"></a>
## 0.3.14 (2020-09-28)

### Fixed

- 🐛 Fix some edge cases with localdevice sink [[55ca1b6](https://github.com/geekuillaume/soundsync/commit/55ca1b60e13eb43c89bd3ae97354a0fdd82d70f1)]
- 🐛 Fix localdevice source for use with new version of audioworklet [[5893a7a](https://github.com/geekuillaume/soundsync/commit/5893a7a5cdadd2ee8d3f6c5f24a37c2420ae21dc)]
- 🐛 Fix resampler by going back to non-worker implementation [[dd82e34](https://github.com/geekuillaume/soundsync/commit/dd82e34e6173f24e8ffc3aead7817be7d1574ed4)]

### Miscellaneous

- 🔨 Adds latencyMeasurer script [[16f0f7e](https://github.com/geekuillaume/soundsync/commit/16f0f7e6da9e2aed6bed863679dde56665155f53)]
- 🗑️ Clean unused files left from audioworklet upgrade [[0518767](https://github.com/geekuillaume/soundsync/commit/051876798ea148e549b6a0a7ed3e95f8d79ca9c8)]
- 🚧 Bump to dev version [[86739f7](https://github.com/geekuillaume/soundsync/commit/86739f77ffd304375e13170d71120f8bfdbacb4a)]


<a name="0.3.13"></a>
## 0.3.13 (2020-09-27)

### Added

- ✨ Check availability of localdevice source [[d3cc966](https://github.com/geekuillaume/soundsync/commit/d3cc966779996d48a2dc7036cd2b26d1c1301b9d)]
- ✨ Adds webui control for latency correction per sink [[ff83b27](https://github.com/geekuillaume/soundsync/commit/ff83b27fd2815de9d4f26bce3513806deb242539)]

### Changed

- ⚡ Improve DriftAwareAudioBufferTransformer drift compensation [[c901abd](https://github.com/geekuillaume/soundsync/commit/c901abd83b6d6f5534159ffd31f5791a3cdd903c)]
- ⬆️ Upgrades to audioworklet v5 and adapt to new API [[5d254eb](https://github.com/geekuillaume/soundsync/commit/5d254ebca6b01f567683320abcb95e084a3cbc6c)]
- ⚡ Adapted webaudio sink to new clock drift measure method [[3328a20](https://github.com/geekuillaume/soundsync/commit/3328a20d808c04335c6299c4efa36a6f27568014)]
- ⚡ Reduce soft sync threshold to 2ms drift [[77e4b82](https://github.com/geekuillaume/soundsync/commit/77e4b82ef4c084ab86c84d8f1840fabefc8740f5)]
- ⚡ Keep 2 minutes of timekeep measures to better smooth clock sync [[c92f865](https://github.com/geekuillaume/soundsync/commit/c92f865fd519e02d742e77d89629684c8a3a922b)]
- ⚡ Improve localdevice audio drift measure [[7833b95](https://github.com/geekuillaume/soundsync/commit/7833b95124053320f4ea68806ad24513e94d4615)]
- ⬆️ Update to last audioworklet version [[17524fe](https://github.com/geekuillaume/soundsync/commit/17524fe20ed72083d60695f5943b96a96e2069ae)]
- 🎨 Integrate meanInStandardDeviation in NumericStatsTracker [[730c847](https://github.com/geekuillaume/soundsync/commit/730c84749631191cfe589152416ad7a33fc27057)]
- ⬆️ Update to last audioworklet version [[1b84ded](https://github.com/geekuillaume/soundsync/commit/1b84ded60eae30694f80c8a1ed43385ca7c674ce)]

### Fixed

- 🐛 Fix audio source not being available by default [[a1f9e57](https://github.com/geekuillaume/soundsync/commit/a1f9e572a077bacd57440e6f359ec94e5ac66bb8)]
- 🐛 Fix webui local serving with react router [[1f29303](https://github.com/geekuillaume/soundsync/commit/1f2930379752ca4e4d9acffbb6f5c26dc6d04e79)]
- 🐛 Handle latencyCorrection when computing source latency [[5ebc0aa](https://github.com/geekuillaume/soundsync/commit/5ebc0aa5719320e8ba9a1d533d72857c51d2af56)]
- 🐛 Save latencyCorrection in all sink description [[e0ad48f](https://github.com/geekuillaume/soundsync/commit/e0ad48fefbdb70bee9c0c507f35dd9db20a99e1a)]

### Miscellaneous

- 🚧 Bump to dev version [[5f30495](https://github.com/geekuillaume/soundsync/commit/5f304952bd0d97a9c44b71ae8dbca1af3c927a04)]


<a name="0.3.12"></a>
## 0.3.12 (2020-09-19)

### Fixed

- 🐛 Fix Opus wasm location on build package [[18be38c](https://github.com/geekuillaume/soundsync/commit/18be38cc21e1bb4e32e47824daac39f9091b962e)]

### Miscellaneous

- 🚧 Bump to dev version [[9e67b09](https://github.com/geekuillaume/soundsync/commit/9e67b093ade12eb30aa7e5354f13ca4a98f4a04d)]


<a name="0.3.11"></a>
## 0.3.11 (2020-09-19)

### Added

- ✨ Add logs messages about event loop blocking [[ae86bf0](https://github.com/geekuillaume/soundsync/commit/ae86bf09d6b40f35811b0cc86913e402cba250af)]
- 🔊 Add webrtc error logs [[11431f4](https://github.com/geekuillaume/soundsync/commit/11431f489891e5e47bcd125906acaaf11b48aebd)]
- ✨ Adds error indicator for Audio Source [[8f68296](https://github.com/geekuillaume/soundsync/commit/8f68296a6d0b0987a8383323cffdbe2db957c75a)]

### Changed

- ⚡ Improve timekeeper clock delta measure and separate it in its own file [[f7bf57d](https://github.com/geekuillaume/soundsync/commit/f7bf57db7cfc5c0b725c3bb46f5635a494d18ec6)]
- ⚡ Separate Opus wasm in its own file to improve webui load speed [[efd08a3](https://github.com/geekuillaume/soundsync/commit/efd08a39fdb1e1ab4b44a9cb9af92db1d5caae4b)]
- 💄 Sort sources and sinks on webui by uuid instead of name [[7fdfda8](https://github.com/geekuillaume/soundsync/commit/7fdfda829ba8589054ed703f238fbb5e0df2b131)]
- ⬆️ Update to last audioworklet version [[1cf76d0](https://github.com/geekuillaume/soundsync/commit/1cf76d0001b0ee75e53d15c045e93c9f93176043)]
- ⚡ Move soxr-resampler in its own worker_thread [[cf6ac1f](https://github.com/geekuillaume/soundsync/commit/cf6ac1fcb00e497ecc4b7a6fe9fd3a897eb76824)]
- ⬆️ Bump bl from 3.0.0 to 3.0.1 in /src [[3d5cf37](https://github.com/geekuillaume/soundsync/commit/3d5cf37ca0c7d44cc70589d13afb8b90429442d4)]
- ⬆️ Bump node-fetch in /.github/actions/create-dev-release [[b7ebc88](https://github.com/geekuillaume/soundsync/commit/b7ebc883c6c191964d600f8100fd8ceb712d01a8)]
- ⬆️ Bump http-proxy from 1.18.0 to 1.18.1 in /webui [[30e5027](https://github.com/geekuillaume/soundsync/commit/30e50274d2869b8742433b9d5c75e842684f0f50)]
- ⬆️ Bump http-proxy from 1.18.0 to 1.18.1 in /rendezvous-service [[ee0082e](https://github.com/geekuillaume/soundsync/commit/ee0082e08bb574db414209656cf3e478df51f738)]

### Removed

- 🔇 Prevent out of order chunk message after restarting sink [[7b6430e](https://github.com/geekuillaume/soundsync/commit/7b6430eb1e2320a7057f804fb6d20aa5f6264602)]
- 🔇 Remove debug log [[fe2ca46](https://github.com/geekuillaume/soundsync/commit/fe2ca4692acdda25f59e0145178a872cc4b9e29c)]

### Fixed

- 🐛 Fix infinite loop on error catching and Sentry not initialized [[9465dc6](https://github.com/geekuillaume/soundsync/commit/9465dc67071a2067753eb1cb35b6839a7bf159b3)]
- 🐛 Adds file-loader resolver to root package.json because of wasm import requiring it [[7f4219c](https://github.com/geekuillaume/soundsync/commit/7f4219ce6c37e1816482f88b058080dbb6c3938f)]
- 🐛 Don&#x27;t crash if logging error without stack [[8604c4a](https://github.com/geekuillaume/soundsync/commit/8604c4af9cf4a58cbe44a585b5fb09103bb36b48)]
- 🐛 Fix volume on localdevice sink [[6929fcb](https://github.com/geekuillaume/soundsync/commit/6929fcb7c9565b175630c189a5beaa1aae85b8cd)]
- 🐛 Fix httpInitiator sending message too early [[f7448ef](https://github.com/geekuillaume/soundsync/commit/f7448efdb8222cf20c23e4d8ffc1f50879e8f473)]
- 🐛 Fix systemd start script on headless linux [[b8df6bb](https://github.com/geekuillaume/soundsync/commit/b8df6bb9aa502787214f582812f7536fafeef2b3)]
- 🐛 Fix bug with electron not always ready and systray not showing [[a86f934](https://github.com/geekuillaume/soundsync/commit/a86f934003d72c7b45b53678f79125f479fa5c5d)]
- 🐛 Prevent wasm from catching any unexpected error [[3fd2e1f](https://github.com/geekuillaume/soundsync/commit/3fd2e1fb0d2eb97a4cf2cdd49ba7b5589d3201bb)]
- 🐛 Fix debug variable on webui for source info [[b8c5b4d](https://github.com/geekuillaume/soundsync/commit/b8c5b4dda45fa78c6824aaf8d44c6527bc58560c)]

### Miscellaneous

-  Merge pull request [#30](https://github.com/geekuillaume/soundsync/issues/30) from ThisIsAreku/remove-node-sass [[e8c684d](https://github.com/geekuillaume/soundsync/commit/e8c684d4bf39bd18c7685c127310479dc0da4a09)]
-  Merge pull request [#26](https://github.com/geekuillaume/soundsync/issues/26) from geekuillaume/dependabot/npm_and_yarn/src/bl-3.0.1 [[5a31168](https://github.com/geekuillaume/soundsync/commit/5a31168b6e30dabdd7cd64c23f5500f7dc9289cc)]
-  Merge pull request [#28](https://github.com/geekuillaume/soundsync/issues/28) from geekuillaume/dependabot/npm_and_yarn/rendezvous-service/http-proxy-1.18.1 [[1a3b2a4](https://github.com/geekuillaume/soundsync/commit/1a3b2a4547aa021d9615194da9688e41fbaaa5f6)]
-  Merge pull request [#29](https://github.com/geekuillaume/soundsync/issues/29) from geekuillaume/dependabot/npm_and_yarn/webui/http-proxy-1.18.1 [[b835ad4](https://github.com/geekuillaume/soundsync/commit/b835ad4efb51dfe8862673155517e78de8b3850a)]
-  Merge pull request [#31](https://github.com/geekuillaume/soundsync/issues/31) from geekuillaume/dependabot/npm_and_yarn/dot-github/actions/create-dev-release/node-fetch-2.6.1 [[4007212](https://github.com/geekuillaume/soundsync/commit/40072127dc0c773c62a4641708cab6ea532ca895)]
-  Remove node-sass dependency for webui [[e240f41](https://github.com/geekuillaume/soundsync/commit/e240f413c0c20f89e3488c0999902660ae586d2e)]
- 🚧 Bump to dev version [[85c6fd4](https://github.com/geekuillaume/soundsync/commit/85c6fd478aafb432ec6ef2c54972830534e2c522)]


<a name="0.3.10"></a>
## 0.3.10 (2020-09-09)

### Fixed

- 🐛 Only use enabled local audio devices [[47f3b16](https://github.com/geekuillaume/soundsync/commit/47f3b16d2457b78bee5e5e0b64891369eeddf14e)]

### Miscellaneous

- 🚧 Bump to dev version [[6528312](https://github.com/geekuillaume/soundsync/commit/6528312e9065fdb96098f582e6fc1dff741be4a3)]


<a name="0.3.9"></a>
## 0.3.9 (2020-09-08)

### Changed

- ⚡ Don&#x27;t add disabled devices when auto detecting local devices [[49b3803](https://github.com/geekuillaume/soundsync/commit/49b38031a607ba30ea31a3a679e8cec7b00c3b4a)]
- ⬆️ Upgrade audioworklet [[734c9ac](https://github.com/geekuillaume/soundsync/commit/734c9aceb6420785339d3841148a7533f7d58c10)]
- 🎨 Always order sinks/sources in config file by uuid [[a103dc6](https://github.com/geekuillaume/soundsync/commit/a103dc66d5e140126a5a09316c6b8427fec82d84)]

### Fixed

- 🐛 Fix dev download url on rendezvous service [[fc4637d](https://github.com/geekuillaume/soundsync/commit/fc4637dd1d432802114b2b20d2c11bfc83762855)]

### Miscellaneous

- 🚧 Bump to dev version [[b5c1f35](https://github.com/geekuillaume/soundsync/commit/b5c1f3587a887b1d68d1c03cf017269b0009cd8c)]


<a name="0.3.8"></a>
## 0.3.8 (2020-09-05)

### Added

- ✨ Use rendezvous service download url instead of Github release url [[f5dc2e3](https://github.com/geekuillaume/soundsync/commit/f5dc2e3dceca731724ad4232c0b2876377ed2896)]
- ✨ Create a route in rendezvous service for downloading last soundsync version [[4c61398](https://github.com/geekuillaume/soundsync/commit/4c613986f2617f0aa6434598a62c4bcc9ced81f0)]
- 🔊 Adds logs for http initiator error [[7c83ca0](https://github.com/geekuillaume/soundsync/commit/7c83ca021290df28d21ffa83ac398ba81ac0eb93)]

### Changed

- ⚡ Use real peer time delta when synchronizing audio instead of smoothed value [[5f07d86](https://github.com/geekuillaume/soundsync/commit/5f07d86d8aaf4662698f3424cd9d2da209cf831b)]
- ⚡ Use Opus LowLatency mode to reduce lantecy mismatch between opus and raw streams [[f2764fc](https://github.com/geekuillaume/soundsync/commit/f2764fc1d0ce3ba9599300e79b456a377bef6082)]
- ⚡ Improved SynchronizedAudioBuffer latency measures [[74ed203](https://github.com/geekuillaume/soundsync/commit/74ed203cbc24f58209905319b298cbfa667ce870)]
- 🎨 Fix logging message when old chunk is received [[d7a2059](https://github.com/geekuillaume/soundsync/commit/d7a20595f2e9378be6742571d330631c9e3cc476)]
- ⚡ Do not draw pipes if tab is not visible [[e07011d](https://github.com/geekuillaume/soundsync/commit/e07011d33f71b7ecb475343175c9f8eb48b1fe15)]
- 💄 Add message about latest version of Soundsync in webui [[3b21417](https://github.com/geekuillaume/soundsync/commit/3b21417dc6a951ae59ed44f0797194eed5f60a8b)]

### Fixed

- 🐛 Prevent error message when rendezvous service is used with nodejs [[124107d](https://github.com/geekuillaume/soundsync/commit/124107d4d74f15549b297e47911042eb60e54f14)]
- ✏️ Fix typo [[22c94c7](https://github.com/geekuillaume/soundsync/commit/22c94c71e5fed97030ed5036a23e3fbb0bc41691)]
- 🐛 Fix Dockerfile for rendezvous service [[a654696](https://github.com/geekuillaume/soundsync/commit/a6546969c994c6658bc2bd57aac80d05377715ee)]
- 🐛 Fix indentation error in deploy script [[9b2502b](https://github.com/geekuillaume/soundsync/commit/9b2502b88162561ec70c18fba28acc251958bc12)]

### Miscellaneous

- 🚧 Bump to dev version [[e302e48](https://github.com/geekuillaume/soundsync/commit/e302e4808f50b5a554c7a5725a411840818addd5)]


<a name="0.3.7"></a>
## 0.3.7 (2020-08-31)

### Added

- 🔊 Adds logs to detect hard to reproduce bug [[81544d4](https://github.com/geekuillaume/soundsync/commit/81544d472e99d442545c61fc3d2e3c96e848a6a1)]

### Changed

- 🎨 fix package.json indentation [[a16f4fe](https://github.com/geekuillaume/soundsync/commit/a16f4fecf66dadf2a0c50e3edb5d582544123589)]
- 🎨 Use build version from package.json [[791251b](https://github.com/geekuillaume/soundsync/commit/791251b3e5f422c0b104d6bc5edfaacb380bc1cc)]

### Fixed

- 🐛 Fix version constant and show a message in webui if different version [[1a0d7d5](https://github.com/geekuillaume/soundsync/commit/1a0d7d5bcfcff7af1bdc081dc18071156ed0d714)]

### Miscellaneous

- 🚧 Bump to dev version [[a05619c](https://github.com/geekuillaume/soundsync/commit/a05619c8729208f22080722909a74dcf5e632f14)]


<a name="0.3.6"></a>
## 0.3.6 (2020-08-28)

### Changed

- ⚡ Use median instead of mean for timekeep value [[56dc139](https://github.com/geekuillaume/soundsync/commit/56dc1393b41f5ed6466db0782e9eed1e0cfb95f7)]
- ⚡ Use a UDP like webrtc datachannel for timekeep messages [[87642e1](https://github.com/geekuillaume/soundsync/commit/87642e11f90856b1a70a140ae83b680134dd2a96)]
- ⬆️ upgrade some deps [[2fc40bf](https://github.com/geekuillaume/soundsync/commit/2fc40bf3d0efd9b73564a72954f192908760cbce)]

### Removed

- 🔥 remove unused constants and reduce clock drift tolerance [[e162e0e](https://github.com/geekuillaume/soundsync/commit/e162e0e1ac0f5fcb20ca6b79bbef170499ae8ab0)]
- 🔥 Removes heartbeat and use timekeep messages for timeout detection [[5f64292](https://github.com/geekuillaume/soundsync/commit/5f64292af765330314603dc7e7b8ad6c51c475e1)]

### Fixed

- 🐛 Set channels when creating speaker instead of autodetection [[9e4b963](https://github.com/geekuillaume/soundsync/commit/9e4b963cc56647f9bc292005e76a5e4cf802b90d)]

### Miscellaneous

-  👷 add action to delete old github actions artifacts [[49e0124](https://github.com/geekuillaume/soundsync/commit/49e0124556b413b22993295119db26a374846b56)]
-  👷 disable artifact storing on github actions [[c0d4d1c](https://github.com/geekuillaume/soundsync/commit/c0d4d1cc65e02597954ae7685b10da80fa68d129)]
- 🚧 Bump to dev version [[3149114](https://github.com/geekuillaume/soundsync/commit/31491144ee7554718a1524f56231ba0e51dd0df7)]


<a name="0.3.5"></a>
## 0.3.5 (2020-08-20)

### Changed

- 💄 Improves landing page [[c22f0fd](https://github.com/geekuillaume/soundsync/commit/c22f0fddc51bab0ddd2052106057739c8ce80155)]

### Fixed

- 🐛 fix bug with audioworklet and windows null devices [[918c823](https://github.com/geekuillaume/soundsync/commit/918c823c611f33dc4df8259ab882c216be6ad58c)]

### Miscellaneous

- 🚧 Adds logging when creating audioserver [[f675a7a](https://github.com/geekuillaume/soundsync/commit/f675a7adb9a832fbb376bf52a0cfc953a93440a5)]
- 🚧 Bump to dev version [[e1ba31f](https://github.com/geekuillaume/soundsync/commit/e1ba31fc8bf83ab94d77dfd71382fbefcae697b2)]


<a name="0.3.4"></a>
## 0.3.4 (2020-08-20)

### Changed

- 💄 Change catch phrase [[cc2ec0f](https://github.com/geekuillaume/soundsync/commit/cc2ec0f646061177579a37db72ef9561aaa6fdf0)]
- 💄 Add meta tags to webui [[1bcc841](https://github.com/geekuillaume/soundsync/commit/1bcc841d21a15501ae87f8900f5f0689d5be9a38)]
- 💄 Adds usage steps on landing page [[4194504](https://github.com/geekuillaume/soundsync/commit/419450480ef28ccfc9115a0e2bfa30a90fe30f5a)]

### Fixed

- 🐛 fix systray image not showing [[a809723](https://github.com/geekuillaume/soundsync/commit/a809723150be87a98062c4e07a2d2e95107d4220)]
- 🐛 Fix manifest.json urls and adds more info [[55887dc](https://github.com/geekuillaume/soundsync/commit/55887dc049039315b52701da0f134667aa6ed17d)]

### Miscellaneous

- 🚧 Bump to dev version [[3a30881](https://github.com/geekuillaume/soundsync/commit/3a308814509858d34b087963784f1442c228e1aa)]


<a name="0.3.3"></a>
## 0.3.3 (2020-08-19)

### Changed

- 💄 Improve source activity indicator on webui [[acd5f86](https://github.com/geekuillaume/soundsync/commit/acd5f86bf5a3820ff9efc500e6054069efca88fb)]
- 💄 Don&#x27;t show download buttons when connecting from webui [[6376409](https://github.com/geekuillaume/soundsync/commit/6376409371b0fb6d8c24705551210b79e6b53322)]

### Fixed

- 🐛 Use only one instance of audioserver [[8b24621](https://github.com/geekuillaume/soundsync/commit/8b246212437e0603d95f8fc733122275450435e3)]

### Miscellaneous

- 🚧 Bump to dev version [[f9df694](https://github.com/geekuillaume/soundsync/commit/f9df694c2200fcda63ec0c5295892ff7b3cbaab8)]


<a name="0.3.2"></a>
## 0.3.2 (2020-08-19)

### Added

- ✨ Autodetect new local audio source/sinks dynamically [[1d2f6f4](https://github.com/geekuillaume/soundsync/commit/1d2f6f4d442910b06b72a28b09bbc9f40ba21b3e)]

### Changed

- 💄 Adds more details about localDevice sink and source on webui [[3ebfc15](https://github.com/geekuillaume/soundsync/commit/3ebfc1597548c485dda6b0f10298f420dd5c4320)]
- 💄 Add more info in FAQ and changes webui hero background [[af0365b](https://github.com/geekuillaume/soundsync/commit/af0365bd2303abc2223993695bbce1fe0406a68a)]

### Fixed

- 🐛 Preventing sending wrtc localDescription multiple time [[df6e24d](https://github.com/geekuillaume/soundsync/commit/df6e24de096aa82b290958ef976ced6f3b30c098)]

### Miscellaneous

- 🚧 Bump to dev version [[f499aad](https://github.com/geekuillaume/soundsync/commit/f499aad54f21cb5f6b26486d4f275d233eabd832)]


<a name="0.3.1"></a>
## 0.3.1 (2020-08-18)

### Added

- 👷‍♂️ remove unused logs [[120276b](https://github.com/geekuillaume/soundsync/commit/120276b44f4e333f1200a2bb6617ea80d2b61ef7)]

### Changed

- ⬆️ upgrades audioworklet to fix bug with loopback audio [[9860306](https://github.com/geekuillaume/soundsync/commit/9860306c1c22bc050fe12cac094df201f2f67aed)]
- ⬆️ upgrades audioworklet to fix macos localdevice audio [[165d583](https://github.com/geekuillaume/soundsync/commit/165d5834f72f98f832bbfeb5c03747803ae79cca)]
- ⬆️ upgrades audioworklet [[a6631d0](https://github.com/geekuillaume/soundsync/commit/a6631d0c323dddaffe95731e96f678f88d1dc395)]
- ⬆️ Bumb to new verison of node-audioworklet for better sync [[f5cd1e5](https://github.com/geekuillaume/soundsync/commit/f5cd1e512593b3a67f936ab04f5c59bdbef16a8e)]
- 🔧 Enable volume normalisation for spotify [[a76478d](https://github.com/geekuillaume/soundsync/commit/a76478d8d92805c6ddacf6da092ef3f1d4aab277)]

### Fixed

- 🐛 again fix ipv6 detection for airplay [[057f3aa](https://github.com/geekuillaume/soundsync/commit/057f3aaa9e7ced03f8062d710e511f497298542a)]
- 💚 Fix typo in Github action [[05a3611](https://github.com/geekuillaume/soundsync/commit/05a3611bc58004c71a947cbe9c4c00ffb58042f0)]
- 💚 Fix dev release upload from github action [[aa1fb2b](https://github.com/geekuillaume/soundsync/commit/aa1fb2b72d6e2e4173f9b977a2d7cc7c3241636c)]
- 🐛 Filter out ipv6 address for Airplay speakers [[4ddb371](https://github.com/geekuillaume/soundsync/commit/4ddb3712a16a79ee20b9b2864e5f47fe2b5e9ff2)]

### Miscellaneous

-  Merge pull request [#24](https://github.com/geekuillaume/soundsync/issues/24) from Neamar/patch-4 [[e7d4704](https://github.com/geekuillaume/soundsync/commit/e7d4704e01167ea4253a601d4e4b66c5bf2ab911)]
-  Merge pull request [#23](https://github.com/geekuillaume/soundsync/issues/23) from Neamar/patch-3 [[2600c34](https://github.com/geekuillaume/soundsync/commit/2600c340e24dda64cb94bef98f2850485f7ac5a4)]
- 🚧 Wait for more latency drift data before taking sync action for local device sink [[082f1e7](https://github.com/geekuillaume/soundsync/commit/082f1e7617098d565b4413c6d6378f4c0a5b9f4b)]
- 🙈 Ignore vscode related files [[31fe5b1](https://github.com/geekuillaume/soundsync/commit/31fe5b13c0f967e3a0e0f4a68e000052d520a0f4)]
- 🚧 Allow null source file to be changed by env variable [[a9f7b7e](https://github.com/geekuillaume/soundsync/commit/a9f7b7ebfd6c97808b9daf176d748ce5d4345c76)]
-  Update LandingFAQ.tsx [[702320a](https://github.com/geekuillaume/soundsync/commit/702320a2a94e241463b3ae43b0861f82e36146c5)]
-  Update LandingPage.tsx [[02133e3](https://github.com/geekuillaume/soundsync/commit/02133e36d7fe0073824b722ca8c2c0e15c7af5d5)]
-  Merge pull request [#22](https://github.com/geekuillaume/soundsync/issues/22) from Neamar/patch-2 [[3af5caf](https://github.com/geekuillaume/soundsync/commit/3af5caf0b464ad842c119ceb1710ec76463d792f)]
-  Update Presentation.tsx [[d606854](https://github.com/geekuillaume/soundsync/commit/d606854a8f66b7c07e3cd6161000fba1e948405c)]
- 🚧 Adds more detailed logs when getting RTSP errors [[e2efcf6](https://github.com/geekuillaume/soundsync/commit/e2efcf677bdf214b6cb12662ff662398ed3f9260)]
- 🚧 Bump to dev version [[df6a300](https://github.com/geekuillaume/soundsync/commit/df6a300ed8528d37db86386688f15166d5fc7b34)]


<a name="0.3.0"></a>
## 0.3.0 (2020-08-13)

### Added

- ✨ Adds landing page [[55f790b](https://github.com/geekuillaume/soundsync/commit/55f790bc1964cbb0cd6655cf26bc156509dfd8e8)]
- ✨ Open controller webpage on first run [[cebbdcb](https://github.com/geekuillaume/soundsync/commit/cebbdcb842e05f29d7d73cda663393a024583476)]
- 👷‍♂️ draft of landing page [[1e02fd4](https://github.com/geekuillaume/soundsync/commit/1e02fd4f96786c2e4f41efad880875c6af5c45c1)]
- 📈 Fix tracking for browser [[0109305](https://github.com/geekuillaume/soundsync/commit/01093053e7e95200d6fe587f96234c1eccb2328b)]
- 📈 Ads telemetry with Posthog [[2a52eec](https://github.com/geekuillaume/soundsync/commit/2a52eec947c8832c778d169d04032294fce9a9b6)]
- ✨ Add Airplay sink creation on Webui [[f1bdd85](https://github.com/geekuillaume/soundsync/commit/f1bdd855dca9ab8a9bfa42686047464834737f0b)]
- ✨ Add Sink error message indicator on Webui [[8a58b15](https://github.com/geekuillaume/soundsync/commit/8a58b15649254140d671136796004a479d01f813)]

### Changed

- 💄 Improve some UI details on webui and optimize CSS speed [[71938ce](https://github.com/geekuillaume/soundsync/commit/71938cefdadfc0942e5697d55d4c532d497e47a5)]
- ⚡ Improves landing page perf [[e7ccd89](https://github.com/geekuillaume/soundsync/commit/e7ccd8905af1fcec77ba16b814224fcf142ea454)]
- 🎨 Store download links for webui in a dedicated object used by other pages [[4bd0318](https://github.com/geekuillaume/soundsync/commit/4bd0318be8ce0079b0380f5adbb551ac418100a0)]
- ♻️ Improves webui code structure [[5f7b067](https://github.com/geekuillaume/soundsync/commit/5f7b06704513f84f001ae3a4e5bd6d1a27ff3687)]

### Removed

- 🔥 Removes unused toObject method [[88027ca](https://github.com/geekuillaume/soundsync/commit/88027ca4767fc6c03f524af167c11cfef655e6a3)]

### Fixed

- 🐛 Fix responsive for landing page [[e17b776](https://github.com/geekuillaume/soundsync/commit/e17b7767a016cb8cd7d23a3da0f2c9986ee6c2a1)]
- 🐛 fix footer font [[0ae4f4e](https://github.com/geekuillaume/soundsync/commit/0ae4f4e6a3a981ca369771190f0462d53a433102)]
- 🐛 don&#x27;t crash if mdns cannot bind to interface [[a848178](https://github.com/geekuillaume/soundsync/commit/a848178a197a5f0eb203818cf492c5182f3ab756)]
- 🐛 Fix sink error not being saved when first creating sink [[590e694](https://github.com/geekuillaume/soundsync/commit/590e6945e2aedcbc72f94904cb68c70baa54d37e)]
- 🐛 Fix buffer size being treated as second but was milliseconds [[b869b83](https://github.com/geekuillaume/soundsync/commit/b869b8368ca30e47272308c9cdbdffd807a8d25c)]
- 🐛 Add missing dep for debian [[b67a89b](https://github.com/geekuillaume/soundsync/commit/b67a89b3ad90a589425d20a1c37739bf87b039bd)]
- 💚 Fix webui build because of nodejs only module being required [[b40657d](https://github.com/geekuillaume/soundsync/commit/b40657d05ac8d717ac553a4e5c894fa7fe2142b3)]
- 💚 Fix github actions [[dbba94f](https://github.com/geekuillaume/soundsync/commit/dbba94f2501e9d2bf510050694d099e881e4e51d)]

### Miscellaneous

- 💫 Improves landing page compatible with section [[b443f6d](https://github.com/geekuillaume/soundsync/commit/b443f6defff59ea4cd185dca50971dc35b79c4b6)]
-  Merge branch &#x27;landing&#x27; into master [[55b6674](https://github.com/geekuillaume/soundsync/commit/55b6674c6d11a8fb88599d2e9e342602f4276390)]
- 📝 Open Microsoft website when C++ redistributable is not found [[81906e6](https://github.com/geekuillaume/soundsync/commit/81906e688301e2a896e000f66c08ffec9d0635bd)]
- 🚧 Add error message to SinkDescriptor [[fcd1389](https://github.com/geekuillaume/soundsync/commit/fcd1389d20434d3cf4e8bc421e738db0a89d2825)]
- 🚧 Airplay sink: implements raw PCM data sending and basic synchronization [[acb35ef](https://github.com/geekuillaume/soundsync/commit/acb35efdf5c2f2f0ce97c4252b0b7b0e78359caa)]
-  Merge branch &#x27;master&#x27; into airplay-speakers [[804f037](https://github.com/geekuillaume/soundsync/commit/804f0374373d5368d34bfc4c5e511f0f4e7504ce)]
-  Merge pull request [#19](https://github.com/geekuillaume/soundsync/issues/19) from geekuillaume/dependabot/npm_and_yarn/webui/elliptic-6.5.3 [[f97c6e4](https://github.com/geekuillaume/soundsync/commit/f97c6e42b0903c0422af48bdbe111544717c6450)]
- 🚧 Bump to dev version [[1bac537](https://github.com/geekuillaume/soundsync/commit/1bac5375bdc7e1d01c9cfbd68dc0cb51d5d75aa9)]
- 🚧 Airplay sink: Adds audio transmission code and fix alac encoder [[d8cc893](https://github.com/geekuillaume/soundsync/commit/d8cc893f1187ff923c0ba9a5c9f1b5479a8adeec)]
-  Disable artifact upload on branch other than master [[e372263](https://github.com/geekuillaume/soundsync/commit/e372263caf1b5a59b7700df563ce566485625164)]
-  Merge branch &#x27;airplay-speakers&#x27; of github.com:geekuillaume/soundsync into airplay-speakers [[a614aa4](https://github.com/geekuillaume/soundsync/commit/a614aa4988a41e9a95b9327a0a96e1d6264c6600)]
- 🚧 continue airplay sink implementation and adds alac encoder [[5bcad1c](https://github.com/geekuillaume/soundsync/commit/5bcad1cc32fed782722cab63f521e92e594dc068)]
- 🚧 implements timing request responses for airplay [[a44fa31](https://github.com/geekuillaume/soundsync/commit/a44fa31d2387cd0c48db5acba8f644c52cb6f16b)]
- 🚧 initial airplay speakers integration [[998cb87](https://github.com/geekuillaume/soundsync/commit/998cb87664a6aaf50cc8ba4197fd47021ff32d30)]
-  Bump elliptic from 6.5.2 to 6.5.3 in /webui [[8baae8a](https://github.com/geekuillaume/soundsync/commit/8baae8a6a982289c29043e2d1293777783364990)]
- 🚧 implements timing request responses for airplay [[636b0c9](https://github.com/geekuillaume/soundsync/commit/636b0c96f85e09895164fa8ccdd1178cfb591926)]
- 🚧 initial airplay speakers integration [[8b9fd9d](https://github.com/geekuillaume/soundsync/commit/8b9fd9d3af0ba1874229232ca31885a7c99abd89)]


<a name="0.2.5"></a>
## 0.2.5 (2020-08-02)

### Changed

- ♻️ Migrate to Uint8Array instead of Buffer [[398065c](https://github.com/geekuillaume/soundsync/commit/398065c98c3e7aec78d94ac401f92dcbf3287c6f)]
- ⚡ Reduce memory allocation linked to resampler [[4fb93c9](https://github.com/geekuillaume/soundsync/commit/4fb93c9983c6310c7b9b6eeb1db86a2e17032ec7)]
- ⬆️ update electron and electron-builder deps [[fafa953](https://github.com/geekuillaume/soundsync/commit/fafa9538c3f0ea59be18d647ff368b4eb1947e49)]
- ⬆️ update wrtc dep [[9765f50](https://github.com/geekuillaume/soundsync/commit/9765f50e8556f9ee602ea8e8dc63561b2d857f54)]

### Fixed

- 🐛 fix buffer sizing issues by always resampling, fixes [#17](https://github.com/geekuillaume/soundsync/issues/17) [[1c22fba](https://github.com/geekuillaume/soundsync/commit/1c22fbaa9c0a28960377acf068e1c586e79de652)]
- 🐛 Don&#x27;t exit on error related to autolaunch at startup, fixes [#18](https://github.com/geekuillaume/soundsync/issues/18) [[bb5a4b5](https://github.com/geekuillaume/soundsync/commit/bb5a4b5a12ce7d23c8ff0b094603c4de205fdf20)]
- 🐛 don&#x27;t exit process on mdns error [[fb6044b](https://github.com/geekuillaume/soundsync/commit/fb6044b187ddf11905dc25a3997bf2d414512c5c)]

### Miscellaneous

- 🔨 Bump to dev version after deploying new version [[9a748e5](https://github.com/geekuillaume/soundsync/commit/9a748e540115137efd461ac097f057fa3eab6357)]
- 📝 remove development version wording from download links in readme [[f4b59bb](https://github.com/geekuillaume/soundsync/commit/f4b59bbece651343f1e502b891fbc558074ab1b9)]


<a name="0.2.4"></a>
## 0.2.4 (2020-07-27)

### Fixed

- 🐛 Fix memory leak [[81e92af](https://github.com/geekuillaume/soundsync/commit/81e92af121ee25a1082d579bd7842cc045cd7313)]
- 🐛 fix windows executable link [[4f8a922](https://github.com/geekuillaume/soundsync/commit/4f8a922866fe6bcac080424afd7de3f9f3c47f78)]


<a name="0.2.3"></a>
## 0.2.3 (2020-07-27)

### Fixed

- 🐛 fix quotes when updating readme on deploy [[1aa3e76](https://github.com/geekuillaume/soundsync/commit/1aa3e76413f121055cf1fbb3ce44e12c19c6bdc0)]


<a name="0.2.2"></a>
## 0.2.2 (2020-07-27)

### Added

- 👷‍♂️ update deploy script [[fba74d2](https://github.com/geekuillaume/soundsync/commit/fba74d22c596e4dd03329fe99d8993750f4e0bcb)]

### Miscellaneous

-  Fix bug with choppy audio because of chunkstream reading too fast [[53cd51f](https://github.com/geekuillaume/soundsync/commit/53cd51ff7d52a910a0b7ed128a8f462e886aaf14)]
-  Adds mdns for rendezvous service notifier [[829db42](https://github.com/geekuillaume/soundsync/commit/829db42581c7988a0115fd144c1ed484f3094019)]
-  Commented WIP about mdns [[a7fa1cc](https://github.com/geekuillaume/soundsync/commit/a7fa1cc288c17c62f9b6813427ec04dc94fdd745)]
-  Add deploy script [[b9310ba](https://github.com/geekuillaume/soundsync/commit/b9310ba24cfd58d932729dec74a85cfe29df4eda)]
-  Add download link for development version in Readme [[2f03fb3](https://github.com/geekuillaume/soundsync/commit/2f03fb34fb6ef7020417abf32d6fbdb7906aa58b)]
-  Updates install links on webui [[90eea19](https://github.com/geekuillaume/soundsync/commit/90eea193aa6269eb1ec7eb0426324e0bf914a9f5)]
-  Update readme install links to last version [[d5bf870](https://github.com/geekuillaume/soundsync/commit/d5bf870915b34215b1834a51f869684a6cd790f7)]
-  Clean remaining files before uploading release [[2ad76be](https://github.com/geekuillaume/soundsync/commit/2ad76be8518e6ed5d7fdb45b76ac1562fb6efbe8)]
-  Rename installers to lowercase before uploading [[62f920a](https://github.com/geekuillaume/soundsync/commit/62f920a8409054478cf26760ce7fed7526f043ec)]
-  clean .ico file before uploading release artifact [[3472512](https://github.com/geekuillaume/soundsync/commit/3472512545c4c034581809ec77c089e33ecfc882)]
-  Change installer name [[548b404](https://github.com/geekuillaume/soundsync/commit/548b40470d1e6e90d013919141489b33145cd8cd)]
-  Add missing package [[08774f0](https://github.com/geekuillaume/soundsync/commit/08774f088b94e05a88c267f34946c4842d35b287)]
-  Updates librespot executable [[3602ddd](https://github.com/geekuillaume/soundsync/commit/3602ddd14023395797843a78c51f100a6751e055)]
-  Update version in app package.json [[6d2b2b2](https://github.com/geekuillaume/soundsync/commit/6d2b2b2c15dfa55e99c45885b8445ad4d6e500c3)]


<a name="0.2.1"></a>
## 0.2.1 (2020-07-21)

### Miscellaneous

-  Reorganize files in utils directory [[91e0b36](https://github.com/geekuillaume/soundsync/commit/91e0b36a931a91e30aad502119174f421d1e1d56)]
-  Again github action fix [[e216175](https://github.com/geekuillaume/soundsync/commit/e2161751e8daaaf8709a93807903259f918cce3b)]
-  Fix github action [[24db3be](https://github.com/geekuillaume/soundsync/commit/24db3be02c4ea5f578511896dbbcb918c6f74fb2)]
-  v0.2.1 [[47e984b](https://github.com/geekuillaume/soundsync/commit/47e984bb834f91648866b05ce836f5062e6c1986)]
-  Fix github action release [[2c88114](https://github.com/geekuillaume/soundsync/commit/2c881143759a188693b9906e6de67bcfed46e060)]


<a name="0.2.0"></a>
## 0.2.0 (2020-07-21)

### Miscellaneous

-  v0.2.0 [[ded4d13](https://github.com/geekuillaume/soundsync/commit/ded4d13c19eb00b4e2a35ffc7e72825909b7dcc6)]
-  Make github action create a new release if a tag is deployed [[7da8890](https://github.com/geekuillaume/soundsync/commit/7da8890ddeaca079755e42755a6a8132621f342b)]
-  Fix resampler chunk size crashing process [[d74429e](https://github.com/geekuillaume/soundsync/commit/d74429e7d57edeb5fc436d412577f81951bcb053)]
-  Clean left references to speex-resampler [[b359673](https://github.com/geekuillaume/soundsync/commit/b3596730f9364980e00b057a03517ab81e45eb44)]
-  Switch to soxr resampler for improved performances [[2260c0c](https://github.com/geekuillaume/soundsync/commit/2260c0cc685190f6322b25b4482ac7ce9e4efd21)]
-  Fix memory leak because of debug instance creation [[9f7ade6](https://github.com/geekuillaume/soundsync/commit/9f7ade62ab028c84d380110422a316b84cde0ae4)]
-  Fix systray [[8ab2bd3](https://github.com/geekuillaume/soundsync/commit/8ab2bd32c53b5045e42ecee80d0e7924962d1bdf)]
-  Add discord links [[9483692](https://github.com/geekuillaume/soundsync/commit/9483692ecaab2679ccc6f2926059d9b2f95e3e85)]
-  Increase time period for webaudio drift estimation [[1b41ea8](https://github.com/geekuillaume/soundsync/commit/1b41ea80965d83619b796d52729e8ec1f7d08d84)]
-  Add instructions to install Soundsync on a raspberry pi [[018ff1b](https://github.com/geekuillaume/soundsync/commit/018ff1b99c3c7df2b88b2a8c6f76e314fe5e5cc3)]
-  Updates speex-resampler [[fdedb15](https://github.com/geekuillaume/soundsync/commit/fdedb1512b23ea95ecd058dd9bdda161d95e76c9)]
-  Don&#x27;t compress with Opus for local source to local sink communication [[af82542](https://github.com/geekuillaume/soundsync/commit/af825429ac62b2f1d3618b0b79cdcb22c6e588d4)]
-  Reimplement FFT stream to improve performance [[3889280](https://github.com/geekuillaume/soundsync/commit/388928095d42055f34ac5227c188b53a673324b9)]
-  Fix cleaning of webrtc peer on disconnect [[b8d6dd8](https://github.com/geekuillaume/soundsync/commit/b8d6dd8382a68fc39f3b6163d687f731680ae932)]
-  Use BasicNumericStatsTracker to handle timekeep messages between peers [[2524ab8](https://github.com/geekuillaume/soundsync/commit/2524ab8870962fb7951253027f12c012f04cb54e)]
-  Removed delayed drift correction loging [[91359d5](https://github.com/geekuillaume/soundsync/commit/91359d540732304ef8b1d37fbada2aa41d94a8ca)]
-  Add more info in log message [[cee9455](https://github.com/geekuillaume/soundsync/commit/cee94557eae3697533ed815e054476d2e18f5ff9)]
-  Fix bug with datachannel state inconsistency [[ad0d62d](https://github.com/geekuillaume/soundsync/commit/ad0d62de09dc0f37168bbd08205b6c29d41f62d7)]
-  Fix startedAt not being shared by chunk stream emitter resulting in delay in chunk emitting [[65428b7](https://github.com/geekuillaume/soundsync/commit/65428b71b7eec7ef70609a6c768b35163e88ea55)]
-  Discard old chunks in sink [[49c679e](https://github.com/geekuillaume/soundsync/commit/49c679e451d9f494e221f3ce04d50d9d76b81e7f)]
-  Read chunks from audio source process before resampling to bypass internal buffer and highly improve latency [[d7639df](https://github.com/geekuillaume/soundsync/commit/d7639dfb8d72fedb9399ec3642a0e028198d4415)]
-  Optimize buffer handling for hue sink [[4d63da4](https://github.com/geekuillaume/soundsync/commit/4d63da4809aff621a5402808043cc45996ea7671)]
-  Use native find instead of lodash [[cc26125](https://github.com/geekuillaume/soundsync/commit/cc26125e01f244bca7ed1bc4c18ee3961b3aeffd)]
-  Update to speex-resampler@2.0.2 to fix audio bug [[f718491](https://github.com/geekuillaume/soundsync/commit/f7184916fd6e5a5ec5451672ea45aad3169cf5fe)]
-  Fix electron missing error, fixes [#10](https://github.com/geekuillaume/soundsync/issues/10) [[c5ce35e](https://github.com/geekuillaume/soundsync/commit/c5ce35e263fc0f88a2376065391810542e03560e)]
-  Fix race condition bug [[ed45e09](https://github.com/geekuillaume/soundsync/commit/ed45e09eefe358d46fd943eaac400a794707666a)]
-  Fix too many listener warnings [[648d103](https://github.com/geekuillaume/soundsync/commit/648d103e896f0b14f1980dc35c6754f967b3358b)]
-  Add message about downloading Visual C++ redistributable when error on windows about module not found [[4fad965](https://github.com/geekuillaume/soundsync/commit/4fad965cb169b6a4054d01759ca9034191be4105)]
-  Reenable exception capture with Sentry [[828cbee](https://github.com/geekuillaume/soundsync/commit/828cbee379482903db1ec0b4c7ec2ce01ae29d52)]
-  Ignore direnv file [[4be3afe](https://github.com/geekuillaume/soundsync/commit/4be3afe0444734307c787d792f08f860e0bd9a69)]
-  Disable sentry in dev mode [[63a5936](https://github.com/geekuillaume/soundsync/commit/63a5936ef4a42d622e4c5e6b4fbad8a97613a4b4)]
-  Add message about error connecting to other peer and indication to bypass DNS rebinding protection [[6e6aef4](https://github.com/geekuillaume/soundsync/commit/6e6aef4fb7c304ed5bc5ab71ac6d2fbec718bc84)]
-  Add message about incompatible browser [[748ae17](https://github.com/geekuillaume/soundsync/commit/748ae1710933827047cdde07f28246450e4f56d1)]
-  Improves typings of some modules [[fb8bc4d](https://github.com/geekuillaume/soundsync/commit/fb8bc4dfa7b10917b29f5f0d657455c66c171925)]
-  Improve error handler for electron [[e2a6b38](https://github.com/geekuillaume/soundsync/commit/e2a6b3860d3fcda179d0cf49afeed14352418d39)]
-  Fix error on closing already closed audio channel [[f15c383](https://github.com/geekuillaume/soundsync/commit/f15c3838a1282b2d5760df107a157c7042aee1ba)]
-  Add debug env variable for audio logging [[ceca375](https://github.com/geekuillaume/soundsync/commit/ceca375eec518292f63d06b371e57f9e31d95dfd)]
-  Lower speex quality to 5 instead of default 7 [[c1e30a1](https://github.com/geekuillaume/soundsync/commit/c1e30a13fbb5c9effff30b6fb0009332a525ca17)]
-  Update speex resampler to use webassemby instead of napi [[8252a67](https://github.com/geekuillaume/soundsync/commit/8252a671fe6325cafd8ebb6998cbc799d0b50761)]
-  Fix AudioChunkStreamOrderer and enable Packet Loss Conceilment in Opus [[2a2430f](https://github.com/geekuillaume/soundsync/commit/2a2430fcd667ff08e8ced8bfaac3147d7d735337)]
-  Allow false value for webui localstorage disableRendezVousService config [[7f52f61](https://github.com/geekuillaume/soundsync/commit/7f52f61877feb33ddac9a74cd0eb2090d5e696e9)]
-  Fix race condition bug [[8c076f5](https://github.com/geekuillaume/soundsync/commit/8c076f5f41cee51e83bd5598aaa1ca774a6130e8)]
-  Fix leak in startSource rpc [[baa47a6](https://github.com/geekuillaume/soundsync/commit/baa47a60f514ac2e196a8e7855e9bab23876635e)]
-  Fix potential race condition [[31f3d14](https://github.com/geekuillaume/soundsync/commit/31f3d14d456c74ed46f896c6d5e12b75645d3ad0)]
-  Fix sorting of hidden sources/sinks on webui [[15245ff](https://github.com/geekuillaume/soundsync/commit/15245ff393598d085f04809d3d5d47eda54ec1ce)]
-  Fix error with dynamic source latency calculation [[1ef2e53](https://github.com/geekuillaume/soundsync/commit/1ef2e531c11907cd802c5d2c483e6ec085f46525)]
-  Fix error with manually closed hue socket crashing process [[b4be561](https://github.com/geekuillaume/soundsync/commit/b4be561cd02258a6a4951d84949f84cc0db13f93)]
-  Force sort order for webui sources and sinks [[cc78c6c](https://github.com/geekuillaume/soundsync/commit/cc78c6ca7ca41e739540ae96f02b6f824141f4bd)]
-  Add a RPC to start source before checking if active or not [[fcb19af](https://github.com/geekuillaume/soundsync/commit/fcb19aff2c14a43579f07840105dd69707d9ae1f)]
-  Fix huelight sink when hue sync is manually stopped [[eb80003](https://github.com/geekuillaume/soundsync/commit/eb80003fd227d2217ca5bff778bfb2ceba05f7c4)]
-  Fix latency from descriptor not being used [[9c8ba7c](https://github.com/geekuillaume/soundsync/commit/9c8ba7c3309aba15035220de84c480d80b156f34)]
-  Dynamic latency for source depending on connected sinks [[5f8f9ba](https://github.com/geekuillaume/soundsync/commit/5f8f9ba4639b8e3b4d79090faddccef9f418af82)]
-  Improves hue integration [[1b84de1](https://github.com/geekuillaume/soundsync/commit/1b84de1e1698092d06032580bf61f68a9a898171)]
-  Use correct property for webaudio latency [[7be7e56](https://github.com/geekuillaume/soundsync/commit/7be7e564c10103938fcec64ad82640a79239bd73)]
-  Add kiosk mode [[17d95cb](https://github.com/geekuillaume/soundsync/commit/17d95cb675dae78fde5b65a5882790999df5ab91)]
-  Update TODO [[bd2eec1](https://github.com/geekuillaume/soundsync/commit/bd2eec128b271f33c981fb64354670e41d3f9d70)]
-  Add chunk orderer [[a11b6bc](https://github.com/geekuillaume/soundsync/commit/a11b6bcf6e5806b534f0c12b68abb48d5aa0c79c)]
-  Set audio source as active by default [[2db91ae](https://github.com/geekuillaume/soundsync/commit/2db91ae486d862880ddfa8c70858afda3f965735)]
-  Remove debug logging [[bb04c35](https://github.com/geekuillaume/soundsync/commit/bb04c3505731518ec88d5bdc1d6bfe026a303c18)]
-  Track the active state of a source and stop all linked sinks if source is inactive for more than 30 seconds [[a8e132a](https://github.com/geekuillaume/soundsync/commit/a8e132a7274153fbab3bdf1d9a2b54c880f59afd)]
-  Adds more details on sink/source selection in the Webui [[97009f8](https://github.com/geekuillaume/soundsync/commit/97009f893922afbb0d87466627d32d5f407b9408)]
-  Adds message about hue auth on webui [[4209e53](https://github.com/geekuillaume/soundsync/commit/4209e533a6bc3d4b3dd8d177dd3249ec985496d4)]
-  Increase timeout for hue auth [[227efbf](https://github.com/geekuillaume/soundsync/commit/227efbfd10d1d4bd68fec3821f70ffcfff7d26d2)]
-  Fix bug with shared state update [[c0bbc09](https://github.com/geekuillaume/soundsync/commit/c0bbc09d6081c84b2c34c70f8649f434f537fd5b)]
-  Allow deleting sink from webui [[e91d9b3](https://github.com/geekuillaume/soundsync/commit/e91d9b3f407f085b140babb4933526652175639f)]
-  Reactivate create hue sink button on webui [[5610c5e](https://github.com/geekuillaume/soundsync/commit/5610c5e85ee24390872cfcbaad2b198cef67a7f2)]
-  Store hue info in SharedState [[a77341e](https://github.com/geekuillaume/soundsync/commit/a77341eb633088786832834e7d800872e076db20)]
-  Updates TODO [[f646185](https://github.com/geekuillaume/soundsync/commit/f64618502359e005bd6dbcea8bf1706fccd2ce47)]
-  Clean unused file [[14379a9](https://github.com/geekuillaume/soundsync/commit/14379a921e199e58be48af8cb2ba25975cc5f69b)]
-  Fix typo [[d7ac07b](https://github.com/geekuillaume/soundsync/commit/d7ac07b74451274869b06ef9d463fe759e15b246)]
-  Improve Hue lights responsiveness from music [[297ec9a](https://github.com/geekuillaume/soundsync/commit/297ec9a70794402bc067e7592a4dca8d9a38d228)]
-  Close all sinks on exit and clean exit hook for peers object [[93ad20c](https://github.com/geekuillaume/soundsync/commit/93ad20c1c8f60aa47f0a616283ebc0fe5266c12f)]
-  Clear unused testing file [[99d2234](https://github.com/geekuillaume/soundsync/commit/99d2234663131793a35cb66cd5f809b782fcb433)]
-  Remove out-of-order log message [[3c511db](https://github.com/geekuillaume/soundsync/commit/3c511db0cf29b88c52598fc0693cd08299c247c3)]
-  Improved audio synchronizer [[68047f1](https://github.com/geekuillaume/soundsync/commit/68047f18deb2ed1a65bbddd39130058e5ab0528b)]
-  Adds debug mode for synchronized audio on web [[be0bb63](https://github.com/geekuillaume/soundsync/commit/be0bb63261cd1f5b263119225cad00f9acc8690f)]
-  Fix librespot dep on windows [[9623684](https://github.com/geekuillaume/soundsync/commit/9623684ba6fedf8665a5f589ed3e209a764d9a4c)]
-  Fix error when librespot or shairport would crash at startup [[8db1e9d](https://github.com/geekuillaume/soundsync/commit/8db1e9d9c21c6f8ceec055eb9e93cbff4c0117eb)]
-  Adds Github link on webui [[e935a2d](https://github.com/geekuillaume/soundsync/commit/e935a2dfff5045e6705eb1a844b9256fa7dd3242)]
-  Reduces memory allocation and prevent reading same samples twice [[05c2316](https://github.com/geekuillaume/soundsync/commit/05c231666070f9509c71f63d6aa4f7e9e556ba2d)]
-  Adapt webaudio sink to use SynchronizedAudioBuffer [[6fa8e54](https://github.com/geekuillaume/soundsync/commit/6fa8e54074621e51c82f280d4e8bce8eab7ad86c)]
-  Improves audio drift delta correction calculation [[9307901](https://github.com/geekuillaume/soundsync/commit/930790146f9dedeb3592ffc2c77283cb7521b9d4)]
-  Use reader pointer of circularTypedArray instead of property of synchronizedAudioBuffer to keep track of buffer advance [[5d45aca](https://github.com/geekuillaume/soundsync/commit/5d45aca56df23ef63cbabd7693b90da232316d80)]
-  Implements a new way of synchronizing audio to prevent glitch [[06c224b](https://github.com/geekuillaume/soundsync/commit/06c224b5d63bb87f2755cb1754169b5ce0ebde5d)]
-  Updates todo and FAQ [[f040398](https://github.com/geekuillaume/soundsync/commit/f0403983f8c97fed3e44c100310b31fc2ee31c30)]
-  Updates TODO [[6e572fa](https://github.com/geekuillaume/soundsync/commit/6e572fa323b51e913a7e37adb6456c6f0e0d8c0a)]
-  Adds a util function window.soundsyncDebug to activate debug mode [[0bb4cc4](https://github.com/geekuillaume/soundsync/commit/0bb4cc41a18f6b45b605d3da5c461d926f40b2a8)]
-  Fix chromecast unused messaging [[12eb8b2](https://github.com/geekuillaume/soundsync/commit/12eb8b2781f66332a07753aa4162550ea7f38d42)]
-  Adds chromecast integration [[802e478](https://github.com/geekuillaume/soundsync/commit/802e478541bb584779b9edfa4482aec9fc5c71f9)]
-  Adds localtunnel to CORS allowed origins [[1cf20b4](https://github.com/geekuillaume/soundsync/commit/1cf20b483f3137096803a6acc9fce7066edeceac)]
-  Disable add hue sink button on webui for now as it is not working yet [[1c981ab](https://github.com/geekuillaume/soundsync/commit/1c981abfc2e9448212687ff68340a0635a93bfae)]
-  Detect webaudio sink availability [[3f0bfaf](https://github.com/geekuillaume/soundsync/commit/3f0bfaf6538c1f66a9e516b881ab2a36103c09ee)]
-  Clean some properties of AudioSource and AudioSink [[4e23d26](https://github.com/geekuillaume/soundsync/commit/4e23d267778e5d7f7065ca36db2a97a6c7e30511)]
-  Choose samplerate dynamicaly for localdevice source [[a840442](https://github.com/geekuillaume/soundsync/commit/a8404421bc1dad86e5ead3d2f64f3bb202e9e3f6)]
-  Consider localdevice sink as unavailable at first before testing it [[2d3fe09](https://github.com/geekuillaume/soundsync/commit/2d3fe092ce717c211366d9e24b3602872540194a)]
-  Fix log message [[657ee2f](https://github.com/geekuillaume/soundsync/commit/657ee2f9867d14f852359462741ced7569c43bb3)]
-  Handle mono input for localdevice source [[73c6a61](https://github.com/geekuillaume/soundsync/commit/73c6a61ebfe588c86d2a00f2cd93e1bd2e255bd3)]
-  Fix a bug on Windows related to stream name [[37d3d13](https://github.com/geekuillaume/soundsync/commit/37d3d135f03c5def7167bcad44ee9e470aa9087a)]
-  Adds tracking for webrtc errors [[8142d22](https://github.com/geekuillaume/soundsync/commit/8142d22c0b0a57df1d7a485fd3fc71bfa3bdb284)]
-  Fix an error occuring when rendezvous service is unreachable [[a36bb4b](https://github.com/geekuillaume/soundsync/commit/a36bb4b6075290e1972710ac2c616e5ea4e129aa)]
-  Ignore other pcm test files [[0a51cd1](https://github.com/geekuillaume/soundsync/commit/0a51cd1c2409f7ef4c457be8d5e2c8280c511dfe)]
-  Improves performance of volume slider on webui [[c8c979d](https://github.com/geekuillaume/soundsync/commit/c8c979d99e87aac5705b44c06e8b60a0522cd85a)]
-  Update todo [[ee6caf3](https://github.com/geekuillaume/soundsync/commit/ee6caf3fd0ca8fa8585434439b86c0bcd8c51987)]
-  Updates Readme [[3efedcb](https://github.com/geekuillaume/soundsync/commit/3efedcbf097c3ed9a7a7027f33138fe582083b8c)]
-  Add sentry integration for webui [[c33bbe6](https://github.com/geekuillaume/soundsync/commit/c33bbe68403cba2b80739a9dbcb0177102814308)]
-  Merge branch &#x27;master&#x27; of github.com:geekuillaume/soundsync [[14c9e24](https://github.com/geekuillaume/soundsync/commit/14c9e24f5cebf5b48c142db181e1953449f0ee73)]
-  Use node sentry instead of electron integration [[66ec084](https://github.com/geekuillaume/soundsync/commit/66ec084840b4b00e49c401e7e13df06a72580057)]
-  Merge pull request [#2](https://github.com/geekuillaume/soundsync/issues/2) from geekuillaume/dependabot/npm_and_yarn/webui/websocket-extensions-0.1.4 [[3642dc6](https://github.com/geekuillaume/soundsync/commit/3642dc65ff9e551d8145a2849dc538c041b4dcf6)]
-  Expression simplifying [[558ab6c](https://github.com/geekuillaume/soundsync/commit/558ab6c2b39a8bab1d5cb914c3d9e3dae032638c)]
-  Use float64 to store circular buffer index to prevent overflow of uint32 [[6e0c024](https://github.com/geekuillaume/soundsync/commit/6e0c024d0cc11f5b00f2de99f935837b9e870118)]
-  Improves logging of timesync messages [[769db11](https://github.com/geekuillaume/soundsync/commit/769db11552773ef9956a96fcf267d282d002336a)]
-  Bump websocket-extensions from 0.1.3 to 0.1.4 in /webui [[d2575e3](https://github.com/geekuillaume/soundsync/commit/d2575e3859b9db0f5377faaf9bd58892fb9e20d9)]
-  Fix config for new device [[0d2440d](https://github.com/geekuillaume/soundsync/commit/0d2440d1ed936b827ccf3b5e2fb6807a34244b71)]
-  Try again ficing for macos [[69d29be](https://github.com/geekuillaume/soundsync/commit/69d29be925f78c4c2bb267095b4fb8a77e907f62)]
-  Fix update_build_version script for macos [[04dbff9](https://github.com/geekuillaume/soundsync/commit/04dbff99b9015e31310962aa8a30bd518640541c)]
-  Integrate sentry for error tracking [[6f2e37b](https://github.com/geekuillaume/soundsync/commit/6f2e37b1d985c30c7fcbcc2fde0e8e1c0f3f3fa6)]
-  Disable debug logs [[b0b9d35](https://github.com/geekuillaume/soundsync/commit/b0b9d35decc6dab0c40f9389ba89e3d9e56fe8e5)]
-  Use better names for connection in progress peers [[e3e41ea](https://github.com/geekuillaume/soundsync/commit/e3e41ea70b4b574ece83618bfc30ae664bb8473e)]
-  Add option to prevent connecting to localpeer on webui [[de434c1](https://github.com/geekuillaume/soundsync/commit/de434c134e6bdbc7db1f0fa1d9c95d208f0dfeef)]
-  Wait for message to be sent on rendezvous server before responding to sni request [[5ec4c37](https://github.com/geekuillaume/soundsync/commit/5ec4c37ad936c6938d4804a1f018ac5587cc8858)]
-  Disable node-hue-api for webui as it is crashing firefox [[303b24f](https://github.com/geekuillaume/soundsync/commit/303b24f692f36a910c72054bcad1001fb1dd6793)]
-  Bumping node wrtc [[04f23d2](https://github.com/geekuillaume/soundsync/commit/04f23d2fc880ce21b171db1d67c06adc3efd1e85)]
-  Allow deletion of null source on webui [[294a9b7](https://github.com/geekuillaume/soundsync/commit/294a9b7a2256444f27861ace68edafe1b5ea1c8e)]
-  Handle rpc errors [[d23fb0f](https://github.com/geekuillaume/soundsync/commit/d23fb0f096d7e3569457f663f0dba3ba5ae0d494)]
-  Fix adding source without uuid [[49b37a5](https://github.com/geekuillaume/soundsync/commit/49b37a541d2b63de0eafcc05a71dfb92c36e8edf)]
-  Starts integrating Philips hue light viz [[acaf474](https://github.com/geekuillaume/soundsync/commit/acaf474ec9172693399c8f7e8895361888c37e8f)]
-  Fix errors with config deleting previous sources/sinks [[3c34edf](https://github.com/geekuillaume/soundsync/commit/3c34edf9310d90a3abd977c86be8d8f67f72f34a)]
-  Implement a getter for AudioSourcesSinksManager to prevent circular refs [[6a8fd78](https://github.com/geekuillaume/soundsync/commit/6a8fd7835db3678993c4d3acbd8d00db6fc40b46)]
-  Adds createSink rpc [[f414cc6](https://github.com/geekuillaume/soundsync/commit/f414cc686e15999d521da30e65ef0c00dbb69daf)]
-  Adds check to cover all source/sink types when creating [[2d759af](https://github.com/geekuillaume/soundsync/commit/2d759af0473f16ce35ef1e269cac00213bd1b22e)]
-  Fix librespot and shairport add source on webui [[35a0da6](https://github.com/geekuillaume/soundsync/commit/35a0da6201df1421b128cf7103bffadbf644c011)]
-  Fix package.json file [[761c931](https://github.com/geekuillaume/soundsync/commit/761c931f460f007737a0826b85de5e4bdefcc9b0)]
-  Adds rpc framework and implement scan hue rpc [[46915c2](https://github.com/geekuillaume/soundsync/commit/46915c2c293a8c6a4473084d5577d7af63a0ce7a)]
-  Adds loggin on peer click for webui debug [[647ef56](https://github.com/geekuillaume/soundsync/commit/647ef56a5055a4108b75ddf6236505287597e51e)]
-  Refactored config saving to include/exclude fields for config saving in source/sink class [[d572c60](https://github.com/geekuillaume/soundsync/commit/d572c60b39d8f09382b0ed6147b76c79c57bfe82)]
-  Use SNI callback for rendezvous message advertisement as chrome deprecated previous method with http images on https origin [[7a424f2](https://github.com/geekuillaume/soundsync/commit/7a424f29fb2130be314f9d54b1e9aeb6ef530f11)]
-  Fix systray icon [[d863b24](https://github.com/geekuillaume/soundsync/commit/d863b246d148728e63b96addf53c228a3698dc79)]
-  Revert packagejson version [[ed37692](https://github.com/geekuillaume/soundsync/commit/ed3769210774cfe0dc356eedaf8c050a113c5904)]
-  Revert &quot;Fix package json require for version&quot; [[0705eba](https://github.com/geekuillaume/soundsync/commit/0705eba0b8bd385e5528b7fe916e3c3d9b561423)]
-  Revert &quot;Try fixing windows not supporting symbolic links&quot; [[e3546e6](https://github.com/geekuillaume/soundsync/commit/e3546e62322b19ad5e42bd104a0e11110119bc40)]
-  Try fixing windows not supporting symbolic links [[0dc32aa](https://github.com/geekuillaume/soundsync/commit/0dc32aab97c9b4f62f20b7bede89ef44f82f26cc)]
-  Fix package json require for version [[a69d3a0](https://github.com/geekuillaume/soundsync/commit/a69d3a080d4ebedfe4cb0096d1513ace7a1787e1)]
-  Improves wording on webui [[06738cc](https://github.com/geekuillaume/soundsync/commit/06738ccaff63958fe926516d3f2ea507888ec088)]
-  Prevent dragging to try to link source and sinks on webui [[28f4339](https://github.com/geekuillaume/soundsync/commit/28f43392ba2f025d11d45f9200b8587a0d8b0726)]
-  Adds install icon and use package.json for soundsync version [[295a640](https://github.com/geekuillaume/soundsync/commit/295a64091b3cc1592cc1fb33dab0c54b138971f0)]
-  Fix bug with datachannel not closing correctly [[1d6414d](https://github.com/geekuillaume/soundsync/commit/1d6414d85bbf683f4bbc59522fd29c5fec9f5780)]
-  Fix small webaudio clock sync bug [[fa1cd24](https://github.com/geekuillaume/soundsync/commit/fa1cd2477fe5354e0ae0507a42a31ed1d56fc151)]
-  Workaround for chrome webaudio clock bad accuracy [[759119f](https://github.com/geekuillaume/soundsync/commit/759119fcd0b21379bc8353c618f487b105325a6b)]
-  Change deps chmod to prevent error when deleting a file [[30a4c9f](https://github.com/geekuillaume/soundsync/commit/30a4c9f38b75a5df23589d9a95f923912beba84d)]
-  Update librespot for linux [[86b55bc](https://github.com/geekuillaume/soundsync/commit/86b55bcba355d56e1ed9ab8782cdeffa33bca56e)]
-  Fix favicon [[c5354d7](https://github.com/geekuillaume/soundsync/commit/c5354d7e43daf35ce1e016f50f7a1b640a3cdf82)]
-  Adds favicon for webui [[92d587a](https://github.com/geekuillaume/soundsync/commit/92d587a6df118d34b1fe8b5032e5cb1aee91c080)]
-  Update doc to build opus wasm binary [[1441b1f](https://github.com/geekuillaume/soundsync/commit/1441b1f73e1d30905dc38de7157056c747078447)]
-  Disable debug mode when building for soundsync.app webui [[1c042eb](https://github.com/geekuillaume/soundsync/commit/1c042ebe4320284d19328d8b15dd40330a0e4c8f)]
-  Optimize opus [[3453cdf](https://github.com/geekuillaume/soundsync/commit/3453cdf49e9071d9fcf6eb8566a4372c84bce778)]
-  Bumb audioworklet [[2aad93a](https://github.com/geekuillaume/soundsync/commit/2aad93a71da848d76fe54feb8e6da4ae03456b65)]
-  Made some optimization to webpack to improve webui bundle size [[cded49b](https://github.com/geekuillaume/soundsync/commit/cded49ba40bf4dd009c1e8a60b1faf96d7524189)]
-  Changes some wording [[306ac36](https://github.com/geekuillaume/soundsync/commit/306ac36ac64be9cea030d3a6a815f8e9eab01af6)]
-  Webui: fetch rendezvous state every 5s when not connected to a peer [[d4fe4b5](https://github.com/geekuillaume/soundsync/commit/d4fe4b58c0f152c3f066adecc96da75d06acc34e)]
-  Adds download button in AddSink modal [[03a482f](https://github.com/geekuillaume/soundsync/commit/03a482f9061f4ee918fd5cf7daa72e2c4bee4013)]
-  Adapt first use for small screens [[e44a1c3](https://github.com/geekuillaume/soundsync/commit/e44a1c37a40800e31a585cc04693f67701042991)]
-  Adds debug instead of crashing when source emit error [[2744e98](https://github.com/geekuillaume/soundsync/commit/2744e9884ae66360c959db928ec849d2e945ebaf)]
-  Deactivate asar for macos [[ae9eef3](https://github.com/geekuillaume/soundsync/commit/ae9eef39e55685e59dbc582810bc1c7831693cbe)]
-  Prevent name update of localdevice sources from being erased [[88620a4](https://github.com/geekuillaume/soundsync/commit/88620a4cad9fd38b74f026a7c0cb4f11cd225cac)]
-  Color own webpage differently on webui [[059ddc6](https://github.com/geekuillaume/soundsync/commit/059ddc6122b5dd6dd0d625dfaae3d08959bf57fe)]
-  Bump audioworklet dep to prevent deadlock [[cee0f57](https://github.com/geekuillaume/soundsync/commit/cee0f575095e2b8df31e0321d51cd6a19e784be6)]
-  Removes debug logging [[5a20249](https://github.com/geekuillaume/soundsync/commit/5a202491e61c65694041bd00dceffbdec7b1b3fd)]
-  Adds debug route to get external ip as seen by rendezvous service [[9bd74b5](https://github.com/geekuillaume/soundsync/commit/9bd74b5f157029b26eee6dbaddd43c9a732ba2b1)]
-  Fix display bug of pipe when list changes [[2895d08](https://github.com/geekuillaume/soundsync/commit/2895d08c813496ca56c46a8b2bfc1300f28f33c6)]
-  Improves webui ux [[b058157](https://github.com/geekuillaume/soundsync/commit/b05815720a5378b937ac74536745eb06398c1cf7)]
-  Updates shairport dep for macos [[4c74da5](https://github.com/geekuillaume/soundsync/commit/4c74da59c0113ce149c0e9e375633d807d16e873)]
-  Fix librespot and shairport source creation on webui [[5181006](https://github.com/geekuillaume/soundsync/commit/5181006dc989b2b78e0a4e6905962c2b0eb47684)]
-  Adds librespot support for macos and windows [[f556cbb](https://github.com/geekuillaume/soundsync/commit/f556cbb3d095b8ad55b6a2637d1f82958dce3e8f)]
-  Dynamicaly test if source type is supported by platform [[9d3966b](https://github.com/geekuillaume/soundsync/commit/9d3966b37959017f024fb60d9bc1ff0a4e40e64d)]
-  Fix first use message never hiding [[f3bc161](https://github.com/geekuillaume/soundsync/commit/f3bc16137977ee3da13be6f201a6a9d47675ed10)]
-  Updates todo [[cb5d8fd](https://github.com/geekuillaume/soundsync/commit/cb5d8fdb8757c40440561c392239941cc51412ac)]
-  Adds download link to webui not connected page [[040105c](https://github.com/geekuillaume/soundsync/commit/040105cd267bc3b0a207d1c076105a66c4c41863)]
-  Fix readme [[1bc9d65](https://github.com/geekuillaume/soundsync/commit/1bc9d65ed2f00ab3b997e176180be33f39ec9923)]
-  Try another way of synchronizing webaudio [[a3a5c7c](https://github.com/geekuillaume/soundsync/commit/a3a5c7cd4978936a0315d74275fe0a1c47c4c354)]
-  Fix datachannel for Firefox [[1f62498](https://github.com/geekuillaume/soundsync/commit/1f62498bd73b84b086483baeed1001c0ba63105b)]
-  Fix error with write after end [[d8d4e8e](https://github.com/geekuillaume/soundsync/commit/d8d4e8eaecc355de9bd5b6b672b5b6cd6d507310)]
-  Fix error on browser without sharedarraybuffer [[7e7cfd5](https://github.com/geekuillaume/soundsync/commit/7e7cfd586cc89a0f75e2c2bd4434ac79a33557b9)]
-  Adds logging when audioworklet time is skewed [[4a47001](https://github.com/geekuillaume/soundsync/commit/4a47001f2b5785f31d8c1713f78e99105077d431)]
-  Updates readme [[a25102f](https://github.com/geekuillaume/soundsync/commit/a25102f3eb11f321873207aa020157ff94624fe7)]
-  Updates rendezvous service url and prevent error on webui because of https [[b36d8af](https://github.com/geekuillaume/soundsync/commit/b36d8afeed3517fe425b6c4bab62de8e4814a671)]
-  Fix clean script when no files with spaces exist [[8412955](https://github.com/geekuillaume/soundsync/commit/84129555da5bb8f11e78f8bdc0d52d303a80ecf1)]
-  Replace spaces in bin names with underscore [[289c143](https://github.com/geekuillaume/soundsync/commit/289c143462df57e5168ea7c2220785fff5f4925a)]
-  Fix error when deconnecting remote source [[54de7a2](https://github.com/geekuillaume/soundsync/commit/54de7a206439e3fc5b8e4769ba52ef663768703a)]
-  Fix disconnect than reconnect to peer with a piped source crash [[66c586a](https://github.com/geekuillaume/soundsync/commit/66c586adaf0fa6ed6a89b425f8e731436131765e)]
-  Fix incorrect destroy of stream [[43852d9](https://github.com/geekuillaume/soundsync/commit/43852d914ee646dbeee078ffb6dc3e3d0b527a19)]
-  Clean unused code [[f89e13b](https://github.com/geekuillaume/soundsync/commit/f89e13b9052535c2f521854edbc539ab3a456811)]
-  Fix bug with remote peer disconnecting when sending audio chunks [[8cfecf5](https://github.com/geekuillaume/soundsync/commit/8cfecf5eeffc785f891f1c8125642d5ce3a6d0bb)]
-  Fix source communication between peers [[cc833bd](https://github.com/geekuillaume/soundsync/commit/cc833bd9d556b29259196f1d43a2115c8f478656)]
-  Removes verbose debug log [[6aee132](https://github.com/geekuillaume/soundsync/commit/6aee132c342ae2185d20e75fcf26662a8537a271)]
-  Fix memory leak [[738cbb7](https://github.com/geekuillaume/soundsync/commit/738cbb7836e97bd1060d8ac7b81f34f7cc928287)]
-  Migrate to minipass for better speed and simplified events [[f2ea2c1](https://github.com/geekuillaume/soundsync/commit/f2ea2c1a676d21fc6f30816f4481872ba6909470)]
-  Adds localdevice source [[2bb0d15](https://github.com/geekuillaume/soundsync/commit/2bb0d154431f43859a3ff7711f46560c03aef8c9)]
-  Bump audioworklet dep [[cdfe5de](https://github.com/geekuillaume/soundsync/commit/cdfe5defc5dfd41cf22e26306db8559a638d17cd)]
-  Ignore error thrown while treating ICE candidates [[1f1067b](https://github.com/geekuillaume/soundsync/commit/1f1067b284f162279a3cfd2628e53339f11901b9)]
-  Fix rendezvous service flag for webui [[6af0b03](https://github.com/geekuillaume/soundsync/commit/6af0b03156214427afc2391b4032ee8a98a0ba66)]
-  Adds a way to customize connection of webui through localstorage for debug purpose [[e30936e](https://github.com/geekuillaume/soundsync/commit/e30936efe062c76ab122a002bd326fb39dd3ce65)]
-  Relax linting rule [[59cd61c](https://github.com/geekuillaume/soundsync/commit/59cd61cbd819ceaf4e8112494f42036ae931b8c1)]
-  Handle initiator messages sequencially instead of in parallel and detroy peer if webrtc error [[a6638c2](https://github.com/geekuillaume/soundsync/commit/a6638c21e81c2cba690ac4efe009fbd51b9afa96)]
-  Abort initiator when using rendezvous service from a non browser [[a0d3b47](https://github.com/geekuillaume/soundsync/commit/a0d3b476ebf0667df83c5c7a30f87bbf01ece400)]
-  Fix clean script [[f0a9191](https://github.com/geekuillaume/soundsync/commit/f0a919154c3c4f06bd73a5902a8e91564baa3534)]
-  Clean directory for macos [[489ea64](https://github.com/geekuillaume/soundsync/commit/489ea64088d8c9127ae99c1a241d72be09407d10)]
-  Ignore directory for github upload release action [[84372a4](https://github.com/geekuillaume/soundsync/commit/84372a447f2ed2bf412528eda743c454f8341eef)]
-  Adds missing file [[93a0854](https://github.com/geekuillaume/soundsync/commit/93a0854c08fadbeef46a092d2088c58c38f13ff5)]
-  Fix missing node deps for github action [[826fbbf](https://github.com/geekuillaume/soundsync/commit/826fbbfb2f49e7ae77dc3eeb505ada9ad6a5e0fd)]
-  Use custom action to publish release build [[2473e13](https://github.com/geekuillaume/soundsync/commit/2473e1348eddf20f4fad2415e8d9f0bcbb67d71a)]
-  Adds download links to readme [[4a67ca1](https://github.com/geekuillaume/soundsync/commit/4a67ca10e611c0a90587214156082f12250a4962)]
-  Adds more cleaning to build artifacts [[a93c620](https://github.com/geekuillaume/soundsync/commit/a93c6203195d1d35b4dcce156df4c5362824465c)]
-  Reactivate Macos building [[e314356](https://github.com/geekuillaume/soundsync/commit/e314356a4eca59b6161513a6e68a2a9bd63d02b0)]
-  Reduxe skew tolerance [[181dd74](https://github.com/geekuillaume/soundsync/commit/181dd74fb59044c635fd3574c720158c9c3a9c62)]
-  Change skew logging [[8c73d47](https://github.com/geekuillaume/soundsync/commit/8c73d47c56ab1fbdcc1a886939832d262f2528e8)]
-  Change default latency of source [[e76084a](https://github.com/geekuillaume/soundsync/commit/e76084adb5d96a72cc6d24398ce6c1cf60935be2)]
-  Try to fix a sync problem with webaudio [[9031146](https://github.com/geekuillaume/soundsync/commit/9031146711ea3dc30b7fb893af3b16fdfcf9c1eb)]
-  Improves chunkstream code lisibility [[44cc463](https://github.com/geekuillaume/soundsync/commit/44cc46337ee65b65e506d7fed5aa319d123c2d9b)]
-  Fix missing constant [[c3841ef](https://github.com/geekuillaume/soundsync/commit/c3841ef2fc68273f06aaecfcba4455ab89016a74)]
-  Removes a potential race condition [[b52eeec](https://github.com/geekuillaume/soundsync/commit/b52eeecc6fca0bf003a0eb2d7d88fb730133d01a)]
-  Move log method for out-of-order chunk in audiosink [[3a591cf](https://github.com/geekuillaume/soundsync/commit/3a591cf1c1b0d880a3d9ad2a3a38a9c2120ff205)]
-  Small typo fix [[00661dd](https://github.com/geekuillaume/soundsync/commit/00661dd4fe3f4b606f8d75e144a68874bd8b4fec)]
-  Improves timedelta log [[fe6009f](https://github.com/geekuillaume/soundsync/commit/fe6009fdcd0395acff0c6efff7c0b83c05993ca8)]
-  Improves peer list view on webui [[8fd3cd5](https://github.com/geekuillaume/soundsync/commit/8fd3cd5df9df45dd31c76b9bc1980abd81989ba2)]
-  Prevent duplicated &quot;connected&quot; logs messages [[8515ec2](https://github.com/geekuillaume/soundsync/commit/8515ec22aee50a2a955471911160ae172f2f4657)]
-  Reenable rendezvous service for webui [[72c26c3](https://github.com/geekuillaume/soundsync/commit/72c26c3142eef0ef13ce2f1bc08b7a9348bb6585)]
-  Refactored peer management to reduce edge cases bugs [[a975866](https://github.com/geekuillaume/soundsync/commit/a9758669b767001ce3ded324362bde211c7ed054)]
-  Build debug version of webui [[ee9287b](https://github.com/geekuillaume/soundsync/commit/ee9287b42449c6f4d478920772cdb5e7b14a1e00)]
-  Reactivate rendezvous service on webui [[03f09fb](https://github.com/geekuillaume/soundsync/commit/03f09fb08ea5907566ba5a9e161cbb12ba724677)]
-  Manage initiator destroying [[f50ca34](https://github.com/geekuillaume/soundsync/commit/f50ca34f904fd0c871d73602ba3729a1e62a8487)]
-  Do not send initiatormessages if deleted peer [[e5dde22](https://github.com/geekuillaume/soundsync/commit/e5dde227f934fa3880d4645b8e3dc85bb7f1304e)]
-  Handle sending error message by rendezvous service [[34ad763](https://github.com/geekuillaume/soundsync/commit/34ad76321f9e2c0d997c4b5a4d40897c32f4949c)]
-  Fix bug with reversing of rendezvous messages [[89b32a0](https://github.com/geekuillaume/soundsync/commit/89b32a080ca71235159e11513b0964d1e0087fbb)]
-  Better handle localhost address for rendezvous testing [[a9929a2](https://github.com/geekuillaume/soundsync/commit/a9929a2d5a7f251794216eaf390fa3bff16389f4)]
-  Relax eslint [[1dc85dc](https://github.com/geekuillaume/soundsync/commit/1dc85dcf2e46664ede8cc1e6aa12c84b53a5be34)]
-  Fixed error with rendezvous message notify [[310ddf1](https://github.com/geekuillaume/soundsync/commit/310ddf104366dec7f8c15cd28d2cce38d3ef7436)]
-  Refactored connection initialization between all peers [[ff6d052](https://github.com/geekuillaume/soundsync/commit/ff6d052a78e80fa3207ef3780a925fa3a35d7491)]
-  Activate proxy mode for koa [[16e463c](https://github.com/geekuillaume/soundsync/commit/16e463c932436e5398d20575e33d9a6e20881b4a)]
-  Fix cors for rendezvous service [[213eb33](https://github.com/geekuillaume/soundsync/commit/213eb338cc6a3f4c8d7a4cf63a7aa9709fb468e9)]
-  Only connect to local peer from webui if not accessing page from rendezvous service [[49703d6](https://github.com/geekuillaume/soundsync/commit/49703d63288c05a88c23a9535ee86b2905fdb73e)]
-  Ignore port for CORS [[b5b3f80](https://github.com/geekuillaume/soundsync/commit/b5b3f80830932985a7178aec54f4a5d04850301f)]
-  Adds detection of audio device clock skew [[046078c](https://github.com/geekuillaume/soundsync/commit/046078ce183204a341bb8a0f0acc307dfc6d26a2)]
-  Log timesync changes and increase timekeep requests frequency [[b346c6f](https://github.com/geekuillaume/soundsync/commit/b346c6f1d66e460d73cd9be470b136d04266636c)]
-  Add log when source stream is interrupted [[bc7d523](https://github.com/geekuillaume/soundsync/commit/bc7d5238700caaa625fe977dbf9e9318b7f5bb36)]
-  Increase reliability of webrtc audio channel [[5bb3d1e](https://github.com/geekuillaume/soundsync/commit/5bb3d1e510ba8ebc9a99a3d08551d47a090d4465)]
-  Adds volume to webaudio sink [[c2a6f06](https://github.com/geekuillaume/soundsync/commit/c2a6f06b5323794239bd4c6f41b10ea74aeb82c9)]
-  Do not failfast for github actions [[99963f9](https://github.com/geekuillaume/soundsync/commit/99963f93dfc1fa61555266acf57b91731938754e)]
-  Fix bug with http api join and adds logs [[8ef80a0](https://github.com/geekuillaume/soundsync/commit/8ef80a087ff537535c524166340727935a4c61d8)]
-  Fix logging for rendezvous service [[3c5ff4e](https://github.com/geekuillaume/soundsync/commit/3c5ff4e24e6e6b726c0f23be2c8fc366b03ea344)]
-  Remove expose for rendezvous service dockerfile [[d1735dc](https://github.com/geekuillaume/soundsync/commit/d1735dc784ba617def8f5371d57d01086be8dda2)]
-  Adds app to gitignore for rendezvous service [[2d25bd8](https://github.com/geekuillaume/soundsync/commit/2d25bd8b0c7b501d0466de69f9cfbd711f54026b)]
-  Prevent yarn.lock from being ignored [[4c3215d](https://github.com/geekuillaume/soundsync/commit/4c3215d51537ea28e1516768c6d04c1fc5374f7d)]
-  Set real rendezvous service url [[39db0f8](https://github.com/geekuillaume/soundsync/commit/39db0f8940b0491a2b4c1d5dd5d206e8892e8a61)]
-  Trust invalid ssl certificates for localhost rendezvous service [[b889169](https://github.com/geekuillaume/soundsync/commit/b88916903df0814878852560e8eb7b9251def524)]
-  Adds https local dev mode and support REDIS_URL env variable [[d409bfe](https://github.com/geekuillaume/soundsync/commit/d409bfee1b7b1e5877da96bde90f6e01bb995988)]
-  Adds dockerfile for rendez-vous service [[180d711](https://github.com/geekuillaume/soundsync/commit/180d711439a078b8bc09c14a5890083346f54d84)]
-  Implements rendezvous connect for webui [[691d648](https://github.com/geekuillaume/soundsync/commit/691d648e45877666d55d161da5dcea7827410dbf)]
-  Tweaks for local dev of webui with rendezvous service [[0e6cf9b](https://github.com/geekuillaume/soundsync/commit/0e6cf9b5a8135bb3d7247f10e4900ccfbde30d11)]
-  Webui now uses rendezvous service for peer detection [[bb51e42](https://github.com/geekuillaume/soundsync/commit/bb51e42e63016bf4243599c85b63df6dd0db372c)]
-  Adds logging [[303d193](https://github.com/geekuillaume/soundsync/commit/303d193b18b7ab74c0dbbe4026c8b613b9d92c1e)]
-  Fix bug when connecting to itself [[59b3fbd](https://github.com/geekuillaume/soundsync/commit/59b3fbd19eb49ffecba2326641d63f6dbe1e5571)]
-  Integrate with rendezvous service [[c9a1f62](https://github.com/geekuillaume/soundsync/commit/c9a1f6289777326c945a4813ac95fe5f90979634)]
-  Starts rendez-vous service [[741efc7](https://github.com/geekuillaume/soundsync/commit/741efc79fc8fd85cd74daea84d075ba0c77b228c)]
-  Tweak eslint configuration [[c053131](https://github.com/geekuillaume/soundsync/commit/c053131ee1ddb55a0487468dc15fd2ddd76b185c)]
-  Do not save config when value is default [[9785716](https://github.com/geekuillaume/soundsync/commit/9785716cd4a5190d25253e1444ce7578fbe360b8)]
-  Upload release bleeding-edge on each workflow instead of centralized [[4ae2ead](https://github.com/geekuillaume/soundsync/commit/4ae2eada045b3f7ab8386a5d98b53097e01ccda8)]
-  Upload artifacts to bleeding-edge release 2 [[c387f9f](https://github.com/geekuillaume/soundsync/commit/c387f9f1ff7b494915da7b17821a32e24c697c1b)]
-  Upload artifacts to bleeding-edge release [[6056691](https://github.com/geekuillaume/soundsync/commit/6056691b0fd69d42c62912f771a372663ee33648)]
-  Adds airplay support [[63e41f4](https://github.com/geekuillaume/soundsync/commit/63e41f4ac9c7b8bf00317cdb485e4655b55e4dbc)]
-  Updates to new version of audioworklet [[1dd6b50](https://github.com/geekuillaume/soundsync/commit/1dd6b50189cf79f6f6f8d18b5acf30a27e7572e5)]
-  Removes unused default [[161edb5](https://github.com/geekuillaume/soundsync/commit/161edb593c437e43ffe455c4ae84ae96361b5317)]
-  Optimize chunk stream to wait for source to be readable again before trying to consume it [[38bea67](https://github.com/geekuillaume/soundsync/commit/38bea67aaa53aae1065c75f2d268fb3020a38fb4)]
-  Improves wrtc reconnection logic to prevent bug when disconnection/reconnecting [[e919482](https://github.com/geekuillaume/soundsync/commit/e919482f9a0b010dd6a7a40d0d63e3e966742fa7)]
-  Fixed AudioChunkStream when source stream was interrupted then restarted [[123d37f](https://github.com/geekuillaume/soundsync/commit/123d37ff6d228871f352a9f8aa20960ca65e224c)]
-  Increase time allowed to retry sending audio chunks to prevent choppy audio on low quality network [[5bc0aad](https://github.com/geekuillaume/soundsync/commit/5bc0aad11accc9ce75332e60b90dd8c55519a1d3)]
-  Add info about how to enable soundsync service on raspberrypi [[a3fe6ea](https://github.com/geekuillaume/soundsync/commit/a3fe6ea667851fe6befbd55a8025473eef0a343f)]
-  Do not overwrite info of localdevice sink on restart [[da03f19](https://github.com/geekuillaume/soundsync/commit/da03f197b5f8aab03efaba64db0f90cff7a5855d)]
-  Removes debug logging [[0202f0d](https://github.com/geekuillaume/soundsync/commit/0202f0dc1920f3d3cb6c39254d9f568583c62a04)]
-  Fix default value for webaudio sink [[ac29562](https://github.com/geekuillaume/soundsync/commit/ac29562ed855ce46c17f8cba06c838017e1a36f5)]
-  Fix disconnect of webaudio sink when sink errored on connection [[8f21939](https://github.com/geekuillaume/soundsync/commit/8f2193960a7379c78e97a1d6a6d54614dd652361)]
-  Do not add ghost peer [[d7d7243](https://github.com/geekuillaume/soundsync/commit/d7d724388a86f24d6898edc85153433e43c04967)]
-  Updates TODO [[6e8e917](https://github.com/geekuillaume/soundsync/commit/6e8e917a46aa7a76969b37f2b432e3b7af168363)]
-  Adds volume change from Webui [[cb8d2a8](https://github.com/geekuillaume/soundsync/commit/cb8d2a8f77cb946a3fef0a49d4d9cf7a51b89787)]
-  Remade the add source process for the webui [[14753a4](https://github.com/geekuillaume/soundsync/commit/14753a419753807641a12893897af6b73d28eddc)]
-  Fix peer reconnection after connection lost [[9121895](https://github.com/geekuillaume/soundsync/commit/9121895db2f798ebe5dc759d34b32c428490866b)]
-  Clean some unused code [[c7fee2b](https://github.com/geekuillaume/soundsync/commit/c7fee2b951a364ed64d548a956db66e88f6ad1fa)]
-  Updates TODO in README [[9726c94](https://github.com/geekuillaume/soundsync/commit/9726c946422397eeb4cf1c106dbbea3e5996c326)]
-  Fix script to start pulseaudio [[7d1dd12](https://github.com/geekuillaume/soundsync/commit/7d1dd12d525718fda6c612b0a338aa08f7a63548)]
-  Start pulseaudio when running as system service [[d5b8cf0](https://github.com/geekuillaume/soundsync/commit/d5b8cf030d1dcfe09a741b86bbb0a1b6e1b5433b)]
-  Adds availability to sink to hide previously seen but now disconnected sinks [[2ec3d27](https://github.com/geekuillaume/soundsync/commit/2ec3d277164263a5666434a2db32876ed91af91b)]
-  Updates speex-resampler version [[748567b](https://github.com/geekuillaume/soundsync/commit/748567bd708debcb44318a2543aee7a1a2705ddd)]
-  Workaround for https://github.com/electron-userland/electron-builder/issues/3179 [[a23fbb0](https://github.com/geekuillaume/soundsync/commit/a23fbb01bdb692e2ef4c327baecb64aaf3500ffb)]
-  Bump electron-builder [[2f0891b](https://github.com/geekuillaume/soundsync/commit/2f0891baeeb0ac0a58d5571ce62491ef445a899b)]
-  Use updateInfo to set latency on webaudio instead of setting it directly [[c0322f8](https://github.com/geekuillaume/soundsync/commit/c0322f8b5fbd126f11347e082f3a8f345b7b0da8)]
-  Fix latency calculation for sink [[6c849bc](https://github.com/geekuillaume/soundsync/commit/6c849bc562caac561cd5b3ab4d5c92aefb6da7a2)]
-  Fix reconnection to sink of disconnected peer [[21e00c3](https://github.com/geekuillaume/soundsync/commit/21e00c3752feaeab6a04f608e68587c33c6abd09)]
-  Show loading message when not connected to a peer and hide sources/sinks without a connected peer [[aacdbe2](https://github.com/geekuillaume/soundsync/commit/aacdbe2442915bcc1d8279cc2b209e87a7254a37)]
-  Improves peer events for state changed [[ab927fc](https://github.com/geekuillaume/soundsync/commit/ab927fc1598818f0e6f5994f9f64d5ed1f87d315)]
-  Empty buffer when sample are not needed to prevent hearing old samples [[1bbaf96](https://github.com/geekuillaume/soundsync/commit/1bbaf96538840f3c9faf65658ee04c5d3ff59f1e)]
-  Fix missing chunk bug because of imprecise timing [[88c57bd](https://github.com/geekuillaume/soundsync/commit/88c57bdeed23c51dbf7963a600adb4b9f2c69b04)]
-  Added logging when receiving out-of-order chunk [[57219e6](https://github.com/geekuillaume/soundsync/commit/57219e6cbb26b3e3569e86a1f091fcbc562308ba)]
-  Simplify sync script for dev on distant host [[3d18efd](https://github.com/geekuillaume/soundsync/commit/3d18efdaddec3d1433ec52f661337d0b46eedd52)]
-  Use SharedArrayBuffer for communication between audio thread and main thread [[1f8533a](https://github.com/geekuillaume/soundsync/commit/1f8533a513f55548410fb78f89590e5388f9b651)]
-  Clean old unused handling of audio buffer [[a32dc26](https://github.com/geekuillaume/soundsync/commit/a32dc2636af2d7366c4fe044d7fdb1a5ded11c3c)]
-  Adds logging on disconnect [[67c0734](https://github.com/geekuillaume/soundsync/commit/67c07346c4dc4fb73e4cf654340d2b0af8fb67f2)]
-  Adds a condition to prevent handling chunk of unknown source [[5a63947](https://github.com/geekuillaume/soundsync/commit/5a63947d8fbe8ca0e8a7ccafe2d8fe1c445c6c10)]
-  Optimize currentSampleIndex synchronization [[507ad5a](https://github.com/geekuillaume/soundsync/commit/507ad5a9d5cf1106b4971a4fd23d21af9c57cefb)]
-  Fix delete source not persisting after restart [[e8cda45](https://github.com/geekuillaume/soundsync/commit/e8cda45091609bc846e6e635fd473b4b2e016985)]
-  Fix asar disabling [[7f3490c](https://github.com/geekuillaume/soundsync/commit/7f3490c658bae1fa35c546515bc4602aea0691dc)]
-  Disable asar because of audioworklet not being detected [[ed80248](https://github.com/geekuillaume/soundsync/commit/ed80248347fd9d42e3c1c690d496666f4db6ca8c)]
-  Fix bsdtar not found github actions again 2 [[22b0bf9](https://github.com/geekuillaume/soundsync/commit/22b0bf9eb6e913ba0fdb1ea490e5f18b7f246d5a)]
-  Fix bsdtar not found github actions again [[b25db21](https://github.com/geekuillaume/soundsync/commit/b25db21fac70dd3e59e5de8baacec98e4cb102b3)]
-  Fix bsdtar not found n github actions [[c156144](https://github.com/geekuillaume/soundsync/commit/c156144d4e3e0bc71b1cc08454e31f2aca6eed1d)]
-  Use new version of audioworklet to use dynamic buffer size in process function [[b978aa2](https://github.com/geekuillaume/soundsync/commit/b978aa23bf86ae49c15c78aa9fd0a94049b65092)]
-  Fix clean script call from github actions [[10a8c6d](https://github.com/geekuillaume/soundsync/commit/10a8c6da9248bef6290025f165b2fb5146101077)]
-  Unpack audioworklet files when needed [[c555ed0](https://github.com/geekuillaume/soundsync/commit/c555ed0973c7e0c0b5007a78e626440cc6fbfa3e)]
-  Clean output artifact when building for arm on github action [[9b3118a](https://github.com/geekuillaume/soundsync/commit/9b3118ae3ed0248e235cbb528f6939241a362a3f)]
-  Fix a bug with wrtc connection [[8b4201d](https://github.com/geekuillaume/soundsync/commit/8b4201d26e5bd8421daebe6f72b00325eba20f51)]
-  Improves webrtc connection handling [[935b88d](https://github.com/geekuillaume/soundsync/commit/935b88dba5aeb2e41b43d8ea40b41f6b6cf26771)]
-  Fix wrtc connection in special cases [[b8439fa](https://github.com/geekuillaume/soundsync/commit/b8439fada66e84a2215e99fe44aa59214a341f43)]
-  Keep previous configuration of webaudio sink if exist [[975cb81](https://github.com/geekuillaume/soundsync/commit/975cb8113cf52a2ed399b843b53618ecaa57560a)]
-  Add Google stun server for WRTC [[3cbc6d8](https://github.com/geekuillaume/soundsync/commit/3cbc6d8b7b5bccf1fbcf5d141237837139ec1ac2)]
-  Update audioworklet [[97962d2](https://github.com/geekuillaume/soundsync/commit/97962d2e5da74c25e0dd3a0a18a74dfd0d97de83)]
-  Add test script in gitignore [[2078ad2](https://github.com/geekuillaume/soundsync/commit/2078ad20de429415d5ec0095b8ae7bb797869ac3)]
-  Add script to sync with remote with rsync [[fe5e91b](https://github.com/geekuillaume/soundsync/commit/fe5e91b90491b50b35c3c9c5ff6ce34770b9f83a)]
-  Adds some tips for develpment on rpi and windows [[c57fe32](https://github.com/geekuillaume/soundsync/commit/c57fe320792a9286f5e2dab804b5b87dcf713b81)]
-  Deploy arm package on tag with github actions [[e436e5a](https://github.com/geekuillaume/soundsync/commit/e436e5ab65d12476c6aa772208473fb27b1c5c36)]
-  Adds deploy with np [[c0d7b39](https://github.com/geekuillaume/soundsync/commit/c0d7b398a2452bafbc679163ec6a113f24e0e10e)]
-  Add option to enable/disable localnetwork scanning [[72b522b](https://github.com/geekuillaume/soundsync/commit/72b522bf5365894387248c15d9d56c45255d0e8e)]
-  Fix raspberry pi compilation script [[e10455d](https://github.com/geekuillaume/soundsync/commit/e10455d17e765ea4610208da6e0d72fdc0adeecc)]
-  Updates electron-builder [[d59f0ee](https://github.com/geekuillaume/soundsync/commit/d59f0ee66b24ff087e00e1029f2a1788be350cee)]
-  removes &quot;electron-builder install-app-deps&quot; from postinstall because it doesnt use napi for native extensions [[58b9951](https://github.com/geekuillaume/soundsync/commit/58b99512291913ccfee9a094ce0824cf37a4e081)]
-  Fix arm compilation script when running on Github actions [[0c59d26](https://github.com/geekuillaume/soundsync/commit/0c59d26551b90c6910ceb4430dec6cb14cdc3f92)]
-  Add some details to the README [[715dbb6](https://github.com/geekuillaume/soundsync/commit/715dbb6d94e978e9643e274e34f90e29a40ccb07)]
-  Migrated to soundio instead of rtaudio, improves time accuracy [[1adfe98](https://github.com/geekuillaume/soundsync/commit/1adfe98329c76140bde2e15a15fd2ce2f81c0ed8)]
-  Fix compile for rpi script and dockerfile [[dab90e4](https://github.com/geekuillaume/soundsync/commit/dab90e4eaf95d7446c2858e608886e526dcd7b2e)]
-  Fix build [[848baec](https://github.com/geekuillaume/soundsync/commit/848baec243ff97e3da09a433bc1d85f1fc307c25)]
-  Reactivate rpi crosscompilation [[75743b6](https://github.com/geekuillaume/soundsync/commit/75743b68fb465d916d4fcaba9ba5de893cdb6d91)]
-  Remove alsa lib installation on build [[1f0cfbf](https://github.com/geekuillaume/soundsync/commit/1f0cfbf07825279da0a67205f977aac3c47a0edc)]
-  Switch emscripten types to root package [[4858e73](https://github.com/geekuillaume/soundsync/commit/4858e73468c22b6de140b95457c45ea6e46ab570)]
-  Switch to using opus encoder/decoder on wasm instead of audify [[0ac64b2](https://github.com/geekuillaume/soundsync/commit/0ac64b2bc59c54391cfee8b7f1b85b12b7c813fa)]
-  again bump audioworklet version [[f6b6aaa](https://github.com/geekuillaume/soundsync/commit/f6b6aaa460aa18f42a80c6943103e87566aee237)]
-  Merge branch &#x27;master&#x27; of github.com:geekuillaume/soundsync [[20a92d9](https://github.com/geekuillaume/soundsync/commit/20a92d984f25ed06c13f3556305e5c8b950fadaf)]
-  bump audioworklet version [[145da45](https://github.com/geekuillaume/soundsync/commit/145da454ee3b08b3449e5d47228347c1631a0135)]
-  Merge pull request [#1](https://github.com/geekuillaume/soundsync/issues/1) from Neamar/patch-1 [[e3ceb47](https://github.com/geekuillaume/soundsync/commit/e3ceb47f69be30833e10c7dcc65707d499fa2125)]
-  README typo-fixing [[c827f4d](https://github.com/geekuillaume/soundsync/commit/c827f4ddfe353971f11db46bf55d40f41405461f)]
-  Clean latency code for webaudio and rtaudio [[b985e53](https://github.com/geekuillaume/soundsync/commit/b985e530abff8cafe6340917aabd8930da2c9d6f)]
-  Use audioworklet to output audio in separate thread [[8ae3461](https://github.com/geekuillaume/soundsync/commit/8ae346181e326618f3a9904affba8e6fe2d5392e)]
-  Simplify webaudio time sync [[e08d2a9](https://github.com/geekuillaume/soundsync/commit/e08d2a967df8063ace77f8f3d45ccda52681efa4)]
-  Fix bug in peer time sync [[00c1c53](https://github.com/geekuillaume/soundsync/commit/00c1c536bc79a8cd89792e18df5d932ccc39a01b)]
-  Use audify callback function to emit samples [[5117294](https://github.com/geekuillaume/soundsync/commit/5117294562e712c6f4a282a51eab45778d0aa32a)]
-  Fix audio sync before emiting chunk for rtaudio sink [[d2bc0b6](https://github.com/geekuillaume/soundsync/commit/d2bc0b62185cf05543e461d16d54eaafd6574d33)]
-  Fix a bug in webaudio sink and added initial timesync with peers [[812b69b](https://github.com/geekuillaume/soundsync/commit/812b69bb2863169eedfd8088b259d2d72055d756)]
-  Fix time ref for webaudio sink [[5bdc3f2](https://github.com/geekuillaume/soundsync/commit/5bdc3f2895739867b29e062a17679be00bf0d0f2)]
-  Fix opus wasm export for webpack [[28f888b](https://github.com/geekuillaume/soundsync/commit/28f888b4566faddce06aba0ca9c866ec70764ce6)]
-  Fix web polyfill for buffer object [[f534be7](https://github.com/geekuillaume/soundsync/commit/f534be701d4273568bb4655294fe5cc6b894f41d)]
-  Adds debug button on webui for audiostreams [[b99e5cc](https://github.com/geekuillaume/soundsync/commit/b99e5cc79fcdbe7bc6cd856fba92c88b309ca1e9)]
-  Use the null source with a test pcm file if one exists [[5e84692](https://github.com/geekuillaume/soundsync/commit/5e846929d945b86ea475ded25482152c06d4dfbc)]
-  Adds forceIfSamePeerUuid to support webui reload [[f241dd1](https://github.com/geekuillaume/soundsync/commit/f241dd100e9615f5ecb6786d8cce8e90d3cbd2d5)]


<a name="0.1.0"></a>
## 0.1.0 (2020-03-13)

### Miscellaneous

-  Fix bug with time synchronization when sink and source are on different peers [[f5622ae](https://github.com/geekuillaume/soundsync/commit/f5622ae611e19e5517b4fa15586e109085d5a52f)]
-  Fix bug with sink not rebinding to previous source after restart [[e434d7e](https://github.com/geekuillaume/soundsync/commit/e434d7e5a6df2db96f2b1a8c5b5932159131837e)]
-  Don&#x27;t log soundstate message in console [[df7321c](https://github.com/geekuillaume/soundsync/commit/df7321ccf107cb6ba29b01efbceda366acbd8c1b)]
-  Adds back open controller in systray menu [[e1a577b](https://github.com/geekuillaume/soundsync/commit/e1a577b6edb4616fd690e1fdb54c9f7178f30e4b)]
-  Adds github release push when building [[9d2ecf9](https://github.com/geekuillaume/soundsync/commit/9d2ecf9265fcbd27c743e9dc3f582b7885c0b70c)]
-  Fix url for coordinator in webui [[bcd7c3a](https://github.com/geekuillaume/soundsync/commit/bcd7c3a776ba602d29b0a7ac9ca3021e345b2a17)]
-  Reactivate windows build [[5855285](https://github.com/geekuillaume/soundsync/commit/58552850c5066740abd585aa0027b62da36a49bd)]
-  Separate webui build and electron build on github [[794057e](https://github.com/geekuillaume/soundsync/commit/794057e5e6a6a0fe34e9d44695ebb14307de6029)]
-  Switch to webpack to build webui [[c8a526e](https://github.com/geekuillaume/soundsync/commit/c8a526eaa828a752708723ba022df934be0acd40)]
-  Change uuid import method to fix parcel resolver bug [[1c4133d](https://github.com/geekuillaume/soundsync/commit/1c4133d6226c7a9f9b4bd3478c954c22b8b6608f)]
-  Fix deps for webui build [[fd24b3a](https://github.com/geekuillaume/soundsync/commit/fd24b3a3f29664cc40a3260fcdec51db1bdc0df1)]
-  Removes symbolic link for webui and use relative path to make it work on windows [[f31bfb3](https://github.com/geekuillaume/soundsync/commit/f31bfb36bd783b0e7ffcf49155a5f375435c1b83)]
-  Fix webui deps install on windows for github actions [[2c72951](https://github.com/geekuillaume/soundsync/commit/2c729515aacf684e0bb3861dfa9cd05e37fb44c5)]
-  Reactivates windows build [[54227fb](https://github.com/geekuillaume/soundsync/commit/54227fbf653a42de966f7b0fa3d2bc7e0ad2171c)]
-  Reenables webui serving [[271d26b](https://github.com/geekuillaume/soundsync/commit/271d26b7a4ba0c188a4100ad6168761a2f2d8828)]
-  Fix error with bonjour host field [[0290dca](https://github.com/geekuillaume/soundsync/commit/0290dca2a91726864882ef1fae4ad03d3b04ad56)]
-  Updates github workflow to upload correct artifact [[ba088ea](https://github.com/geekuillaume/soundsync/commit/ba088eadc4999113d13a27d6f5a7e83a453d87c0)]
-  Fix package.json for webui and removes old deps [[3aa13c5](https://github.com/geekuillaume/soundsync/commit/3aa13c5a7b05dfff1573cce1064a61ebeb9ccc84)]
-  Adds mock for wrtc module in webui [[d3871d7](https://github.com/geekuillaume/soundsync/commit/d3871d76e7953b0012af67900cca8d7cdb5b5d87)]
-  Github workflow fix [[08ad99a](https://github.com/geekuillaume/soundsync/commit/08ad99a417a3136bef1136f7e9d072e905d7e2ca)]
-  Set version to 0.1.0 [[3aac268](https://github.com/geekuillaume/soundsync/commit/3aac2687b10bd0ac8e64c8758fbf880f471c6b53)]
-  Adds webui build in github workflow [[4b6f3ab](https://github.com/geekuillaume/soundsync/commit/4b6f3ab9cbe52664c4541dfb4baf9c6025a09c17)]
-  Updates README [[1937ff6](https://github.com/geekuillaume/soundsync/commit/1937ff6b606cbb108e04445238517d4cb5f761b8)]
-  Adds librespot source deletion from webui [[8888462](https://github.com/geekuillaume/soundsync/commit/88884624cccebd0869fd0994e1044b49d8615bb6)]
-  don&#x27;t lint node_modules folder [[bb5eca1](https://github.com/geekuillaume/soundsync/commit/bb5eca1346269f865a8d8a42ed0376e5f14ce6d6)]
-  Don&#x27;t save unnecessary fields in config file [[1088301](https://github.com/geekuillaume/soundsync/commit/10883015bcdd1c5104e987638ed7df6a3aaeb416)]
-  Allow adding librespot source from webui [[d9657de](https://github.com/geekuillaume/soundsync/commit/d9657deb325a62543453b75b8a82427978e3b69a)]
-  Updates README [[c930f29](https://github.com/geekuillaume/soundsync/commit/c930f292f5dac373d4a92dab412928d94a8fccd7)]
-  Fix edge case when starting more than 2 instances at the same tim,e [[d6f1eeb](https://github.com/geekuillaume/soundsync/commit/d6f1eeb01bcb3a36c66ec931058a72211ef6d533)]
-  Use bonjour for p2p peers discovery [[f3b1024](https://github.com/geekuillaume/soundsync/commit/f3b1024195a4912f32066405daa0948a02eb76ff)]
-  Clean http connect method for peer and prevent a peer from being duplicated [[7dc592e](https://github.com/geekuillaume/soundsync/commit/7dc592eb8b5f65c442f3521df449bac7c36fec4b)]
-  Limit precision of startedAt for source [[143b574](https://github.com/geekuillaume/soundsync/commit/143b574e50c4f39788f6f01427f47598ea9e188c)]
-  Adds sourcemap support for stacktrace [[40cc73f](https://github.com/geekuillaume/soundsync/commit/40cc73f30329bd3f271911a61eff8238d299ca86)]
-  Fix message sending loop [[8a19402](https://github.com/geekuillaume/soundsync/commit/8a19402406651af4b111b154e8774dd2a354792f)]
-  Peer send its name to other peer on connection [[1aff1bf](https://github.com/geekuillaume/soundsync/commit/1aff1bf87a9efc8774a4cd4c49cd3cdb9dccab39)]
-  Reimplements time synchronization with p2p approach [[4ed51a9](https://github.com/geekuillaume/soundsync/commit/4ed51a96eadba8723579a067e2188f7a325c54fa)]
-  Clean messages and separate patch from audio state type [[6f2acd2](https://github.com/geekuillaume/soundsync/commit/6f2acd2fee2b7a152e7f38fd87603ea78a12031e)]
-  Integrated webui with p2p mode [[02b5ff3](https://github.com/geekuillaume/soundsync/commit/02b5ff35a61803a35ee8c858d845503582b28e10)]
-  Implement p2p connection establishing [[2a50810](https://github.com/geekuillaume/soundsync/commit/2a50810072c4a6f740cfa0f8ce7ca2fc9c698339)]
-  Reimplemented pipe on webui [[2c2df98](https://github.com/geekuillaume/soundsync/commit/2c2df98f8cb1662c0a4bfeb9b8a45904cd7e1221)]
-  Pipe is now a param on sink, webui uses webrtc to update audio instances [[026c7a1](https://github.com/geekuillaume/soundsync/commit/026c7a1c0d5ad56218098c8b0acb2bdece091775)]
-  Dont use the http api for the webui but the webrtc communication directly [[df2ceca](https://github.com/geekuillaume/soundsync/commit/df2cecac2504e12e8816d7eb05fb7d7674ce91ab)]
-  Merge branch &#x27;master&#x27; into coordinatorless [[9449785](https://github.com/geekuillaume/soundsync/commit/944978531603a075222e7ea0cfb6ebb4afa23c67)]
-  Adds crosscompile action [[da1bdd6](https://github.com/geekuillaume/soundsync/commit/da1bdd617275c2f6a14be20d8f62accfbdaba3a2)]
-  Download librespot for current arch when needed [[ba8172c](https://github.com/geekuillaume/soundsync/commit/ba8172c6c4fc6e0bc7acd04a80e7bcd406cab1de)]
-  Rollback fpm to fix bug [[f41495d](https://github.com/geekuillaume/soundsync/commit/f41495d8558d246d58452002264a90f2cbca4dab)]
-  Exit with error if headless and no coordinator choice made [[849a38b](https://github.com/geekuillaume/soundsync/commit/849a38bcda7b1891c2b4c1573292b327a7b8d04a)]
-  Fix service install script for deb package [[b51e779](https://github.com/geekuillaume/soundsync/commit/b51e779dc44cad1ed759f768880790f26361c179)]
-  Fix startup script to pass args to real process [[5ff430a](https://github.com/geekuillaume/soundsync/commit/5ff430a438e37f43bcfe463962274aea22536d29)]
-  Disable build for mac and windows [[e00683c](https://github.com/geekuillaume/soundsync/commit/e00683ceb92dafac311f26e3bcff4309cb9b4e71)]
-  Fix stream start timing [[c09f64c](https://github.com/geekuillaume/soundsync/commit/c09f64c40777000f147b8f17f009e7bc0a87eb62)]
-  Fix time origin for chunk stream [[330878d](https://github.com/geekuillaume/soundsync/commit/330878d639d38a5465946fbeb9af1953e6218733)]
-  Fix rpi crosscompilation script [[f5c4a84](https://github.com/geekuillaume/soundsync/commit/f5c4a84073de4f147056976044e1587bc3f2e9b1)]
-  Fix windows packaging bug and fix linux target to deb [[23c6642](https://github.com/geekuillaume/soundsync/commit/23c66422af82790d948e7f52d475c60eb0ad37f9)]
-  Webaudio: empty buffer when chunk is read [[b742b9f](https://github.com/geekuillaume/soundsync/commit/b742b9fc964f6635cd4d21692d676cc6fc3da966)]
-  Start working on a coordinator less option [[2f434b6](https://github.com/geekuillaume/soundsync/commit/2f434b6b22e508cdd22bea789635fa4190097bf4)]
-  Fallback to alsa when pulseaudio is diconnected [[070e5e2](https://github.com/geekuillaume/soundsync/commit/070e5e2cfa453ff4ecf2bcfad0c05c0a34a84545)]
-  Dont recreate typedarray in web opus decoder [[5011738](https://github.com/geekuillaume/soundsync/commit/50117382282a2dd64e6887398f0eb1c5ba0a4490)]
-  Adds support for headless in built package [[fa0d46e](https://github.com/geekuillaume/soundsync/commit/fa0d46e3ee20796a553a6d3b47afa3188bc08e68)]
-  Fix bug with webaudio not starting [[2f0ad28](https://github.com/geekuillaume/soundsync/commit/2f0ad286a9b3c8d685ec766b3ea62bc617d434a1)]
-  Fix librespot source by deactivating debug chunks [[5b360ae](https://github.com/geekuillaume/soundsync/commit/5b360aea7713206db9b79fecf072652b26af4aa2)]
-  Normalize end of audio stream across the code [[21d82eb](https://github.com/geekuillaume/soundsync/commit/21d82eb0d41aa52adb606f89e66f5567d72a015d)]
-  Hide librespot output by default [[530f53c](https://github.com/geekuillaume/soundsync/commit/530f53cfcc87d69b2aabb678b6ecf523c5ca65ed)]
-  Fix AudioChunkStream handling of incomplete chunks [[d2a43ae](https://github.com/geekuillaume/soundsync/commit/d2a43aef21b9af67b003497b913e8d56f2d3d4cc)]
-  Change how the audio source handle consumers [[8d1978b](https://github.com/geekuillaume/soundsync/commit/8d1978bac31aaf31a6b213ed13a4d85d4f749fdb)]
-  Overwite previous pipe when piping active sink to source [[4bc31bc](https://github.com/geekuillaume/soundsync/commit/4bc31bc3c8cdace550ac04eb2f8d216ca97b54d3)]
-  Bump speex-resampler [[685df12](https://github.com/geekuillaume/soundsync/commit/685df12c379d3cd3b9d23f6080d5e556d58ce92f)]
-  Adds --launchAtStartup command line option [[77c6dfb](https://github.com/geekuillaume/soundsync/commit/77c6dfb4fbb222297268cd6accd611afc95cc9b4)]
-  Verify soundsync version before connecting [[8b3b9f5](https://github.com/geekuillaume/soundsync/commit/8b3b9f5a2c2ae7e97e5dd1c17d7e29027366555f)]
-  Ignores tmp files [[9156316](https://github.com/geekuillaume/soundsync/commit/91563168572a2e0347964c415fc2564f7c650c72)]
-  Improves a lot of UI related things in the webui [[1664194](https://github.com/geekuillaume/soundsync/commit/1664194847b38c2db810b621a7e655cf695b8253)]
-  Fix bug with remote_source [[217cc82](https://github.com/geekuillaume/soundsync/commit/217cc82e135d27054c87754388bb67efda33c397)]
-  Adds screenshot in readme [[f5cc118](https://github.com/geekuillaume/soundsync/commit/f5cc118bf53356a5a24ad3e2999298a9db324493)]
-  Fix bug with config setting [[25a05c8](https://github.com/geekuillaume/soundsync/commit/25a05c8ae870c3268db5c4005140ffa605beca6c)]
-  Fix pipe component dimensions [[7e896b6](https://github.com/geekuillaume/soundsync/commit/7e896b656303b492c1564a6d6c803a3903b13507)]
-  Close webrtc datachannel when source is not used anymore [[37c6c66](https://github.com/geekuillaume/soundsync/commit/37c6c66802e065ec5d6a193b0cb66cda0415e8bb)]
-  Remove comment [[dc622c7](https://github.com/geekuillaume/soundsync/commit/dc622c784ba25e3dd8001f7e22b076406fd79638)]
-  Add comments about webaudio related code [[019fada](https://github.com/geekuillaume/soundsync/commit/019fada2276b12601eaedd630e3a756b5968becb)]
-  Relax some eslint rules [[976ec4b](https://github.com/geekuillaume/soundsync/commit/976ec4ba44c414cfb9c0277d1f765b07bf9fa4aa)]
-  Lazy load webplayer code for webui [[99f416f](https://github.com/geekuillaume/soundsync/commit/99f416f73106c8e5f6c409b199248a61d7a45ec3)]
-  Fix use-http caching and API_URL for webui dev mode with parcel [[b882728](https://github.com/geekuillaume/soundsync/commit/b882728005887319ff254016012a8cd6f5b2bd94)]
-  Adds some comments about nodejs module aliases [[c4c0a10](https://github.com/geekuillaume/soundsync/commit/c4c0a10f21a5ff637609b74c174ffd2feacb666e)]
-  Starts integrating webaudio sink [[0c1d6ee](https://github.com/geekuillaume/soundsync/commit/0c1d6ee1933b7cef647c0c729cbb7cbcf6b75b2d)]
-  Updates README [[1682133](https://github.com/geekuillaume/soundsync/commit/16821335f025021d4e8e9b7cd1d1a3a96ec8b109)]
-  Use smaller image for systray [[938a3de](https://github.com/geekuillaume/soundsync/commit/938a3de252ee1c4da506bfff037707634b506261)]
-  Support windows output loopback as a source [[f70723a](https://github.com/geekuillaume/soundsync/commit/f70723a6508c06e2d34a17c260863eab57fb742c)]
-  Use a canvas for the pipe animation [[1b0f704](https://github.com/geekuillaume/soundsync/commit/1b0f7048d8d8254e7adf2c412b25d1e1bdcfb5fc)]
-  Adds headless compilation for arm [[9351f71](https://github.com/geekuillaume/soundsync/commit/9351f71cb2963dddb139d952506e735098cdd900)]
-  Revert to electron v7 because of bug with tray not showing [[73ebe96](https://github.com/geekuillaume/soundsync/commit/73ebe961c6aa321cd0e722030c1ee00692dc3347)]
-  Fix bug when two peers are connecting to each other at the same time [[3bfd860](https://github.com/geekuillaume/soundsync/commit/3bfd860a967dcf22ca1cd4f5d3a7ee93fb032da7)]
-  Fixes some bugs with audio pipe between two peers that are not coordinator [[4e80b65](https://github.com/geekuillaume/soundsync/commit/4e80b657a0d6ea0ab85523ac45545ea5c60de60f)]
-  Updates TODO [[4470f2d](https://github.com/geekuillaume/soundsync/commit/4470f2d8a156cad8bcc5c85ca0bec478be802640)]
-  Improve handling of disconnecting and reconnecting sources/sinks [[03cb9ad](https://github.com/geekuillaume/soundsync/commit/03cb9ad17bb60c1a49657ec90d3ccb0d67cd5a7d)]
-  Adds disconnect message on process exit [[f524b4d](https://github.com/geekuillaume/soundsync/commit/f524b4deb0a358a9002dfd794e54a66cfa567f96)]
-  Updates TODO [[b30e164](https://github.com/geekuillaume/soundsync/commit/b30e164deb6f186ccdb958a4752312052356a0f8)]
-  Adds hide feature for sinks and sources on webui [[286f7c3](https://github.com/geekuillaume/soundsync/commit/286f7c30ca07990a8766e8d75f636579b8dc98f0)]
-  Adds eslint for webui [[6e119af](https://github.com/geekuillaume/soundsync/commit/6e119afdd80966951c01efea2051c4364a486939)]
-  Wait for timesync before starting client coordinator [[5c26fbe](https://github.com/geekuillaume/soundsync/commit/5c26fbe9cecff1bdaa810c54db480cea6475d0c8)]
-  Makes electron require optionnal to start project without it [[c0bee18](https://github.com/geekuillaume/soundsync/commit/c0bee184cdf0b0a63fa389d3a7c32faab7e19c71)]
-  Show uncaught error in terminal instead of in electron popup [[d01baa7](https://github.com/geekuillaume/soundsync/commit/d01baa7b496f77cdc41f4267197cb27fbde05554)]
-  Fix latency in audiosource being overwritten [[a5614b6](https://github.com/geekuillaume/soundsync/commit/a5614b6baf9acd6b8ed29681eab9f6ee682f455c)]
-  Fix linting [[97d13f0](https://github.com/geekuillaume/soundsync/commit/97d13f06b9b60daba4c21463070ae626a0c86b67)]
-  Adds eslint [[249d989](https://github.com/geekuillaume/soundsync/commit/249d989be6d3b02115b444c15b48e94811e52994)]
-  Fix error with immutable config object on pipe change [[54421a5](https://github.com/geekuillaume/soundsync/commit/54421a501c765759879c1bbb5c0be64d048b3da4)]
-  Fix pipe on webui when source does not exist [[8c43df9](https://github.com/geekuillaume/soundsync/commit/8c43df9a8485bd6a21dddef4006ba2da5e376e68)]
-  Deactivates log for soundstate messages [[e04ed3d](https://github.com/geekuillaume/soundsync/commit/e04ed3d26f5c7b7a92d066c053844b415472d6a1)]
-  Don&#x27;t delete webrtc peer on disconnect [[0cc3fda](https://github.com/geekuillaume/soundsync/commit/0cc3fda6b4b0ed4ec429cdf3dc2a0781638ea21f)]
-  Handle edge case with audio_source being started twice at the same time [[0d1e313](https://github.com/geekuillaume/soundsync/commit/0d1e3130b754349cde46975b1b8a37c26ec27635)]
-  Only save config if it changed [[3f3b194](https://github.com/geekuillaume/soundsync/commit/3f3b194a53f7dd45eff28b29fa9c0986eca773ba)]
-  Exit with error if server cannot bind to port [[9c82833](https://github.com/geekuillaume/soundsync/commit/9c828334e33bed153f6962cf98342c825eb82878)]
-  Ignore systray error [[9596fc3](https://github.com/geekuillaume/soundsync/commit/9596fc343b5c621604a1a3d818ae0fd61ff197d1)]
-  Bump electron [[b2268d4](https://github.com/geekuillaume/soundsync/commit/b2268d4932c8d61b2ef6d25f927f986962306fbc)]
-  Use config file for coordinator info [[79f7535](https://github.com/geekuillaume/soundsync/commit/79f7535d3a310d6e86f5b2933591dc1d2e4a1ca7)]
-  Fix webui running on another host than localhost [[9b1c41c](https://github.com/geekuillaume/soundsync/commit/9b1c41cef09bf379dc876c05dcd9b1cdf2e12b7f)]
-  Add script to compile for arm with qemu [[49097c9](https://github.com/geekuillaume/soundsync/commit/49097c95468e6dbfd937d14348cb02a23441a761)]
-  Disable asar for windows because of bug https://github.com/electron-userland/electron-builder/issues/580 [[00f247c](https://github.com/geekuillaume/soundsync/commit/00f247cd76398ad4ec36217afecf8aa0c56e4ff8)]
-  Bump speex-resampler version [[c2ba5bb](https://github.com/geekuillaume/soundsync/commit/c2ba5bb3a57532089ddca0337c5d21c23507cc6c)]
-  Bump speex-resampler version [[e2656ba](https://github.com/geekuillaume/soundsync/commit/e2656ba0e3370671dad5308e780affc9c277aeba)]
-  Fix build command [[b557a14](https://github.com/geekuillaume/soundsync/commit/b557a1432c8f32c99c86566014684154b1bbf3f0)]
-  Change artifact name for github actions [[e59c750](https://github.com/geekuillaume/soundsync/commit/e59c750e3a7748ff2111f7e66f58e2d4aca9d9fc)]
-  Separate app package.json for two package.json strategy of electron-builder [[1b2067d](https://github.com/geekuillaume/soundsync/commit/1b2067d94a29ac76edfee1654f5849484b252d47)]
-  Adds coordinator selector from systray instead of CLI args [[72a8d64](https://github.com/geekuillaume/soundsync/commit/72a8d64396fd9829591e4c1106f8f7ca070164ab)]
-  Adds github action to build [[a2c5187](https://github.com/geekuillaume/soundsync/commit/a2c5187d7d326f3f4fd6af6af23b0bd8bf5960fb)]
-  Adds autolaunch feature [[ba093d9](https://github.com/geekuillaume/soundsync/commit/ba093d97921985bc198b3b7b9cb76a9ab13178f4)]
-  Move todo in Readme [[e35db39](https://github.com/geekuillaume/soundsync/commit/e35db39972e72973446e3786dd3f2098a7e87446)]
-  Adds first version of readme and branding [[3534dc0](https://github.com/geekuillaume/soundsync/commit/3534dc0950dfae24426afbf1a1b65b312ab67ff9)]
-  Adds BSL license [[32600e1](https://github.com/geekuillaume/soundsync/commit/32600e1d058174fb41b343cb25220f0629c5c8e0)]
-  Use electron to package app [[0ca30da](https://github.com/geekuillaume/soundsync/commit/0ca30da634d1215a78f118f184b573a851fd078e)]
-  Use path.join to get webui directory to be autodected by pkg [[393d507](https://github.com/geekuillaume/soundsync/commit/393d507c7ba4ae20ef516f503085cc40e0f0bcd1)]
-  Updates todo [[50451e4](https://github.com/geekuillaume/soundsync/commit/50451e4f375dc71e305e18c0c783ab546e6edb9a)]
-  Fix bug with local name updating of source or sink [[ba2d70a](https://github.com/geekuillaume/soundsync/commit/ba2d70ac6ffc3b045f62aca02391769ba4a46202)]
-  Refactores sound state handling between host and client controller [[7a59f1c](https://github.com/geekuillaume/soundsync/commit/7a59f1c61c65d7e3997dcb43822531ca5c6b999e)]
-  Adds source and sink name edit in webui [[1703271](https://github.com/geekuillaume/soundsync/commit/17032712f5c22c1aac1ab93bc568aa251f243323)]
-  Fix pipe creation issue and implements remote unlink pipe [[c941259](https://github.com/geekuillaume/soundsync/commit/c941259a713bb2d288fcbf88131e69bb2da0e502)]
-  Handle remote type for sink and source [[1baae4e](https://github.com/geekuillaume/soundsync/commit/1baae4e8306b2f72b77dcb9b10b11a4ab47da62c)]
-  Dont crash if cannot init systray [[5af37db](https://github.com/geekuillaume/soundsync/commit/5af37db3a1112b3b7ad99156c771bc237f574aed)]
-  Updates todo [[1ef7e6b](https://github.com/geekuillaume/soundsync/commit/1ef7e6bf2c56d22cb45a852853ce5e5a028ebd8f)]
-  Adds systray indicator [[06a110f](https://github.com/geekuillaume/soundsync/commit/06a110f93d3c2e4299e825b58b5c64eabaf7779d)]
-  Adds error message on config parse error [[18a755d](https://github.com/geekuillaume/soundsync/commit/18a755d97851f74b5eb95ada29756f4b9d6515d0)]
-  Adds static serving of webui [[17a6d07](https://github.com/geekuillaume/soundsync/commit/17a6d0780de5f92637e99170b9a70cf9b2ad47ce)]
-  Adds pipe auto-recreation on restart / reconnection [[77f4a4d](https://github.com/geekuillaume/soundsync/commit/77f4a4dd034ad15d65ed039c467dba69717e9272)]
-  Updates latency and remove comment [[48c54e2](https://github.com/geekuillaume/soundsync/commit/48c54e2596466817cb27617994e9409715dc8521)]
-  Update todo [[cbf63ac](https://github.com/geekuillaume/soundsync/commit/cbf63aca17274a9bc4ce5651c227da679f1c0107)]
-  Bump audify and start implementing dynamic latency [[82dc970](https://github.com/geekuillaume/soundsync/commit/82dc970fd10542eb3eb013b02d3c216d12c2bc68)]
-  Fix delay on webui start [[b7a14af](https://github.com/geekuillaume/soundsync/commit/b7a14af1bc65e911b3a9de9f2f81e1f763d07e26)]
-  Use local name for webrtc peer [[7dc6f50](https://github.com/geekuillaume/soundsync/commit/7dc6f505cfedff1e65bdfdb4e49886fc9fc22b1c)]
-  Fix pipe deletion mismatch [[0ab1684](https://github.com/geekuillaume/soundsync/commit/0ab1684dfbc9e02cc7142600f1f17f89b663bc11)]
-  Fix crash when coordinator drops [[0fe49e9](https://github.com/geekuillaume/soundsync/commit/0fe49e9259d4f24af2f35735ac313fea393d89e2)]
-  Adds cross-env to support windows [[848a143](https://github.com/geekuillaume/soundsync/commit/848a1436e3cb5269d7af350f5befdb765997acd4)]
-  Adds first version of webui [[2741364](https://github.com/geekuillaume/soundsync/commit/274136411f7276afbeef792cc79d4bd4b4d4e89a)]
-  Fix CORS for API [[d6891b6](https://github.com/geekuillaume/soundsync/commit/d6891b65fb93ef2630692815c7e8d7f7e5876f76)]
-  Adds null sink and null source to help testing [[7fa8bcc](https://github.com/geekuillaume/soundsync/commit/7fa8bcc47abdc312c35c30bf15d43a459eacb4f2)]
-  Adds utils scripts [[07de577](https://github.com/geekuillaume/soundsync/commit/07de5774646dd6a6ea38a46e9e718fe943ef1bcd)]
-  Implements pipe deletion and some cleaning [[60152ce](https://github.com/geekuillaume/soundsync/commit/60152ce8a674b8d215f7be0546d4edbe889adb7b)]
-  Save sinks in config file [[8a98e65](https://github.com/geekuillaume/soundsync/commit/8a98e65d4be917463ad55818ff9fcfa82a613d71)]
-  Adds config module [[44d6b15](https://github.com/geekuillaume/soundsync/commit/44d6b15da9a493adf9ab87c3896dd1964b5929f0)]
-  Adds log for bonjour in progress [[15b6f40](https://github.com/geekuillaume/soundsync/commit/15b6f40c920fbe2ed06b0e142f8b274c4a484e22)]
-  Adds bonjour integration for coordinator autodetection [[46971f0](https://github.com/geekuillaume/soundsync/commit/46971f0378427d9f521ed5db986c54c22c612666)]
-  Handle disconnect of peer and improves multi output [[949da7f](https://github.com/geekuillaume/soundsync/commit/949da7f32face684c6cc5fb46e3d96a59a2b1774)]
-  pipeCreatorTester now can create multiple pipes [[2336c26](https://github.com/geekuillaume/soundsync/commit/2336c2659559d6326e74029e7ba4ddf642cb7925)]
-  Improves debugging mode [[7d189ee](https://github.com/geekuillaume/soundsync/commit/7d189eecd67241343cce2d8577ec04a8c739d032)]
-  Don&#x27;t reuse previously emitted audio chunk [[62332bd](https://github.com/geekuillaume/soundsync/commit/62332bd72799088d1a30c5ab76ec4a6672dd73f8)]
-  Implements audio buffer first implementation [[7055ec5](https://github.com/geekuillaume/soundsync/commit/7055ec52749d088ff9b6ef57564fa8af9c5a8538)]
-  Adds timekeeper [[3ba656f](https://github.com/geekuillaume/soundsync/commit/3ba656f511fb02659690bfd9607a163444aae6f6)]
-  Moves sources and sinks in their own folder [[4fb8610](https://github.com/geekuillaume/soundsync/commit/4fb86107d7dc0fc5d934f100b5ef293803d439b6)]
-  Implement audio chunking and transport [[06de637](https://github.com/geekuillaume/soundsync/commit/06de6379b27b8c3edff7659ecef5e5a2bbbbd17b)]
-  Lockfile [[84c01f5](https://github.com/geekuillaume/soundsync/commit/84c01f5d6a6369321e8cce96a6a3f8eb483038b1)]
-  Ignore dist [[7b5c721](https://github.com/geekuillaume/soundsync/commit/7b5c721e598be32544402cdd5e509969fb11ae80)]
-  Move speex-resampler in its own repo [[612b70a](https://github.com/geekuillaume/soundsync/commit/612b70a5cf3299b5fd8757ef0855769a1a2894a1)]
-  Adds resampler [[8296d5d](https://github.com/geekuillaume/soundsync/commit/8296d5d77aa727bd16b339dc14b79131ab817eb0)]
-  4 [[892c4e1](https://github.com/geekuillaume/soundsync/commit/892c4e1e83b5f16cf045e6644fdae283fb90e83a)]
-  3 [[e2fce9e](https://github.com/geekuillaume/soundsync/commit/e2fce9ee9ace04d567a54ebf404389df9cb6e284)]
-  2 [[4d8a06c](https://github.com/geekuillaume/soundsync/commit/4d8a06c2cd3338a6afc82e801f5db95ee8d67bc0)]
-  init [[3427914](https://github.com/geekuillaume/soundsync/commit/342791456f1265042c35aa4e8ab4272364cb78e7)]


