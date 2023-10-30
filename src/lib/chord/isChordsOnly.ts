import { chordRegex } from '@/model/chord/regex';

const chordLineRegex = `^((\\s+)?(${chordRegex})(\\s+)?)+$`;

const isChordsOnly = (s: string) => RegExp(new RegExp(chordLineRegex, 'g')).exec(s);

export default isChordsOnly;
