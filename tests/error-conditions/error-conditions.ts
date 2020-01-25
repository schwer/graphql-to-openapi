import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';

describe('error-conditions', function() {
  it('should fail on a bad input query', function() {
    const inputSchema = readFileSync(
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
    const output = graphqlToOpenApi(
      inputSchema,
      inputQuery
    );
    assert.ok(output.errorReport.inputQuery);
  });
});
