import { program } from 'commander';
import { readFileSync } from 'fs';
import { graphqlToOpenApi } from '../index';

const {
  schema,
  query,
  pretty,
} = program
  .requiredOption('--schema <schema>', 'A graphql schema file')
  .requiredOption('--query <query>', 'A graphql query file')
  .option('--pretty', 'pretty json output', true)
  .parse(process.argv)
  .opts();

const schemaString = readFileSync(schema).toString();
const inputQuery = readFileSync(query).toString();

const {
  errorReport,
  openApiSchema,
} = graphqlToOpenApi({
  schemaString,
  inputQuery,
  inputQueryFilename: query,
});
if (errorReport && errorReport.inputQuery) {
    process.stderr.write(errorReport.inputQuery);
    process.exit(-1);
}
if (errorReport && errorReport.schemaString) {
    process.stderr.write(errorReport.schemaString);
    process.exit(-1);
}
if (pretty) {
  process.stdout.write(JSON.stringify(openApiSchema, null, 2));
} else {
  process.stdout.write(JSON.stringify(openApiSchema));
}
process.exit(0);