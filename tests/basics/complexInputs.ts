import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';
import * as stringify from 'json-stable-stringify';

describe('complexInputs', function() {
  it('should produce a valid openapi spec', function() {
    const inputSchema = readFileSync(
      path.join(
        __dirname,
        'complexInputsSchema.graphql'
      )
    ).toString();
    const inputQuery = readFileSync(
      path.join(
        __dirname,
        'complexInputs.graphql'
      )
    ).toString();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expectedOutput = require('./complexInputs.json');
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
