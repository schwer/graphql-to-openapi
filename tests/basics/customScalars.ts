import { readFileSync } from 'fs';
import path from 'path';
import { graphqlToOpenApi } from '../../index.js';
import assert from 'assert';
import stringify from 'json-stable-stringify';
import expectedOutput from './customScalars.json' with { type: 'json' };
import { describe, it } from 'vitest';

describe('customScalars', function () {
  const schema = readFileSync(
    path.join(__dirname, 'customScalarsSchema.graphql')
  ).toString();
  const inputQueryFilename = path.join(__dirname, 'customScalars.graphql');
  const query = readFileSync(inputQueryFilename).toString();
  const scalarConfig: Record<string, { type: string }> = {
    CustomScalar: {
      type: 'string',
    },
  };
  const normalizedExpectedOutput = stringify(expectedOutput, { space: '  ' });

  it('should produce a valid openapi spec with a supplied scalarConfig', function () {
    const actualOutput = graphqlToOpenApi({
      schema,
      query,
      scalarConfig,
    }).openApiSchema;
    const normalizedActualOutput = stringify(actualOutput, { space: '  ' });
    assert.ok(!!actualOutput);
    assert.equal(normalizedActualOutput, normalizedExpectedOutput);
  });

  it('should produce a valid openapi spec with an onUnknownScalar function', function () {
    function onUnknownScalar(s: string) {
      return scalarConfig[s];
    }
    const actualOutput = graphqlToOpenApi({
      schema,
      query,
      onUnknownScalar,
    }).openApiSchema;
    const normalizedActualOutput = stringify(actualOutput, { space: '  ' });
    assert.ok(!!actualOutput);
    assert.equal(normalizedActualOutput, normalizedExpectedOutput);
  });

  it('should throw an exception when a custom scalar is unhandled', function () {
    try {
      graphqlToOpenApi({
        schema,
        query,
      });
      assert.ok(false);
    } catch (err) {
      assert.ok(err);
    }
  });
});
