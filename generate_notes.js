// const notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

// let step = 0;
// let iteration = -3;
// let note = 0;

const LETTERS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MIN_MIDI_INDEX = 12;

function midiIndexToNote(i) {
  return `${LETTERS[(i - MIN_MIDI_INDEX) % LETTERS.length]}${Math.floor((i - MIN_MIDI_INDEX) / LETTERS.length)}`;
}

for (let i = MIN_MIDI_INDEX; i <= 127; i++) {
  // if (iteration % 12 === 0) step += 1;
  // if (note + 1 > notes.length) note = 0;

  // console.log(`${i}: "${notes[note]}${step}"`);
  console.log(`${i}: "${midiIndexToNote(i)}"`);

  // note += 1;
  // iteration += 1;
}
