import React, { useState, useRef, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { setupCanvas } from 'components/utils/canvas';
import SpotifyIcon from './icons/spotify.svg';
import AirplayIcon from './icons/airplay.svg';
// import BlutoothIcon from './icons/blutooth.svg';
import BrowserIcon from './icons/browser.svg';
// import JackConnectorIcon from './icons/jack-connector.svg';
import LaptopIcon from './icons/laptop.svg';
import LineInIcon from './icons/line-in.svg';
import SmartphoneIcon from './icons/smartphone.svg';
import SpeakerIcon from './icons/speaker.svg';
import ChromecastIcon from './icons/chromecast.svg';
import RecorderPlayerIcon from './icons/recorder-player.svg';
import RaspberryPiIcon from './icons/raspberrypi.svg';
import AirplaySpeakerIcon from './icons/airplay-speaker.svg';
import SpeakerJackIcon from './icons/speaker-jack.svg';

const useStyles = makeStyles((t) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 150,
    overflow: 'hidden',
  },
  container: {
    width: t.breakpoints.values.md,
    maxWidth: '100%',
    position: 'relative',
  },
  innerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(12, [col-start] 1fr)',
  },
  ratioPadder: {
    paddingTop: '60%',
  },
  audioObject: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioObjectIcon: {
    width: 70,
    height: 70,
    [t.breakpoints.down('sm')]: {
      width: 30,
      height: 30,
    },
  },
  audioObjectName: {
    backgroundColor: '#cccccc',
    boxShadow: '0 5px 50px -12px rgba(0, 0, 0, 0.25)',
    borderRadius: '100px',
    padding: '3px 10px',
    // right: -10,
    // top: -10,
    position: 'relative',
    zIndex: 2,
    fontSize: '0.8em',
    textAlign: 'center',
    [t.breakpoints.down('sm')]: {
      fontSize: '0.6em',
    },
  },
  pipeCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
}));

const AudioObject = ({
  name, description, icon, column, row, inRowCount, rowSpan = 1, id, refCollection,
}) => {
  const classes = useStyles();

  return (
    <div className={classes.audioObject} style={{ gridColumn: column, gridRow: `col-start ${1 + (row * (12 / inRowCount))} / span ${rowSpan * (12 / inRowCount)}` }}>
      <img
        src={icon}
        className={classes.audioObjectIcon}
      />
      <p
        className={classes.audioObjectName}
        ref={(r) => {
          refCollection.current[id] = r;
        }}
      >
        {name}

      </p>
    </div>
  );
};

const PipesCanvas = ({
  currentPipes, className, audioObjectRefs,
}: {currentPipes: string[][]; className: string; audioObjectRefs: any}) => {
  const canvasRef = useRef<HTMLCanvasElement>();
  const ctxRef = useRef<CanvasRenderingContext2D>();
  const offsetRef = useRef(0);
  const lastDrawTimeRef = useRef(performance.now());
  const opacityRef = useRef(1);

  const lastDrawnPipes = useRef({ opacity: 1, currentPipes });

  useEffect(() => {
    const initCanvas = () => {
      if (!canvasRef.current) {
        requestAnimationFrame(initCanvas);
        return;
      }
      ctxRef.current = setupCanvas(canvasRef.current);
    };
    window.addEventListener('resize', initCanvas);
    initCanvas();
    return () => {
      window.removeEventListener('resize', initCanvas);
    };
  }, []);

  useEffect(() => {
    let animationFrameRequest;
    const draw = () => {
      if (lastDrawnPipes.current.currentPipes !== currentPipes) {
        opacityRef.current -= (performance.now() - lastDrawTimeRef.current) / 500;
        if (opacityRef.current <= 0) {
          lastDrawnPipes.current.currentPipes = currentPipes;
        }
      } else if (opacityRef.current < 1) {
        opacityRef.current = Math.min(1, opacityRef.current + ((performance.now() - lastDrawTimeRef.current) / 500));
      }
      if (ctxRef.current && canvasRef.current) {
        const canvasBoundingRect = canvasRef.current.getBoundingClientRect();
        const pipes = lastDrawnPipes.current.currentPipes.map((pipe) => {
          const from = audioObjectRefs.current[pipe[0]];
          const to = audioObjectRefs.current[pipe[1]];
          if (!from || !to) {
            return null;
          }
          const fromBounding = from.getBoundingClientRect();
          const toBounding = to.getBoundingClientRect();
          return {
            x1: fromBounding.right - canvasBoundingRect.left - 10,
            y1: fromBounding.top + (fromBounding.height / 2) - canvasBoundingRect.top,
            x2: toBounding.left - canvasBoundingRect.left + 10,
            y2: toBounding.top + (toBounding.height / 2) - canvasBoundingRect.top,
          };
        }).filter(Boolean);
        const ctx = ctxRef.current;
        const dpr = window.devicePixelRatio || 1;
        const height = canvasRef.current.height / dpr;
        const width = canvasRef.current.width / dpr;
        ctx.clearRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = `rgba(0, 96, 221, ${0.5 * opacityRef.current})`;
        ctx.setLineDash([5, 10]);
        offsetRef.current++;
        if (offsetRef.current > 300) {
          offsetRef.current = 0;
        }
        ctx.lineDashOffset = -offsetRef.current * 0.3;
        pipes.forEach((pipe) => {
          ctx.beginPath();
          ctx.moveTo(pipe.x1, pipe.y1);
          ctx.lineTo(pipe.x2, pipe.y2);
          ctx.stroke();
        });
      }
      lastDrawTimeRef.current = performance.now();
      animationFrameRequest = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (animationFrameRequest) {
        cancelAnimationFrame(animationFrameRequest);
      }
    };
  }, [currentPipes]);

  return <canvas className={className} ref={canvasRef} />;
};

const PIPES_CONFIGURATIONS = [
  [
    ['smartphone', 'airplay'],
    ['airplay', 'laptopin'],
    ['laptopin', 'chromecast'],
    ['laptopin', 'browser'],
    ['browser', 'bluetooth'],
  ],
  [
    ['vinyl', 'linein'],
    ['linein', 'laptopin'],
    ['laptopin', 'airplayout'],
    ['laptopin', 'laptopout'],
    ['laptopout', 'jack'],
    ['smartphone', 'spotify'],
    ['spotify', 'rpi'],
    ['rpi', 'chromecast'],
    ['laptopin', 'browser'],
    ['browser', 'bluetooth'],
  ],
  [
    ['smartphone', 'spotify'],
    ['spotify', 'rpi'],
    ['rpi', 'airplayout'],
    ['rpi', 'browser'],
    ['browser', 'bluetooth'],
  ],
];

export const LandingCompatibility = () => {
  const classes = useStyles();
  const audioObjectRefs = useRef<any>({});
  const [currentPipeConfiguration, setCurrentPipeConfiguration] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPipeConfiguration((current) => (current + 1) % PIPES_CONFIGURATIONS.length);
    }, 4000);
    return () => {
      clearInterval(interval);
    };
  });

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <div className={classes.ratioPadder} />
        <div className={classes.innerContainer}>
          <PipesCanvas currentPipes={PIPES_CONFIGURATIONS[currentPipeConfiguration]} className={classes.pipeCanvas} audioObjectRefs={audioObjectRefs} />

          <AudioObject name="Smartphone" icon={SmartphoneIcon} description="Smartphone" column={1} row={0} inRowCount={3} rowSpan={2} id="smartphone" refCollection={audioObjectRefs} />
          <AudioObject name="Vinyl Player" icon={RecorderPlayerIcon} description="Line-In" column={1} row={2} inRowCount={3} id="vinyl" refCollection={audioObjectRefs} />

          <AudioObject name="Spotify" icon={SpotifyIcon} description="Spotify" column={2} row={0} inRowCount={3} id="spotify" refCollection={audioObjectRefs} />
          <AudioObject name="Airplay" icon={AirplayIcon} description="Airplay" column={2} row={1} inRowCount={3} id="airplay" refCollection={audioObjectRefs} />
          <AudioObject name="Line-in" icon={LineInIcon} description="Line-In" column={2} row={2} inRowCount={3} id="linein" refCollection={audioObjectRefs} />

          <AudioObject name="RaspberryPi" icon={RaspberryPiIcon} description="RaspberryPi" column={3} row={0} inRowCount={3} id="rpi" refCollection={audioObjectRefs} />
          <AudioObject name="Windows Laptop" icon={LaptopIcon} description="Laptop" column={3} row={1} inRowCount={3} rowSpan={2} id="laptopin" refCollection={audioObjectRefs} />

          <AudioObject name="Chromecast" icon={ChromecastIcon} description="Chromecast" column={4} row={0} inRowCount={4} id="chromecast" refCollection={audioObjectRefs} />
          <AudioObject name="Airplay Speaker" icon={AirplaySpeakerIcon} description="Airplay Speaker" column={4} row={1} inRowCount={4} id="airplayout" refCollection={audioObjectRefs} />
          <AudioObject name="MacOS Laptop" icon={LaptopIcon} description="Laptop" column={4} row={2} inRowCount={4} id="laptopout" refCollection={audioObjectRefs} />
          <AudioObject name="Browser" icon={BrowserIcon} description="Browser" column={4} row={3} inRowCount={4} id="browser" refCollection={audioObjectRefs} />

          <AudioObject name="Jack" icon={SpeakerJackIcon} description="Jack" column={5} row={2} inRowCount={4} id="jack" refCollection={audioObjectRefs} />
          <AudioObject name="Bluetooth Speaker" icon={SpeakerIcon} description="Bluetooth Speaker" column={5} row={3} inRowCount={4} id="bluetooth" refCollection={audioObjectRefs} />
        </div>
      </div>
    </div>
  );
};
