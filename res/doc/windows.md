# Windows tips and tricks

## Using rsync on Windows for development

Install rsync from : https://github.com/backuppc/cygwin-rsyncd/releases

Install node

Deactivate firewall

Install yarn and cmake:
```
choco install -y yarn
choco install cmake --installargs 'ADD_CMAKE_TO_PATH=System'
```

Start rsync:
```
C:\rsyncd\bin\rsync.exe --daemon --config C:\rsyncd\rsyncd.conf --no-detach
```

## Start soundsync headless to get better error messages

In a node process in the same folder as soundsync:
```
require('child_process').spawn('./soundsync.exe', ['./resources/app.asar/index.js'], {env: {ELECTRON_RUN_AS_NODE: 1}, stdio: 'inherit'});
```

When installing the package, the executable will be in `C:/Users/YOUR_USER/AppData/Local/Programs/soundsync`.
