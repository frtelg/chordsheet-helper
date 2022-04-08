import { noteOf } from "./../Enums/Note";
import Note from "../Enums/Note";

const majorChordRegex = "[A-G][b#♭]?";
const chordRegex = `(${majorChordRegex}(maj|m)?[2-9]?(sus|add|dim)?([1-9][0-9]?)?(/[A-G][#b])?)`;
const chordLineRegex = `^((\\W+)?(${chordRegex})(\\W+)?)+$`;

const mod = (target: number, mod: number) => ((target % mod) + mod) % mod;

export const isChordsOnly = (s: string) =>
  s.match(new RegExp(chordLineRegex, "g"));

export const transpose = (
  textContainingChords: string,
  transposeSteps: number
) => {
  return textContainingChords.replace(new RegExp(chordRegex, "g"), (match) => {
    return match.replace(new RegExp(majorChordRegex, "g"), (m) =>
      transposeTone(toNote(m), transposeSteps)
    );
  });
};

const toNote = (s: string) => {
  const isFlatOrSharp = s.length > 1;

  if (isFlatOrSharp) {
    const isSharp = s.endsWith("#");
    const firstChar = s.substring(0, 1);

    return transposeTone(noteOf(firstChar), isSharp ? 1 : -1);
  }

  return noteOf(s);
};

export const transposeTone = (tone: Note, steps: number) => {
  const tones = Object.values(Note);
  const index = tones.findIndex((v) => v === tone);
  const newIndex = mod(index + steps, tones.length);

  return tones[newIndex];
};
