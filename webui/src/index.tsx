import React from 'react';
import * as Sentry from '@sentry/browser';
import ReactDOM from 'react-dom';
import { App } from './components/app';
import 'bulma';
import './styles.scss';
import 'typeface-roboto';

Sentry.init({ dsn: 'https://01d9c8f4220e4107992cfc3599c2f8e1@o403236.ingest.sentry.io/5265532' });

const mountNode = document.getElementById('app');
ReactDOM.render(<App />, mountNode);
