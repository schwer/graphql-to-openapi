import * as stringify from 'json-stable-stringify';
import { program } from 'commander';
import { readFileSync, writeFileSync } from 'fs';

const { filename } = program
  .description(
    [
      'stable stringifies an input json file,',
      'replacing the input file location with the',
      'new stable stringified contents',
    ].join('\n')
  )
  .requiredOption('-f, --filename <filename>', 'Input/Output filename')
  .parse(process.argv)
  .opts();

const original = JSON.parse(readFileSync(filename).toString());
const output = stringify(original, { space: '  ' });
writeFileSync(filename, output);
