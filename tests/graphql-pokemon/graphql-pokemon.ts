import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';

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
    const expectedOutput = readFileSync(
      path.join(
        __dirname,
        'openapi.json'
      )
    ).toString();
    const actualOutput = graphqlToOpenApi(
      inputSchema,
      inputQuery
    );
    assert.ok(!!actualOutput.openApiSchemaJson);
    assert.equal(expectedOutput, actualOutput);
  });
});
