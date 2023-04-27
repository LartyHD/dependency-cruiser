import chalk from "chalk";
import busLogLevels from "../../../utl/bus-log-levels.mjs";
import { getHeader, getProgressLine, getEndText } from "./handlers.mjs";

let gUnderline = false;

function getHeaderWriter(pStream, pMaxLevel) {
  return (_pMessage, pOptions) => {
    const lOptions = { level: busLogLevels.SUMMARY, ...(pOptions || {}) };

    pStream.write(getHeader(lOptions.level, pMaxLevel));
  };
}

function getProgressWriter(pStream, pState, pMaxLevel) {
  return (pMessage, pOptions) => {
    const lOptions = { level: busLogLevels.SUMMARY, ...(pOptions || {}) };
    const lProgressLine = getProgressLine(
      pMessage,
      pState,
      lOptions.level,
      pMaxLevel
    );
    pStream.write(
      gUnderline ? `${chalk.underline(lProgressLine)}` : lProgressLine
    );
    gUnderline = !gUnderline;
  };
}

function getEndWriter(pStream, pState, pMaxLevel) {
  return (_pMessage, pLevel = busLogLevels.SUMMARY) => {
    pStream.write(getEndText(pState, pLevel, pMaxLevel));
    pStream.end();
  };
}

export default function setUpPerformanceLogListener(
  pEventEmitter,
  pMaxLevel = busLogLevels.INFO,
  pStream = process.stderr
) {
  let lState = {
    previousMessage: "start of node process",
    previousTime: 0,
    previousUserUsage: 0,
    previousSystemUsage: 0,
    previousRss: 0,
    previousHeapTotal: 0,
    previousHeapUsed: 0,
    previousExternal: 0,
  };

  pEventEmitter.on("start", getHeaderWriter(pStream, pMaxLevel));

  pEventEmitter.on("progress", getProgressWriter(pStream, lState, pMaxLevel));

  pEventEmitter.on("end", getEndWriter(pStream, lState, pMaxLevel));
}