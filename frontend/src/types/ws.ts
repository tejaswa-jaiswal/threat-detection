/**
 * WebSocket protocol types.
 *
 * See backend `api/ws.py` for the matching server-side contract.
 */

import type { Detection } from './domain';

/** Client → server text */
export interface StartMessage {
  type: 'start';
  video_name: string;
}

/** Server → client text */
export interface StartedMessage {
  type: 'started';
  video_id: string;
}

export interface ServerErrorMessage {
  type: 'error';
  detail: string;
}

export type ServerTextMessage = StartedMessage | ServerErrorMessage;

/** Live detection derived from a server frame.
 *  Note: the server only sends binary JPEGs back. The client infers detections
 *  from the most-recent inference by polling, or — for richer UX — the server
 *  could be extended to also emit a JSON detection envelope alongside each
 *  binary frame. We model the optional envelope here for forward compatibility.
 */
export interface DetectionEnvelope {
  type: 'detections';
  video_id: string;
  detections: Pick<Detection, 'threat_type' | 'confidence'>[];
}

export type ServerMessage = ServerTextMessage | DetectionEnvelope;

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed';

export interface FrameStats {
  framesSent: number;
  framesReceived: number;
  fpsIn: number;
  fpsOut: number;
}