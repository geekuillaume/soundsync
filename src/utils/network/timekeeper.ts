import { TypedEmitter } from 'tiny-typed-emitter';
import { now } from '../misc';
import { NumericStatsTracker } from '../basicNumericStatsTracker';

const TIME_DELTAS_TO_KEEP = 100;
const TIMEKEEPER_REFRESH_INTERVAL = 300;
// if there is less than this diff between the newly computed time delta and the saved time delta, update it and emit a event
// this is used to not reupdate the sound sinks for every small difference in the timedelta but only if there is too much diff
const MS_DIFF_TO_UPDATE_TIME_DELTA = 5;
// we use multiple time requests when starting the connection to prevent having a incorrect value from a network problem at this specific moment
const TIMESYNC_INIT_REQUEST_COUNT = 10;

interface TimekeeperEvents {
  'requestNeeded': (request: TimekeeperRequest) => void;
  'deltaUpdated': (delta: number, previousDelta: number) => void;
}

export interface TimekeeperRequest {
  sentAt: number;
}

export interface TimekeeperResponse {
  sentAt: number;
  respondedAt: number;
}

interface TimekeeperComputedMeasure {
  delta: number;
  roundtripTime: number;
}

export class Timekeeper extends TypedEmitter<TimekeeperEvents> {
  private measures = new NumericStatsTracker<TimekeeperComputedMeasure>((measure) => measure.delta, TIME_DELTAS_TO_KEEP);
  private refreshInterval: NodeJS.Timeout;

  public delta = 0;
  public rawDelta = 0;

  constructor() {
    super();
  }

  start() {
    this.refreshInterval = setInterval(() => {
      this.emit('requestNeeded', {
        sentAt: now(),
      });
    }, TIMEKEEPER_REFRESH_INTERVAL);
  }
  destroy() {
    clearInterval(this.refreshInterval);
  }

  flush() {
    this.measures.flush();
  }

  isSynchronized() {
    return this.measures.full(TIMESYNC_INIT_REQUEST_COUNT);
  }

  handleResponse(measure: TimekeeperResponse) {
    const receivedAt = now();
    const roundtripTime = receivedAt - measure.sentAt;
    const receivedByPeerAt = measure.sentAt + (roundtripTime / 2);
    const delta = measure.respondedAt - receivedByPeerAt;

    this.measures.push({
      delta,
      roundtripTime,
    });
    this.rawDelta = this.getRawDelta();
    if (Math.abs(this.rawDelta - this.delta) > MS_DIFF_TO_UPDATE_TIME_DELTA) {
      const previousDelta = this.delta;
      this.delta = this.rawDelta;
      this.emit('deltaUpdated', this.delta, previousDelta);
    }
  }

  private getRawDelta() {
    const { mean, standardDeviation } = this.measures.standardDeviation(undefined, (measure) => measure.roundtripTime);
    return this.measures.mean(undefined, undefined, (measure) => Math.abs(mean - measure.roundtripTime) < standardDeviation);
  }
}
