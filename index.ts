import { visit } from 'graphql/language';
import { parse } from 'graphql/language/parser';
import { buildSchema } from 'graphql';
import { Linter } from 'eslint';
import { CLIEngine } from 'eslint';
import { rules } from 'eslint-plugin-graphql';

interface IGraphqlToOpenApiErrorReport {
  inputQuery?: string;
  schemaString?: string;
}

interface IGraphqlToOpenApiResult {
  errorReport?: IGraphqlToOpenApiErrorReport;
  openApiSchemaJson?: string;
}

export function graphqlToOpenApi(
  schemaString: string,
  inputQuery: string
): IGraphqlToOpenApiResult {
  const enabled = ['error', {
    env: 'literal',
    schemaString,
  }];
  const cli = new CLIEngine({
    extensions: ['.gql', '.graphql'],
    baseConfig: {
      rules: {
        'graphql/executable-definitions': enabled,
        'graphql/known-argument-names': enabled,
        'graphql/known-directives': enabled,
        'graphql/known-fragment-names': enabled,
        'graphql/known-type-names': enabled,
        'graphql/named-operations': enabled,
        'graphql/no-fragment-cycles': enabled,
        'graphql/no-undefined-variables': enabled,
        'graphql/no-unused-fragments': enabled,
        'graphql/no-unused-variables': enabled,
        'graphql/template-strings': enabled,
        'graphql/unique-argument-names': enabled,
        'graphql/unique-directives-per-location': enabled,
        'graphql/unique-fragment-names': enabled,
        'graphql/unique-input-field-names': enabled,
        'graphql/unique-variable-names': enabled,
        'graphql/values-of-correct-type': enabled,
        'graphql/variables-are-input-types': enabled,
        'graphql/variables-default-value-allowed': enabled,
        'graphql/variables-in-allowed-position': enabled,
      },
    },
    ignore: false,
    useEslintrc: false,
    parserOptions: {
      ecmaVersion: 6,
      sourceType: 'module',
    },
    plugins: [
      'graphql',
    ],
  });
  const report = cli.executeOnText(inputQuery, 'inputQuery.graphql');
  if (report.errorCount > 0) {
    const { results } = report;
    const formatter = cli.getFormatter();
    const resultsWithoutFilenames = results.map((r) => {
      return {
        ...r,
        filePath: '',
      };
    });
    return {
      errorReport: {
        inputQuery: formatter(resultsWithoutFilenames),
      }
    };
  }
  const parsedQuery = parse(inputQuery);
  return {
    openApiSchemaJson: '',
  };
}
