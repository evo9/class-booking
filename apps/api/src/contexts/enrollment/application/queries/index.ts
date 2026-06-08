export * from './list-available-sessions';
export * from './get-session-roster';

import { ListAvailableSessionsHandler } from './list-available-sessions';
import { GetSessionRosterHandler } from './get-session-roster';

export const QueryHandlers = [
  ListAvailableSessionsHandler,
  GetSessionRosterHandler,
];
