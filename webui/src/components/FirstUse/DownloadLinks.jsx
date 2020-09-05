import React from 'react';
import Button from '@material-ui/core/Button';
import classnames from 'classnames';
import './firstUse.css';

import WindowsIcon from '../../res/windows.svg';
import MacOsIcon from '../../res/macos.svg';
import LinuxIcon from '../../res/linux.svg';
import RaspberryIcon from '../../res/raspberry.svg';

export const DOWNLOAD_LINKS_TARGETS = {
  windows: 'https://soundsync.app/download/soundsync-win.exe',
  macos: 'https://soundsync.app/download/soundsync-macos.dmg',
  linuxDeb: 'https://soundsync.app/download/soundsync-deb-x64.deb',
  linuxPacman: 'https://soundsync.app/download/soundsync-pacman.pacman',
  armDeb: 'https://soundsync.app/download/soundsync-deb-arm.deb',
};

export const DownloadLinks = ({ twoLinesLayout }) => (
  <div className={classnames('downloadPlatforms', { twoLinesLayout })}>
    <div className="platform">
      <img src={WindowsIcon} />
      <h3>Windows</h3>
      <Button variant="outlined" className="downloadButton" href={DOWNLOAD_LINKS_TARGETS.windows}>Download</Button>
    </div>
    <div className="platform">
      <img src={MacOsIcon} />
      <h3>MacOS</h3>
      <Button variant="outlined" className="downloadButton" href={DOWNLOAD_LINKS_TARGETS.macos}>Download</Button>
    </div>
    <div className="platform">
      <img src={LinuxIcon} />
      <h3>Linux</h3>
      <Button variant="outlined" className="downloadButton" href={DOWNLOAD_LINKS_TARGETS.linuxDeb}>
        <span>Download</span>
        <span className="packageInfo">.deb for Ubuntu/Debian</span>
      </Button>
      <Button variant="outlined" className="downloadButton" href={DOWNLOAD_LINKS_TARGETS.linuxPacman}>
        <span>Download</span>
        <span className="packageInfo">.pacman for Archlinux</span>
      </Button>
    </div>
    <div className="platform">
      <img src={RaspberryIcon} />
      <h3>Linux ARM (Raspberry)</h3>
      <Button variant="outlined" className="downloadButton" href={DOWNLOAD_LINKS_TARGETS.armDeb}>
        <span>Download</span>
        <span className="packageInfo">.deb for Raspbian</span>
      </Button>
    </div>
  </div>
);
