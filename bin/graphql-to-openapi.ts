#!/usr/bin/env node

import { program } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { graphqlToOpenApi } from '../index';
import { IntrospectionQuery, Source } from 'graphql';
import { stringify } from 'yaml';

const {
  schema,
  introspectionSchemaJson,
  query,
  scalarConfigFile,
  pretty,
  yaml,
} = program
  .description(
    [
      'Converts a graphql schema and query into',
      'an openapi json document. The openapi json',
      'document is a best-effort approximation',
      'of a GET endpoint specification for the',
      'graphql query supplied.',
    ].join('\n')
  )
  .option('-s, --schema <schema>', 'A graphql schema file')
  .option(
    '-i, --introspection-schema-json <introspectionSchemaJson>',
    'A graphql introspection query output (json) file'
  )
  .requiredOption('-q, --query <query>', 'A graphql query file')
  .option(
    '-c, --scalarConfigFile <scalarConfigFile>',
    'A configuration file (json formatted)' + 'supporting custom scalars'
  )
  .option('--pretty', 'pretty json output', true)
  .option('-y, --yaml', 'Output in yaml format', false)
  .parse(process.argv)
  .opts();

let inputSchema;
let introspectionSchema;
if (schema) {
  inputSchema = readFileSync(schema).toString();
} else if (introspectionSchemaJson) {
  introspectionSchema = JSON.parse(
    readFileSync(introspectionSchemaJson).toString()
  ) as IntrospectionQuery;
}
const inputQuery = readFileSync(query).toString();
let scalarConfig;
if (scalarConfigFile) {
  if (existsSync(scalarConfigFile)) {
    scalarConfig = JSON.parse(readFileSync(scalarConfigFile).toString());
  }
}
let needsScalarConfigFile = false;

const { error, schemaError, queryErrors, openApiSchema } = graphqlToOpenApi({
  schema: schema ? new Source(inputSchema, schema) : undefined,
  introspectionSchema,
  query: new Source(inputQuery, query),
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
if (yaml) {
  process.stdout.write(
    stringify(JSON.parse(JSON.stringify(openApiSchema)), {
      sortMapEntries: true,
    })
  );
} else if (pretty) {
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
