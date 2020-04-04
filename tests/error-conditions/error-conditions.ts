import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';

describe('error-conditions', function() {
  it('should fail on a bad input query', function() {
    const schemaString = readFileSync(
      path.join(
        __dirname,
        '..',
        'graphql-pokemon',
        'schema.graphql'
      )
    ).toString();
    const inputQuery = `
      query {
        unknown
      }
    `;
    const output = graphqlToOpenApi({
      schemaString,
      inputQuery,
      inputQueryFilename: 'error-conditions.graphql'
    });
    assert.ok(output.errorReport.inputQuery);
  });
});
