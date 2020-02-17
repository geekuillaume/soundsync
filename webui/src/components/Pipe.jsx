import React, { useRef, useEffect } from 'react';
import { find } from 'lodash-es';
import { useSinks, useSources, useShowHidden } from '../utils/useSoundSyncState';
import { isHidden } from '../utils/hiddenUtils';

function setupCanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  const dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  const rect = canvas.parentElement.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx.scale(dpr, dpr);
  return ctx;
}

export const Pipe = ({ pipe }) => {
  const showHidden = useShowHidden();
  const sources = useSources();
  const sinks = useSinks();
  const sink = find(sinks, { uuid: pipe.sinkUuid });
  const source = find(sources, { uuid: pipe.sourceUuid });
  const sinkIndex = sinks.indexOf(sink);
  const sourceIndex = sources.indexOf(source);

  const rowStart = Math.min(sourceIndex, sinkIndex);
  const rowEnd = Math.max(sourceIndex, sinkIndex);

  const canvasRef = useRef();
  const ctxRef = useRef();

  let shouldShow = true;
  if (!sink || !source) {
    shouldShow = false;
  } else if (!showHidden && (isHidden(sink.name) || isHidden(source.name))) {
    shouldShow = false;
  }

  useEffect(() => {
    if (!shouldShow) {
      return;
    }
    const initCanvas = () => {
      if (!canvasRef.current) {
        requestAnimationFrame(initCanvas);
      }
      ctxRef.current = setupCanvas(canvasRef.current);
    };
    document.addEventListener('resize', initCanvas);
    initCanvas();
    return () => {
      document.removeEventListener('resize', initCanvas);
    };
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }
    let animationFrameRequest;
    let offset = 0;
    const draw = () => {
      if (ctxRef.current && canvasRef.current) {
        const ctx = ctxRef.current;
        const dpr = window.devicePixelRatio || 1;
        const height = canvasRef.current.height / dpr;
        const width = canvasRef.current.width / dpr;
        ctx.clearRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(0, 209, 178, 0.5)';
        ctx.setLineDash([5, 10]);
        offset++;
        if (offset > 300) {
          offset = 0;
        }
        ctx.lineDashOffset = -offset * 0.3;

        ctx.beginPath();
        ctx.moveTo(10, ((sourceIndex - rowStart) * 130) + 50);
        ctx.lineTo(width - 10, ((sinkIndex - rowStart) * 130) + 50);
        ctx.stroke();
      }
      animationFrameRequest = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (animationFrameRequest) {
        cancelAnimationFrame(animationFrameRequest);
      }
    };
  }, [shouldShow]);

  return shouldShow && (
    <div
      className="pipe"
      style={{
        gridRowStart: rowStart + 2,
        gridRowEnd: rowEnd + 3,
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};
