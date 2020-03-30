# Raspberry Pi tips and tricks

## Install dependencies

```
apt update && apt upgrade
curl -sL https://deb.nodesource.com/setup_13.x | bash -
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

apt-get update
apt-get install -y nodejs gcc g++ make yarn build-essential git cmake libasound2-dev
```

## Recompile native deps

```
npm_config_arch=armv7l yarn install
```

## Install package built with Electron-builder

```
sudo dpkg -i soundsync.deb
sudo apt-get -f install
```
