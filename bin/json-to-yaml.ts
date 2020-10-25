import { stringify } from 'yaml';
import { program } from 'commander';
import { readFileSync, writeFileSync } from 'fs';

const { filename } = program
  .description(
    [
      'converts a json file to yaml,',
      'replacing the .json extension with ',
      '.yaml',
    ].join('\n')
  )
  .requiredOption('-f, --filename <filename>', 'Input/Output filename')
  .parse(process.argv)
  .opts();

const original = JSON.parse(readFileSync(filename).toString());
const output = stringify(original, { sortMapEntries: true });
writeFileSync(filename.replace(/\.json$/, '.yaml'), output);
