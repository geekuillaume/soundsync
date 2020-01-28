import React from "react";
import ReactDOM from "react-dom";
import {App} from "./components/app";
import 'bulma';
import './styles.scss';
import 'typeface-roboto';

var mountNode = document.getElementById("app");
ReactDOM.render(<App />, mountNode);
