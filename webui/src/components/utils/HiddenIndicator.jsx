import React from 'react';
import classnames from 'classnames';
import { makeStyles } from '@material-ui/core';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

const useStyles = makeStyles(() => ({
  root: {
    position: 'absolute',
    top: 5,
    opacity: 0.3,
  },
  right: {
    right: 8,
  },
  left: {
    left: 8,
  },
}));

export const HiddenIndicator = ({ position = 'right' }) => {
  const classes = useStyles();
  return (
    <VisibilityOffIcon className={classnames(classes.root, {
      [classes.right]: position === 'right',
      [classes.left]: position === 'left',
    })}
    />
  );
};
