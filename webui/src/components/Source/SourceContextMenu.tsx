import React, { useState, useRef } from 'react';
import { useSnackbar } from 'notistack';

import {
  withStyles, Popover, TextField, InputAdornment,
} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import { useRegisterForPipe } from 'utils/useSoundSyncState';
import { nameWithoutHiddenMeta, isHidden } from 'utils/hiddenUtils';
import { AudioSource } from '../../../../src/audio/sources/audio_source';

const DELETABLE_SOURCE_TYPES = ['librespot', 'shairport', 'null'];

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

export const SourceContextMenu = (
  {
    isOpen, onClose, source, anchor,
  }: { source: AudioSource; isOpen: boolean; onClose: () => any; anchor: HTMLElement },
) => {
  const { enqueueSnackbar } = useSnackbar();
  const [renameOpen, setRenameOpen] = useState(false);
  const inputEl = useRef<HTMLInputElement>();
  const hidden = isHidden(source.name);
  const canBeDeleted = DELETABLE_SOURCE_TYPES.includes(source.type);

  const handleClose = () => {
    onClose();
    // because of popover close animation
    setTimeout(() => {
      setRenameOpen(false);
    }, 500);
  };

  const handleRenameButtonClick = () => setRenameOpen(true);
  const handleRename = async () => {
    if (inputEl.current) {
      return;
    }
    const newName = inputEl.current.value;
    if (newName !== nameWithoutHiddenMeta(source.name)) {
      source.patch({ name: hidden ? `[hidden] ${newName}` : newName });
    }
    handleClose();
  };

  const handleHide = async () => {
    const newName = hidden ? nameWithoutHiddenMeta(source.name) : `[hidden] ${source.name}`;
    // await edit(type, source.uuid, { name: newName });
    source.patch({ name: newName });
    handleClose();
  };

  const registerForPipe = useRegisterForPipe('source', source)[2];
  const handleLink = () => {
    handleClose();
    const { piped } = registerForPipe();
    if (!piped) {
      enqueueSnackbar('Select which speaker to use in the list', { autoHideDuration: 3000 });
    }
  };

  const handleDelete = () => {
    source.peer.sendControllerMessage({
      type: 'sourceDelete',
      sourceUuid: source.uuid,
    });
    handleClose();
  };

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
      {renameOpen
        && (
        <PopoverTextField
          defaultValue={nameWithoutHiddenMeta(source.name)}
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
          {canBeDeleted && (
            <PopoverButton disableElevation variant="contained" onClick={handleDelete}>Delete</PopoverButton>
          )}
          {window.localStorage.getItem('soundsync:debug') && <PopoverButton disableElevation variant="contained" onClick={() => console.log(source)}>Log info</PopoverButton>}
        </>
      )}
    </EditPopover>
  );
};
