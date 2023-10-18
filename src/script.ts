// @ts-ignore
import * as midiParser from "midi-parser-js";
import fs from "fs/promises";
import { MidiFile, MidiTrackEvent, Note, WorkingTrack } from "types";
import { MIDI_NUMBER_NOTE_MAPPINGS } from "./constants";

fs.readFile("./test_files/risen.mid", {
  encoding: "base64",
}).then((data) => {
  const midiData = midiParser.parse(data) as MidiFile;

  const lengthTrackMap: { [key: number]: number } = {};
  const maxTrackLength = Math.max(
    ...midiData.track.map((track, i) => {
      const size = track.event.length;

      lengthTrackMap[size] = i;

      return size;
    })
  );
  const largestTrackIndex = lengthTrackMap[maxTrackLength];

  const ppq = midiData.timeDivision;
  let bpm = 120;
  let tempo = 500000;
  let beats = 0;
  let microseconds = 0;
  let useNoteOff = false;

  const tracks: WorkingTrack[] = [];

  // Begin pass 1, gather data
  for (let i = 0; i < midiData.track.length; i++) {
    const track = midiData.track[i];

    let totalNotes = 0;
    let channel: null | number = null;

    for (const event of track.event) {
      if (event.channel) channel = event.channel;

      if (event.type === 9) totalNotes += 1;
      if (event.type === 8) useNoteOff = true;
    }

    if (useNoteOff) totalNotes /= 2;

    tracks.push({
      trackIndex: i,
      channel,
      chords: new Map(),
      currentNote: 0,
      workingNotes: new Map(),
      notes: new Array(totalNotes),
      totalNotes,
    });
  }

  // Begin pass 2, analyze data
  for (let i = 0; i < maxTrackLength; i++) {
    for (let j = 0; j < midiData.track.length; j++) {
      const track = midiData.track[j];
      const event = track.event[i];

      if (event == null) continue;

      beats +=
        Math.round(
          (1 / Math.round(ppq / event.deltaTime) + Number.EPSILON) * 10
        ) / 10;

      function endNote(midiNote: number) {
        tracks[j].workingNotes.get(midiNote);
      }

      switch (event.type) {
        case 8: {
          const data = event.data as number[];
          const note = data[0];

          endNote(note);

          break;
        }

        case 9: {
          const data = event.data as number[];

          const note = data[0];
          const volume = data[1];

          if (!useNoteOff && volume === 0) {
            endNote(note);

            continue;
          }

          // const nextEvent = track.event[j + 1];

          tracks[j].workingNotes.set(note, {
            midiNumber: note,
            noteName: MIDI_NUMBER_NOTE_MAPPINGS[note],
            startBeats: beats,
          });

          break;
        }

        case 255: {
          switch (event!.metaType) {
            case 81: {
              bpm = Math.round(60000000 / (event.data as number));
              tempo = event.data as number;

              break;
            }
          }
        }
      }

      if (j === largestTrackIndex)
        microseconds += (event.deltaTime / ppq) * tempo;
    }
  }

  console.log(microseconds / 1000000);
});
