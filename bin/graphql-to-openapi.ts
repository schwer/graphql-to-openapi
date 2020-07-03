#!/usr/bin/env node

import { program } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { graphqlToOpenApi } from '../index';

const { schema, query, scalarConfigFile, pretty } = program
  .description(
    [
      'Converts a graphql schema and query into',
      'an openapi json document. The openapi json',
      'document is a best-effort approximation',
      'of a GET endpoint specification for the',
      'graphql query supplied.',
    ].join('\n')
  )
  .requiredOption('--schema <schema>', 'A graphql schema file')
  .requiredOption('--query <query>', 'A graphql query file')
  .option(
    '--scalarConfigFile <scalarConfigFile>',
    'A configuration file (json formatted)' + 'supporting custom scalars'
  )
  .option('--pretty', 'pretty json output', true)
  .parse(process.argv)
  .opts();

const schemaString = readFileSync(schema).toString();
const inputQuery = readFileSync(query).toString();
let scalarConfig;
if (scalarConfigFile) {
  if (existsSync(scalarConfigFile)) {
    scalarConfig = JSON.parse(readFileSync(scalarConfigFile).toString());
  }
}
let needsScalarConfigFile = false;

const { error, schemaError, queryErrors, openApiSchema } = graphqlToOpenApi({
  schemaString,
  inputQuery,
  scalarConfig,
  onUnknownScalar(unknownScalar) {
    if (!scalarConfig && scalarConfigFile) {
      needsScalarConfigFile = true;
    }
    if (!scalarConfig && !scalarConfigFile) {
      throw new Error('A scalar configuration filename is required');
    }
    if (!scalarConfig) {
      scalarConfig = {};
    }
    if (!scalarConfig[unknownScalar]) {
      scalarConfig[unknownScalar] = { type: 'string' };
    }
    return scalarConfig[unknownScalar];
  },
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
if (needsScalarConfigFile) {
  writeFileSync(scalarConfigFile, JSON.stringify(scalarConfig, null, 2));
  console.error(
    'the default custom scalar configuration was written to ' + scalarConfigFile
  );
}
process.exit(0);
