import { describe, it, expect } from 'vitest';
import { reduce, type SocketState } from './ws.service';

function init(overrides: Partial<SocketState> = {}): SocketState {
  return {
    state: 'idle',
    attempt: 0,
    videoId: null,
    videoName: null,
    reconnectTimer: null,
    socket: null,
    outgoing: [],
    cancelled: false,
    ...overrides,
  };
}

describe('ws.service reducer', () => {
  it('CONNECT → connecting', () => {
    const next = reduce(init(), { type: 'CONNECT' });
    expect(next.state).toBe('connecting');
    expect(next.socket).toBeNull();
    expect(next.cancelled).toBe(false);
  });

  it('OPEN sets videoId and resets attempt', () => {
    const next = reduce(init({ state: 'connecting', attempt: 3 }), {
      type: 'OPEN',
      videoId: 'abc-123',
    });
    expect(next.state).toBe('open');
    expect(next.videoId).toBe('abc-123');
    expect(next.attempt).toBe(0);
    expect(next.reconnectTimer).toBeNull();
  });

  it('SCHEDULE_RECONNECT increments attempt and sets state', () => {
    const next = reduce(init({ state: 'closed', attempt: 2 }), {
      type: 'SCHEDULE_RECONNECT',
    });
    expect(next.state).toBe('reconnecting');
    expect(next.attempt).toBe(3);
  });

  it('CANCEL_RECONNECT flags cancelled and goes to closed', () => {
    const next = reduce(init({ state: 'reconnecting' }), {
      type: 'CANCEL_RECONNECT',
    });
    expect(next.state).toBe('closed');
    expect(next.cancelled).toBe(true);
    expect(next.reconnectTimer).toBeNull();
  });

  it('CLOSE clears the socket and videoId but preserves cancelled', () => {
    const next = reduce(init({ state: 'open', videoId: 'xyz', cancelled: true }), {
      type: 'CLOSE',
      code: 1006,
      reason: 'lost',
    });
    expect(next.state).toBe('closed');
    expect(next.socket).toBeNull();
    expect(next.videoId).toBeNull();
    expect(next.cancelled).toBe(true);
  });

  it('RESET wipes to initial', () => {
    const next = reduce(
      init({ state: 'open', videoId: 'abc', attempt: 5, cancelled: true }),
      { type: 'RESET' },
    );
    expect(next.state).toBe('idle');
    expect(next.videoId).toBeNull();
    expect(next.attempt).toBe(0);
    expect(next.cancelled).toBe(false);
  });
});