import React from 'react';
import classnames from 'classnames';
import { makeStyles } from '@material-ui/core';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import Tooltip from '@material-ui/core/Tooltip';

const useStyles = makeStyles(() => ({
  root: {
    position: 'absolute',
    bottom: 5,
    color: '#f01111',
    left: 5,
  },
}));

export const AudioErrorIndicator = ({ error }) => {
  const classes = useStyles();
  return (
    <Tooltip title={error}>
      <ErrorOutlineIcon className={classnames(classes.root)} />
    </Tooltip>
  );
};
