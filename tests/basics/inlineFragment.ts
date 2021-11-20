import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';
import { stringify } from 'yaml';

describe('inlineFragment', function () {
  it('should produce a valid openapi spec', function () {
    const schema = readFileSync(
      path.join(__dirname, 'inlineFragmentSchema.graphql')
    ).toString();
    const inputQueryFilename = path.join(__dirname, 'inlineFragment.graphql');
    const query = readFileSync(inputQueryFilename).toString();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
