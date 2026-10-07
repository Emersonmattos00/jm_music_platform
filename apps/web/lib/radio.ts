import { api, RadioAccess, Track } from './api';

export type { RadioAccess };

export async function fetchRadioTracks(limit = 300): Promise<Track[]> {
  return api.radioTracks(limit);
}

export async function fetchRadioAccess(): Promise<RadioAccess> {
  return api.radioAccess();
}