import { readFileSync } from 'fs';
import path from 'path';
import { graphqlToOpenApi } from '../../index.js';
import assert from 'assert';
import stringify from 'json-stable-stringify';
import expectedOutput from './complexInputs.json' with { type: 'json' };
import { describe, it } from 'vitest';

describe('complexInputs', function () {
  const inputQueryFilename = path.join(__dirname, 'complexInputs.graphql');
  const query = readFileSync(inputQueryFilename).toString();

  describe('given a schema string', function () {
    it('should produce a valid openapi spec', function () {
      const schema = readFileSync(
        path.join(__dirname, 'complexInputsSchema.graphql')
      ).toString();
      const actualOutput = graphqlToOpenApi({
        schema,
        query,
      }).openApiSchema;
      const normalizedActualOutput = stringify(actualOutput, { space: '  ' });
      const normalizedExpectedOutput = stringify(expectedOutput, {
        space: '  ',
      });
      assert.ok(!!actualOutput);
      assert.equal(normalizedActualOutput, normalizedExpectedOutput);
    });
  });

  describe('given an introspection schema', function () {
    it('should produce a valid openapi spec', function () {
      const introspectionSchema = JSON.parse(
        readFileSync(
          path.join(__dirname, 'complexInputsSchema.json')
        ).toString()
      );
      const actualOutput = graphqlToOpenApi({
        introspectionSchema,
        query,
      }).openApiSchema;
      const normalizedActualOutput = stringify(actualOutput, { space: '  ' });
      const normalizedExpectedOutput = stringify(expectedOutput, {
        space: '  ',
      });
      assert.ok(!!actualOutput);
      assert.equal(normalizedActualOutput, normalizedExpectedOutput);
    });
  });
});
