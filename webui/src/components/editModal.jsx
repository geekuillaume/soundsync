import React, { useState, useRef } from 'react';
// import Dialog from '@material-ui/core/Dialog';
// import useMediaQuery from '@material-ui/core/useMediaQuery';
import {
  withStyles, Popover, TextField, InputAdornment,
} from '@material-ui/core';
import Button from '@material-ui/core/Button';
// import MuiDialogTitle from '@material-ui/core/DialogTitle';
// import MuiDialogContent from '@material-ui/core/DialogContent';
// import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
// import CloseIcon from '@material-ui/icons/Close';
// import Typography from '@material-ui/core/Typography';
// import Slide from '@material-ui/core/Slide';
import EditIcon from '@material-ui/icons/Edit';
import { useRegisterForPipe, useIsPiped, useUnpipeAction } from '../utils/useSoundSyncState';
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

const PopoverTextField = withStyles((t) => ({
  input: {
    color: 'white',
  },
}))(({ classes, InputProps, ...props }) => (<TextField {...props} InputProps={{ classes, ...InputProps }} />));

export const useEditAudioStreamModal = (type, audioStream) => {
  // const theme = useTheme();
  // const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
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
  const registerForPipe = useRegisterForPipe(type, audioStream.uuid)[2];
  const handleLink = () => {
    handleClose();
    registerForPipe();
  };
  const handleUnpipe = useUnpipeAction(audioStream.uuid);
  const handleUnlink = () => {
    handleUnpipe();
    handleClose();
  };

  const isPiped = useIsPiped(audioStream.uuid);

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
          {type === 'sink' && isPiped && <PopoverButton disableElevation variant="contained" onClick={handleUnlink}>Unlink</PopoverButton>}
          <PopoverButton disableElevation variant="contained" onClick={handleRenameButtonClick}>Rename</PopoverButton>
          <PopoverButton disableElevation variant="contained" onClick={handleHide}>{hidden ? 'Unhide' : 'Hide'}</PopoverButton>
        </>
      )}
    </EditPopover>
  );
  return {
    handleOpen: () => setOpen(true),
    modal,
    anchor,
  };
};
