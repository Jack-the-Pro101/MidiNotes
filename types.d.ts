export interface MidiFile {
  formatType: 0 | 1 | 2; // Midi format type
  timeDivision: number; // Tempo bpm
  tracks: number; // Total tracks count
  track: MidiTrack[];
}

export interface MidiTrack {
  event: MidiTrackEvent[];
}

export interface MidiTrackEvent {
  data: string | number | number[];
  deltaTime: number;
  channel?: number;
  metaType?: number;
  type: number;
}

export interface ParsedTrack {
  totalNotes: number;
  channel: number | null;
  trackIndex: number;
  notes: Note[];
}

export interface WorkingTrack extends ParsedTrack {
  currentNote: number;
  workingNotes: Map<number, Note>;
  chords: Map<number, Note>;
}

export interface Note {
  midiNumber: number;
  noteName: string;
  startBeats: number;
  endBeats?: number;
  durationBeats?: number;
}
