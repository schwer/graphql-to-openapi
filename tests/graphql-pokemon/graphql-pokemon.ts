import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';
import * as stringify from 'json-stable-stringify';

describe('graphql-pokemon', function() {
  it('should produce a valid openapi spec', function() {
    const inputSchema = readFileSync(
      path.join(
        __dirname,
        'schema.graphql'
      )
    ).toString();
    const inputQuery = readFileSync(
      path.join(
        __dirname,
        'example.graphql'
      )
    ).toString();
    const expectedOutput = require('./openapi.json');
    const actualOutput = graphqlToOpenApi(
      inputSchema,
      inputQuery
    ).openApiSchema;
    const normalizedActualOutput = stringify(actualOutput, { space: '  '});
    const normalizedExpectedOutput = stringify(expectedOutput, { space: '  '});
    assert.ok(!!actualOutput);
    assert.equal(normalizedActualOutput, normalizedExpectedOutput);
  });
});
