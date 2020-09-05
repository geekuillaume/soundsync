/* eslint-disable @typescript-eslint/camelcase */
import Router from 'koa-router';
import { DefaultState, Context } from 'koa';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const router = new Router<DefaultState, Context>();

const version = JSON.parse(readFileSync(resolve(__dirname, '../../../package.json')).toString()).version;
const sanitizedVersion = version.replace(`-dev`, '');

const stableDownloadUrls = {
  macos: `https://github.com/geekuillaume/soundsync/releases/download/v${sanitizedVersion}/soundsync-${sanitizedVersion}.dmg`,
  win: `https://github.com/geekuillaume/soundsync/releases/download/v${sanitizedVersion}/soundsync-${sanitizedVersion}.exe`,
  deb_x64: `https://github.com/geekuillaume/soundsync/releases/download/v${sanitizedVersion}/soundsync-amd64-${sanitizedVersion}.deb`,
  deb_arm: `https://github.com/geekuillaume/soundsync/releases/download/v${sanitizedVersion}/soundsync-armv7l-${sanitizedVersion}.deb`,
  pacman: `https://github.com/geekuillaume/soundsync/releases/download/v${sanitizedVersion}/soundsync-x64-${sanitizedVersion}.pacman`,
};
const devDownloadUrls = {
  macos: `https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync-${sanitizedVersion}-dev.dmg`,
  win: `https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync-${sanitizedVersion}-dev.exe`,
  deb_x64: `https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync-amd64-${sanitizedVersion}-dev.deb`,
  deb_arm: `https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync-armv7l-${sanitizedVersion}-dev.deb`,
  pacman: `https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync-x64-${sanitizedVersion}-dev.pacman`,
};

router.get('/download/:binaryQuery', async (ctx) => {
  const binaryQuery = ctx.params.binaryQuery as string;

  const match = binaryQuery.match(/^soundsync-(?<platform>\w+)(-(?<arch>\w+))?\.(?<extension>\w+)$/);
  ctx.assert(match, 404, 'last part of url should be "soundsync-[platform].[platformExtension]"');
  const { groups: { platform, arch, extension } } = match;

  const url = stableDownloadUrls[`${platform}${arch ? `_${arch}` : ''}`];
  ctx.assert(url, 404, 'Unknown platform and arch combo');
  if (url) {
    ctx.redirect(url);
  }
});

router.get('/download-dev/:platform/:arch?', async (ctx) => {
  const binaryQuery = ctx.params.binaryQuery as string;

  const match = binaryQuery.match(/^soundsync-(?<platform>\w+)(-(?<arch>\w+))?\.(?<extension>\w+)$/);
  ctx.assert(match, 404, 'last part of url should be "soundsync-[platform].[platformExtension]"');
  const { groups: { platform, arch, extension } } = match;

  const url = devDownloadUrls[`${platform}${arch ? `_${arch}` : ''}`];
  ctx.assert(url, 404, 'Unknown platform and arch combo');
  if (url) {
    ctx.redirect(url);
  }
});

export default router;
