import { readFileSync } from 'fs';
import path from 'path';
import { graphqlToOpenApi } from '../../index.js';
import assert from 'assert';
import stringify from 'json-stable-stringify';
import expectedOutput from './aliasedQuery.json' with { type: 'json' };
import { describe, it } from 'vitest';

describe('aliasedQuery', function () {
  it('should produce a valid openapi spec', function () {
    const schema = readFileSync(
      path.join(__dirname, 'schema.graphql')
    ).toString();
    const inputQueryFilename = path.join(__dirname, 'aliasedQuery.graphql');
    const query = readFileSync(inputQueryFilename).toString();

    const actualOutput = graphqlToOpenApi({
      schema,
      query,
    }).openApiSchema;
    const normalizedActualOutput = stringify(actualOutput, { space: '  ' });
    const normalizedExpectedOutput = stringify(expectedOutput, { space: '  ' });
    assert.ok(!!actualOutput);
    assert.equal(normalizedActualOutput, normalizedExpectedOutput);
  });
});
