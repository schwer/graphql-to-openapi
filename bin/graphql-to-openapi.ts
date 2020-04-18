#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync } from 'fs';
import { graphqlToOpenApi } from '../index';

const {
  schema,
  query,
  pretty,
} = program
  .description([
    'Converts a graphql schema and query into',
    'an openapi json document. The openapi json',
    'document is a best-effort approximation',
    'of a GET endpoint specification for the',
    'graphql query supplied.',
  ].join('\n'))
  .requiredOption('--schema <schema>', 'A graphql schema file')
  .requiredOption('--query <query>', 'A graphql query file')
  .option('--pretty', 'pretty json output', true)
  .parse(process.argv)
  .opts();

const schemaString = readFileSync(schema).toString();
const inputQuery = readFileSync(query).toString();

const {
  error,
  schemaError,
  queryErrors,
  openApiSchema,
} = graphqlToOpenApi({
  schemaString,
  inputQuery,
  inputQueryFilename: query,
});
if (error) {
  throw error;
}
if (queryErrors?.length > 0) {
  throw queryErrors[0];
}
if (schemaError) {
  throw schemaError;
}
if (pretty) {
  process.stdout.write(JSON.stringify(openApiSchema, null, 2));
} else {
  process.stdout.write(JSON.stringify(openApiSchema));
}
process.exit(0);
