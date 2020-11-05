import React, { useCallback, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AddIcon from '@material-ui/icons/Add';
import { BUILD_VERSION } from '../../../../src/utils/version';
import { useSetTroubleshootingVisible, useTroubleshootingVisible } from 'utils/useSoundSyncState';

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
  troubleshootingStep: {
    contain: 'content',
    width: '100%',
    '&:before': {
      display: 'none',
    },
    '& .MuiIconButton-root.Mui-expanded': {
      transform: 'rotate(45deg)',
    },
  },
  troubleshootingStepTitle: {
    fontFamily: '\'Sora\', sans-serif',
  },
  troubleshootingStepContent: {
    width: '100%',
    overflow: 'hidden',
    wordBreak: 'break-word',
    flexDirection: 'column',
    '& ul': {
      listStyle: 'disc',
      padding: '0 0 0 1em',
    }
  },
}));


const TroubleshootingStep = ({ title, content }: {title: string; content: any}) => {
  const classes = useStyles();

  return (
    <Accordion className={classes.troubleshootingStep}>
      <AccordionSummary expandIcon={<AddIcon />}>
        <p className={classes.troubleshootingStepTitle}>{title}</p>
      </AccordionSummary>
      <AccordionDetails className={classes.troubleshootingStepContent}>
        {content}
      </AccordionDetails>
    </Accordion>
  );
};

export const Troubleshooting = () => {
  const classes = useStyles();
  const visible = useTroubleshootingVisible();
  const setVisible = useSetTroubleshootingVisible();

  return (
    <Dialog open={visible} onClose={() => setVisible(false)}>
      <MuiDialogTitle className={classes.dialogTitle} disableTypography>
        <Typography variant="h6">Troubleshooting</Typography>
        <IconButton aria-label="close" className={classes.closeButton} onClick={() => setVisible(false)}>
          <CloseIcon />
        </IconButton>
      </MuiDialogTitle>
      <MuiDialogContent dividers>
        <Typography paragraph>
          Do you have a problem with Soundsync? Here's some information to find a solution. If nothing helps you fix this problem, you can ask your question directly on our <a href="https://discord.gg/j2BZ5KC">Discord server</a>.
        </Typography>
        <TroubleshootingStep
          title={`Nothing shows up / blocked on "Connecting..."`}
          content={
          <>
            <p>There is a problem with the connection to the Soundsync installs on your local network. Here's some step to troubleshoot this problem:</p>
            <ul>
              <li>Make sure Soundsync is started on your computer and that you are connected to the same network / wifi.</li>
              <li>Verify the version of every Soundsync install and update it if needed. The last version is {BUILD_VERSION}.</li>
              <li>Connect directly to the Soundsync install by accessing <a href="http://127.0.0.1:6512/controller">http://127.0.0.1:6512/controller</a> if you are on the same computer where you installed Soundsync. If you are on a different computer, you need to replace 127.0.0.1 by the ip address of the device running Soundsync.</li>
              <li>Get the debug information from <a href="http://127.0.0.1:6512/debuginfo">http://127.0.0.1:6512/debuginfo</a> (or the IP of the device on which Soundsync is running) and send them on the Discord channel to help debug this issue.</li>
            </ul>
          </>
          }/>
        <TroubleshootingStep
          title={`"Illegal Instructions" error on RaspberryPi`}
          content={
          <>
            <p>If you encounter the "Illegal instructions" error on a RaspberryPi, it likely means you are running Soundsync on a RaspberryPi 1 which is not supported. Because the processor architecture is quite old, multiple dependencies of Soundsync don't support this so Soundsync cannot run on RaspberryPi 1. This also include the RaspberryPi Model B and RaspberryPi Zero.</p>
          </>
          }/>
        <TroubleshootingStep
          title={`Impossible to stream audio to the web browser`}
          content={
          <>
            <p>If the "Web Page" output is not showing this means that either:</p>
            <ul>
              <li>Your web browser is not supporting WebAudio / AudioWorklet which is required for Soundsync to work. You can check which browser supports AudioWorklet <a href="https://caniuse.com/mdn-api_audioworklet">here</a>.</li>
              <li>You are accessing the controller from the direct ip (http://127.0.0.1:6512/controller) which is not supported because AudioWorklets can only be ran on a HTTPS page. In this case, use <a href="https://soundsync.app/controller">https://soundsync.app/controller</a>.</li>
            </ul>
          </>
          }/>
        <TroubleshootingStep
          title={`Other issue`}
          content={
          <>
            <p>If you encounter another problem, please join the <a href="https://discord.gg/j2BZ5KC">Discord server</a> and ask for help here.</p>
          </>
          }/>
      </MuiDialogContent>
    </Dialog>
  );
};
