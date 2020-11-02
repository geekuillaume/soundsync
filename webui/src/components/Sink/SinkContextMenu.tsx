import React, { useState, useRef } from 'react';
import { useSnackbar } from 'notistack';

// import Dialog from '@material-ui/core/Dialog';
// import useMediaQuery from '@material-ui/core/useMediaQuery';
import {
  withStyles, Popover, TextField, InputAdornment, makeStyles,
} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import Slider from '@material-ui/core/Slider';
import VolumeDown from '@material-ui/icons/VolumeDown';
import VolumeUp from '@material-ui/icons/VolumeUp';
import RestoreIcon from '@material-ui/icons/Restore';
import UpdateIcon from '@material-ui/icons/Update';

import { useRegisterForPipe, useUnpipeAction } from 'utils/useSoundSyncState';
import { nameWithoutHiddenMeta, isHidden } from 'utils/hiddenUtils';
import { AudioSink } from '../../../../src/audio/sinks/audio_sink';
import { WebAudioSink } from '../../../../src/audio/sinks/webaudio_sink';

const DELETABLE_SINK_TYPES = ['huelight', 'airplay'];

const EditPopover = withStyles((t) => ({
  paper: {
    backgroundColor: 'rgba(0,0,0,.4)',
    backdropFilter: 'blur(2px)',
    borderRadius: 5,
    color: 'white',
    padding: t.spacing(2, 3),
    width: 300,
  },
}))(Popover);

const PopoverButton = withStyles((t) => ({
  root: {
    display: 'block',
    textAlign: 'center',
    margin: t.spacing(1, 0),
    width: '100%',
    backgroundColor: 'rgba(0,0,0,.6)',
    color: 'white',
  },
}))(Button);

const PopoverTextField = withStyles(() => ({
  input: {
    color: 'white',
  },
}))(({ classes, InputProps, ...props }) => (<TextField {...props} InputProps={{ classes, ...InputProps }} />));

const useStyles = makeStyles(() => ({
  volumeContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& > .MuiSlider-root': {
      margin: '0 13px',
    },
  },
  latencyContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '9px 0',
    '& > svg': {
      cursor: 'pointer',
    }
  }
}));


export const SinkContextMenu = ({
  isOpen, onClose, sink, anchor,
}: { sink: AudioSink; isOpen: boolean; onClose: () => any; anchor: HTMLElement }) => {
  const styles = useStyles();
  const [renameOpen, setRenameOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const inputEl = useRef<HTMLInputElement>();
  const hidden = isHidden(sink.name);
  const canBeDeleted = DELETABLE_SINK_TYPES.includes(sink.type);

  const isPiped = !!sink.pipedFrom;

  const handleClose = () => {
    onClose();
    // because of popover close animation
    setTimeout(() => {
      setRenameOpen(false);
    }, 500);
  };

  const handleRenameButtonClick = () => setRenameOpen(true);
  const handleRename = async () => {
    const newName = inputEl.current.value;
    if (newName !== nameWithoutHiddenMeta(sink.name)) {
      sink.patch({ name: hidden ? `[hidden] ${newName}` : newName });
    }
    handleClose();
  };

  const handleHide = async () => {
    const newName = hidden ? nameWithoutHiddenMeta(sink.name) : `[hidden] ${sink.name}`;
    // await edit(type, audioStream.uuid, { name: newName });
    sink.patch({ name: newName });
    handleClose();
  };

  const registerForPipe = useRegisterForPipe('sink', sink)[2];

  const handleLink = () => {
    handleClose();
    // @ts-ignore
    const { piped } = registerForPipe();
    if (!piped) {
      enqueueSnackbar('Select which source to pipe from in the list', { autoHideDuration: 3000 });
    }
  };

  const handleUnpipe = useUnpipeAction(sink);
  const handleUnlink = () => {
    handleUnpipe();
    handleClose();
  };

  const renameInputAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label="Rename source"
        onClick={handleRename}
        style={{ color: 'white' }}
      >
        <EditIcon />
      </IconButton>
    </InputAdornment>
  );

  const renameModalContent = (
    <PopoverTextField
      defaultValue={nameWithoutHiddenMeta(sink.name)}
      fullWidth
      InputProps={{
        inputRef: inputEl,
        autoFocus: true,
        endAdornment: renameInputAdornment,
      }}
    />
  );

  const handleVolumeChange = (e, newValue) => {
    sink.patch({
      volume: newValue,
    });
  };

  const handleDelete = () => {
    sink.peer.sendRcp('deleteSink', sink.uuid);
  };

  const handleDecreaseLatencyCorrection = () => {
    sink.patch({
      latencyCorrection: Math.max(0, sink.latencyCorrection - 5),
    });
  };
  const handleIncreaseLatencyCorrection = () => {
    sink.patch({
      latencyCorrection: Math.min(400, sink.latencyCorrection + 5),
    });
  };

  const defaultModalContent = (
    <>
      <div className={styles.volumeContainer}>
        <VolumeDown />
        <Slider value={sink.volume} min={0} max={1} step={0.01} onChange={handleVolumeChange} />
        <VolumeUp />
      </div>
      {sink.latencyCorrection !== 0 &&
        <div className={styles.latencyContainer}>
          <RestoreIcon onClick={handleDecreaseLatencyCorrection} />
          <p>{sink.latencyCorrection} ms</p>
          <UpdateIcon onClick={handleIncreaseLatencyCorrection} />
        </div>
      }
      <PopoverButton disableElevation variant="contained" onClick={handleLink}>Link</PopoverButton>
      {isPiped && <PopoverButton disableElevation variant="contained" onClick={handleUnlink}>Unlink</PopoverButton>}
      <PopoverButton disableElevation variant="contained" onClick={handleRenameButtonClick}>Rename</PopoverButton>
      <PopoverButton disableElevation variant="contained" onClick={handleHide}>{hidden ? 'Unhide' : 'Hide'}</PopoverButton>
      {sink.latencyCorrection === 0 && <PopoverButton disableElevation variant="contained" onClick={handleIncreaseLatencyCorrection}>Set latency correction</PopoverButton>}
      {canBeDeleted && <PopoverButton disableElevation variant="contained" onClick={handleDelete}>Delete</PopoverButton>}
      {window.localStorage.getItem('soundsync:debug') && <PopoverButton disableElevation variant="contained" onClick={() => console.log(sink)}>Log info</PopoverButton>}
      {window.localStorage.getItem('soundsync:debug') && sink instanceof WebAudioSink && <PopoverButton disableElevation variant="contained" onClick={() => sink instanceof WebAudioSink && sink.audioClockDriftHistory.flush()}>Flush drift info</PopoverButton>}
    </>
  );

  return (
    <EditPopover
      anchorEl={anchor}
      open={isOpen}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      {renameOpen && renameModalContent}
      {!renameOpen && defaultModalContent}
    </EditPopover>
  );
};
