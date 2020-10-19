import React, { useCallback, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme) => ({
  closeButton: {
    color: theme.palette.grey[500],
    marginLeft: 30,
  },
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));

export const BetaPopup = () => {
  const classes = useStyles();
  const [open, setOpen] = useState(localStorage && !localStorage.getItem('soundsync:betaPopupClosed'));
  const onClose = useCallback(() => {
    setOpen(false);
    localStorage.setItem('soundsync:betaPopupClosed', 'true');
  }, []);

  return (
    <Dialog open={open} onClose={onClose}>
      <MuiDialogTitle className={classes.dialogTitle} disableTypography>
        <Typography variant="h6">Welcome to Soundsync</Typography>
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </MuiDialogTitle>
      <MuiDialogContent dividers>
        <Typography paragraph>
          Hi! I'm Guillaume and I want to thank you for taking part in Soundsync beta!
        </Typography>
        <Typography paragraph>
          If you find a problem, it would greatly help me if you report it on Github. As with any beta, there will be some bugs but there are multiple people using it everyday without any problems.
        </Typography>
        <Typography paragraph>
          Soundsync is completely free during the beta, you don't even need an account. After the beta, some advanced features will only be available to paying users. I want to continue to maintain and improve Soundsync and can only do so if I can monetize it.
        </Typography>
        <Typography paragraph>
          Enjoy Soundsync! I hope you'll like it!
        </Typography>
      </MuiDialogContent>
    </Dialog>
  );
};
