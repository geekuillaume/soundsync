import { resolve } from 'path';
import { promises } from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromisify = util.promisify(exec);

const { readFile, writeFile } = promises;

const packagesJsonFiles = [
  './package.json',
  'app/package.json',
];

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const main = async () => {
  const newVersion = process.argv[2];
  assert(newVersion, 'New version should be passed as first argument');
  assert(newVersion.match(/\d+\.\d+\.\d+/), 'New version should match the template MAJOR.MINOR.PATCH');

  const { stdout: notCommitedFiles } = await execPromisify('git status --porcelain');
  assert(!notCommitedFiles, 'Working directory not clean, commit files with git or stash them before running this');

  console.log(`==== Bumping package.json to version ${newVersion}`);
  await Promise.all(packagesJsonFiles.map(async (filepath) => {
    const path = resolve(__dirname, '../../', filepath);
    let content = (await readFile(path)).toString();
    content = content.replace(/^\s*"version":.*$/gm, `    "version": "${newVersion}",`);
    await writeFile(path, content);
  }));

  console.log(`==== Updating Readme links`);
  const readmePath = resolve(__dirname, '../../README.md');
  let readmeContent = (await readFile(readmePath)).toString();
  readmeContent = readmeContent.replace(
    /"https:\/\/github\.com\/geekuillaume\/soundsync\/releases\/download\/[^/]+\/(.+[-_])(\d+\.\d+\.\d+)\.([a-z]+)"/g,
    `"https://github.com/geekuillaume/soundsync/releases/download/v${newVersion}/$1${newVersion}.$3"`,
  );
  await writeFile(readmePath, readmeContent.toString());

  console.log(`==== Updating Webui download links`);
  const webuiDownloadLinksPath = resolve(__dirname, '../../webui/src/components/FirstUse/DownloadLinks.jsx');
  let downloadLinksContent = (await readFile(webuiDownloadLinksPath)).toString();
  downloadLinksContent = downloadLinksContent.replace(
    /'https:\/\/github\.com\/geekuillaume\/soundsync\/releases\/download\/[^/]+\/(.+[-_])(\d+\.\d+\.\d+)\.([a-z]+)'/g,
    `'https://github.com/geekuillaume/soundsync/releases/download/v${newVersion}/$1${newVersion}.$3'`,
  );
  await writeFile(webuiDownloadLinksPath, downloadLinksContent.toString());
  await execPromisify(`npm run gitmoji-changelog`);
  await execPromisify(`git add --all`);
  await execPromisify(`git commit -m ":bookmark: v${newVersion}"`);
  await execPromisify(`git tag -a v${newVersion} -m "v${newVersion}"`);

  console.log(`==== Bumping package.json to dev version`);
  await Promise.all(packagesJsonFiles.map(async (filepath) => {
    const path = resolve(__dirname, '../../', filepath);
    let content = (await readFile(path)).toString();
    content = content.replace(/^\s*"version":.*$/gm, `  "version": "${newVersion}-dev",`);
    await writeFile(path, content);
  }));
  await execPromisify(`git add --all`);
  await execPromisify(`git commit -m ':construction: Bump to dev version'`);

  console.log('New version committed and tagged. To upload use "git push origin master --tags"');
};

main();
