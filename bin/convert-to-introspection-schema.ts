import * as stringify from 'json-stable-stringify';
import { program } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { buildSchema, graphqlSync } from 'graphql';

const { filename, outputFilename } = program
  .description(
    [
      'converts a schema string into ',
      'an introspection schema json file',
    ].join('\n')
  )
  .requiredOption('-f, --filename <filename>', 'Input filename')
  .requiredOption('-o, --outputFilename <outputFilename>', 'Output filename')
  .parse(process.argv)
  .opts();

const original = readFileSync(filename).toString();
const schema = buildSchema(original);
const introspectionSchema = graphqlSync({ schema, source: filename }).data;
writeFileSync(outputFilename, stringify(introspectionSchema, { space: '  ' }));
