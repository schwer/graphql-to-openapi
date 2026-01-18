import { readFileSync } from 'fs';
import path from 'path';
import { graphqlToOpenApi } from '../../index.js';
import assert from 'assert';
import { stringify } from 'yaml';
import { describe, it } from 'vitest';

describe('inlineFragment', function () {
  it('should produce a valid openapi spec', function () {
    const schema = readFileSync(
      path.join(__dirname, 'inlineFragmentSchema.graphql')
    ).toString();
    const inputQueryFilename = path.join(__dirname, 'inlineFragment.graphql');
    const query = readFileSync(inputQueryFilename).toString();
    const expectedOutputYaml = readFileSync(
      path.join(__dirname, 'inlineFragment.yaml')
    ).toString();
    const output = graphqlToOpenApi({
      schema,
      query,
    });
    const actualOutput = output.openApiSchema;
    const actualOutputYaml = stringify(
      JSON.parse(JSON.stringify(actualOutput)),
      {
        sortMapEntries: true,
      }
    );
    assert.ok(!!actualOutputYaml);
    assert.equal(actualOutputYaml, expectedOutputYaml);
  });
});
