import React, { useState, useRef, useEffect } from 'react';
import classnames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';

import { setupCanvas } from 'components/utils/canvas';
import { Tooltip } from '@material-ui/core';
import PhilipsHueIcon from 'res/huebulb.svg';
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

const ROWS = 3 * 2 * 5;
const COLUMNS = 3;
const AUDIO_OBJECTS_ID = [
  'smartphone',
  'vinyl',
  'spotify',
  'airplay',
  'linein',
  'rpi',
  'laptopin',
  'chromecast',
  'airplayout',
  'laptopout',
  'browser',
  'hue',
  'jack',
  'bluetooth',
];

const useStyles = makeStyles((t) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
    overflow: 'hidden',
    padding: '0 30px',
    contain: 'layout style paint',
  },
  container: {
    width: t.breakpoints.values.md,
    maxWidth: '100%',
    position: 'relative',
  },
  title: {
    color: '#0060dd',
    fontSize: '1.6rem',
    fontFamily: '\'Sora\', sans-serif',
    marginBottom: 20,
  },
  innerContainer: {
    display: 'grid',
    gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
    gridTemplateRows: `repeat(${ROWS}, [col-start] 1fr)`,
    position: 'relative',
  },
  audioObject: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
    transition: '500ms opacity ease',
    marginTop: 20,
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  audioObjectActive: {
    opacity: 1,
  },
  audioObjectIcon: {
    width: 70,
    height: 70,
    [t.breakpoints.down('sm')]: {
      width: 50,
      height: 50,
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
      fontSize: '0.8em',
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
    pointerEvents: 'none',
  },
  audioObjectTooltip: {
    maxWidth: 200,
    fontSize: '0.9em',
    fontWeight: 'normal',
  },
}));

const AudioObject = ({
  name, description = null, icon, column, row, inRowCount, rowSpan = 1, id, refCollection, isActiveGetter,
}) => {
  const classes = useStyles();
  const isActive = isActiveGetter(id);

  const content = (
    <div>
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
  return (
    <div className={classnames(classes.audioObject, { [classes.audioObjectActive]: isActive })} style={{ gridColumn: column, gridRow: `col-start ${1 + (row * (ROWS / inRowCount))} / span ${rowSpan * (ROWS / inRowCount)}` }}>
      {description ? (
        <Tooltip enterTouchDelay={50} classes={{ tooltip: classes.audioObjectTooltip }} title={description} arrow>
          {content}
        </Tooltip>
      ) : content}
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

  const lastDrawnPipes = useRef({
    opacity: 1, currentPipes, currentElementsBoundingBoxes: [], canvasBoundingBox: null,
  });

  const updateBoundingBoxes = () => {
    lastDrawnPipes.current.canvasBoundingBox = canvasRef.current.getBoundingClientRect();
    AUDIO_OBJECTS_ID.forEach((id) => {
      if (audioObjectRefs.current[id]) {
        lastDrawnPipes.current.currentElementsBoundingBoxes[id] = audioObjectRefs.current[id].getBoundingClientRect();
      }
    });
  };

  useEffect(() => {
    const initCanvas = () => {
      updateBoundingBoxes();
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
        const canvasBoundingRect = lastDrawnPipes.current.canvasBoundingBox;
        const pipes = lastDrawnPipes.current.currentPipes.map((pipe) => {
          const from = audioObjectRefs.current[pipe[0]];
          const to = audioObjectRefs.current[pipe[1]];
          if (!from || !to) {
            return null;
          }
          if (!lastDrawnPipes.current.currentElementsBoundingBoxes[pipe[0]] || !lastDrawnPipes.current.currentElementsBoundingBoxes[pipe[1]]) {
            if (from && to) {
              updateBoundingBoxes();
            } else {
              return null;
            }
          }
          const fromBounding = lastDrawnPipes.current.currentElementsBoundingBoxes[pipe[0]];
          const toBounding = lastDrawnPipes.current.currentElementsBoundingBoxes[pipe[1]];
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
    ['laptopin', 'hue'],
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
    ['laptopin', 'hue'],
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
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const audioObjectIsActive = (id: string) => !!PIPES_CONFIGURATIONS[currentPipeConfiguration].find((conf) => conf.includes(id));

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <p className={classes.title}>Connect any audio source to any audio output:</p>
        <div className={classes.innerContainer}>
          <PipesCanvas currentPipes={PIPES_CONFIGURATIONS[currentPipeConfiguration]} className={classes.pipeCanvas} audioObjectRefs={audioObjectRefs} />

          {/* <AudioObject
            name="Smartphone"
            icon={SmartphoneIcon}
            description="Smartphone"
            column={1}
            row={0}
            inRowCount={3}
            rowSpan={2}
            id="smartphone"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Vinyl Player"
            icon={RecorderPlayerIcon}
            description="Use a old vinyl player or any device that can be plugged to an audio line-in input"
            column={1}
            row={2}
            inRowCount={3}
            id="vinyl"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          /> */}

          <AudioObject
            name="Spotify Connect"
            icon={SpotifyIcon}
            description="Select Soundsync in the list of devices on the Spotify App when connected to the same wifi and use it with all the speakers in your home"
            column={1}
            row={0}
            inRowCount={3}
            id="spotify"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Airplay"
            icon={AirplayIcon}
            description="Select Soundsync on the Airplay devices list on your iPhone or Macbook to broadcast the audio in your home"
            column={1}
            row={1}
            inRowCount={3}
            id="airplay"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Line-in"
            icon={LineInIcon}
            description="Use a old vinyl player or any device that can be plugged to your computer line-in input with Soundsync"
            column={1}
            row={2}
            inRowCount={3}
            id="linein"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />

          <AudioObject
            name="RaspberryPi"
            icon={RaspberryPiIcon}
            description="Install Soundsync on your RaspberryPi and connect it to a speaker with the jack output"
            column={2}
            row={0}
            inRowCount={3}
            id="rpi"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Laptop"
            icon={LaptopIcon}
            description="Install Soundsync on your Windows, MacOS or Linux computer to capture its audio inputs and use it with every speakers in your home"
            column={2}
            row={1}
            inRowCount={3}
            rowSpan={2}
            id="laptopin"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />

          <AudioObject
            name="Chromecast"
            icon={ChromecastIcon}
            description="Soundsync detects every Chromecast on your wifi network and let you listen to your music anywhere in your home"
            column={3}
            row={0}
            inRowCount={5}
            id="chromecast"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Airplay Speaker"
            icon={AirplaySpeakerIcon}
            description="Soundsync detects every Airplay speaker on your wifi network and let you listen to your music anywhere in your home"
            column={3}
            row={1}
            inRowCount={5}
            id="airplayout"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Laptop"
            icon={LaptopIcon}
            description="Install Soundsync on your Windows, MacOS or Linux computer to use its audio output with a classic jack speaker or any audio output"
            column={3}
            row={2}
            inRowCount={5}
            id="laptopout"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Smartphone"
            icon={SmartphoneIcon}
            description="Open soundsync.app on your smartphone when connected to the same Wifi network and use it as an audio output"
            column={3}
            row={3}
            inRowCount={5}
            id="browser"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Philips Hue"
            icon={PhilipsHueIcon}
            description="Use Soundsync to light up your Philips Hue lights in rythm with your music"
            column={3}
            row={4}
            inRowCount={5}
            id="hue"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />

          {/* <AudioObject
            name="Audio Jack"
            icon={SpeakerJackIcon}
            description="Jack"
            column={4}
            row={2}
            inRowCount={4}
            id="jack"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          />
          <AudioObject
            name="Bluetooth Speaker"
            icon={SpeakerIcon}
            description="Bluetooth Speaker"
            column={4}
            row={3}
            inRowCount={4}
            id="bluetooth"
            refCollection={audioObjectRefs}
            isActiveGetter={audioObjectIsActive}
          /> */}
        </div>
      </div>
    </div>
  );
};
