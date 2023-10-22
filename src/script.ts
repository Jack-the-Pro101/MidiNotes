// @ts-ignore
import * as midiParser from "midi-parser-js";
import fs from "fs/promises";
import { MidiFile, MidiTrackEvent, Note, WorkingTrack } from "types";
import { MIDI_NUMBER_NOTE_MAPPINGS } from "./constants";

main();

async function main() {
  const data = await fs.readFile("./test_files/Aria Math.mid", {
    encoding: "base64",
  });

  const midiData = midiParser.parse(data) as MidiFile;

  const lengthTrackMap: { [key: number]: number } = {};
  const maxTrackLength = Math.max(
    ...midiData.track.map((track, i) => {
      const size = track.event.length;

      lengthTrackMap[size] = i;

      return size;
    })
  );

  const trackCount = midiData.track.length;

  const ppq = midiData.timeDivision;
  let bpm = 120;
  let tempo = 500000;
  let useNoteOff = false;

  const workingTracks: WorkingTrack[] = [];

  function handleMetaEvent(event: MidiTrackEvent) {
    switch (event!.metaType) {
      case 81: {
        bpm = Math.round(60000000 / (event.data as number));
        tempo = event.data as number;

        break;
      }
    }
  }

  // Begin pass 1, gather data
  for (let i = 0; i < trackCount; i++) {
    const track = midiData.track[i];

    let totalNotes = 0;
    let initialized = false;
    let channel: null | number = null;

    for (const event of track.event) {
      if (event.channel != null) channel = event.channel;

      if (event.type === 9) totalNotes += 1;
      if (!useNoteOff && event.type === 8) useNoteOff = true;
      if (!initialized && event.type === 255) {
        initialized = true;
        handleMetaEvent(event);
      }
    }

    if (useNoteOff) totalNotes /= 2;

    workingTracks.push({
      trackIndex: i,
      channel,
      currentBeats: 0,
      currentNote: null,
      currentμs: 0,
      totalNotes,
      workingChords: new Map(),
      notes: [],
    });
  }

  // Begin pass 2, analyze data
  for (let i = 0; i < maxTrackLength; i++) {
    for (let j = 0; j < trackCount; j++) {
      const track = midiData.track[j];
      const event = track.event[i];
      const workingTrack = workingTracks[j];

      if (event == null) continue;

      if (event.deltaTime > 0) {
        const deltaBeats = event.deltaTime / ppq;

        workingTrack.currentμs += deltaBeats * tempo;
        workingTrack.currentBeats += deltaBeats;
      }

      function endCurrentNote() {
        workingTrack.notes.push({
          midiNumber: workingTrack.currentNote!.midiNumber,
          noteName: workingTrack.currentNote!.noteName,
          startBeats: workingTrack.currentNote!.startBeats,
          durationBeats: (workingTrack.currentBeats - workingTrack.currentNote!.startBeats) * 12,
          endBeats: workingTrack.currentBeats,
        });

        workingTrack.currentNote = null;
      }

      switch (event.type) {
        case 8: {
          const data = event.data as number[];
          const note = data[0];

          endCurrentNote();

          break;
        }

        case 9: {
          const data = event.data as number[];

          const note = data[0];
          const volume = data[1];

          if (!useNoteOff && workingTrack.currentNote != null && volume === 0) {
            endCurrentNote();

            continue;
          }

          // const nextEvent = track.event[j + 1];

          workingTrack.currentNote = {
            midiNumber: note,
            noteName: MIDI_NUMBER_NOTE_MAPPINGS[note],
            startBeats: workingTrack.currentBeats,
          };

          break;
        }

        case 255: {
          handleMetaEvent(event);
        }
      }
    }
  }

  console.log(workingTracks[2].notes.map((note) => `"${note.noteName}:${note.durationBeats}"`).join(", "));
}
