// @ts-ignore
import * as midiParser from "midi-parser-js";
import fs from "fs/promises";
import { MidiFile, MidiTrackEvent } from "types";
import { MIDI_NUMBER_NOTE_MAPPINGS } from "./constants";

fs.readFile("./test_files/Aria Math.mid", {
  encoding: "base64",
}).then((data) => {
  const midiData = midiParser.parse(data) as MidiFile;

  const maxTrackLength = Math.max(
    ...midiData.track.map((track) => track.event.length)
  );

  const notes: string[] = [];

  const ppq = midiData.timeDivision;
  let bpm = 120;
  let tempo = 500000;
  let seconds = 0;

  let microseconds = 0;

  // console.log(
  //   midiData.track[1].event
  //     .filter((e) => e.type === 9)
  //     .sort((a, b) => a.deltaTime - b.deltaTime)
  //     .slice(0, 32)
  //     .map((e) => MIDI_NUMBER_NOTE_MAPPINGS[(e.data as number[])[0]])
  // );

  for (let i = 0; i < 50; i++) {
    let prominentEvent: MidiTrackEvent | null = null;

    for (const track of midiData.track) {
      const event = track.event[i];

      if (event == null) continue;

      if (event.channel === 1) console.log(event);

      switch (event.type) {
        case 8:
        case 9: {
          if (event.channel === 1)
            notes.push(
              `"${MIDI_NUMBER_NOTE_MAPPINGS[(event.data as number[])[0]]}:2"`
            );
          // prominentEvent = prominentEvent != null ? ((event.data[0] as number) > (prominentEvent.data[0] as number) ? event : prominentEvent) : event;
        }

        case 255: {
          switch (event!.metaType) {
            case 81: {
              bpm = Math.round(60000000 / (event.data as number));
              tempo = event.data as number;
            }
          }
        }
      }

      if (event.channel === 0) microseconds += (event.deltaTime / ppq) * tempo;
    }

    // if (prominentEvent != null) notes.push(`"${MIDI_NUMBER_NOTE_MAPPINGS[prominentEvent!.data[0] as number]}:2"`);
  }

  console.log(notes.join(", "));
  console.log(microseconds / 1000000);
  // console.log(notes.join(", "));
});
