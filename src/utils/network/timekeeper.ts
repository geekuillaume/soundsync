import { TypedEmitter } from 'tiny-typed-emitter';
import { now } from '../misc';
import { NumericStatsTracker } from '../basicNumericStatsTracker';

const TIMEKEEPER_REFRESH_INTERVAL = 300;
const TIME_DELTAS_HISTORY_DURATION = 2 * 60 * 1000;
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
  private measures = new NumericStatsTracker<TimekeeperComputedMeasure>((measure) => measure.delta, TIME_DELTAS_HISTORY_DURATION / TIMEKEEPER_REFRESH_INTERVAL);
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
    // We use the roundtripTime as the standard deviation filter because a incorrect latency means that the network
    // was choppy during the measure or that one of the peer was too busy with something else to respond quickly or
    // to treat the incoming message quickly, this means that the measure is probably of poor quality
    this.rawDelta = this.measures.meanInStandardDeviation({
      deviationGetter: (m) => m.roundtripTime,
    });
    if (Math.abs(this.rawDelta - this.delta) > MS_DIFF_TO_UPDATE_TIME_DELTA) {
      const previousDelta = this.delta;
      this.delta = this.rawDelta;
      this.emit('deltaUpdated', this.delta, previousDelta);
    }
  }
}
