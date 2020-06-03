import React, { useState, useRef } from 'react';
import { useSnackbar } from 'notistack';

import {
  withStyles, Popover, TextField, InputAdornment,
} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import { useRegisterForPipe } from '../utils/useSoundSyncState';
import { nameWithoutHiddenMeta, isHidden } from '../utils/hiddenUtils';

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

export const useEditAudioStreamModal = (type, audioStream) => {
  // const theme = useTheme();
  // const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const anchor = useRef();
  const inputEl = useRef();
  const hidden = isHidden(audioStream.name);

  const handleClose = () => {
    setOpen(false);
    // because of popover close animation
    setTimeout(() => {
      setRenameOpen(false);
    }, 500);
  };

  const handleRenameButtonClick = () => setRenameOpen(true);
  const handleRename = async () => {
    const newName = inputEl.current.value;
    if (newName !== nameWithoutHiddenMeta(audioStream.name)) {
      audioStream.patch({ name: hidden ? `[hidden] ${newName}` : newName });
    }
    handleClose();
  };
  const handleHide = async () => {
    const newName = hidden ? nameWithoutHiddenMeta(audioStream.name) : `[hidden] ${audioStream.name}`;
    // await edit(type, audioStream.uuid, { name: newName });
    audioStream.patch({ name: newName });
    handleClose();
  };
  const registerForPipe = useRegisterForPipe(type, audioStream)[2];
  const handleLink = () => {
    handleClose();
    // @ts-ignore
    const { piped } = registerForPipe();
    if (!piped) {
      enqueueSnackbar('Select which speaker to use in the list', { autoHideDuration: 3000 });
    }
  };

  const canBeDeleted = type === 'source' && (audioStream.type === 'librespot' || audioStream.type === 'shairport' || audioStream.type === 'null');
  const handleDelete = () => {
    audioStream.peer.sendControllerMessage({
      type: 'sourceDelete',
      sourceUuid: audioStream.uuid,
    });
    handleClose();
  };

  const modal = (
    <EditPopover
      anchorEl={anchor.current}
      open={open}
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
      {renameOpen
        && (
        <PopoverTextField
          defaultValue={nameWithoutHiddenMeta(audioStream.name)}
          fullWidth
          InputProps={{
            inputRef: inputEl,
            autoFocus: true,
            endAdornment:
  <InputAdornment position="end">
    <IconButton
      aria-label="Rename source"
      onClick={handleRename}
      style={{ color: 'white' }}
    >
      <EditIcon />
    </IconButton>
  </InputAdornment>,
          }}
        />
        )}
      {!renameOpen && (
        <>
          <PopoverButton disableElevation variant="contained" onClick={handleLink}>Link</PopoverButton>
          <PopoverButton disableElevation variant="contained" onClick={handleRenameButtonClick}>Rename</PopoverButton>
          <PopoverButton disableElevation variant="contained" onClick={handleHide}>{hidden ? 'Unhide' : 'Hide'}</PopoverButton>
          {window.localStorage.getItem('soundsync:debug') && <PopoverButton disableElevation variant="contained" onClick={() => console.log(audioStream)}>Log info</PopoverButton>}
        </>
      )}
      {canBeDeleted && (
        <PopoverButton disableElevation variant="contained" onClick={handleDelete}>Delete</PopoverButton>
      )}
    </EditPopover>
  );
  return {
    handleOpen: () => setOpen(true),
    modal,
    anchor,
  };
};
