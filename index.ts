import { visit } from 'graphql/language';
import { parse } from 'graphql/language/parser';
import { buildSchema } from 'graphql';
import { Linter } from 'eslint';
import { CLIEngine } from 'eslint';
import { rules } from 'eslint-plugin-graphql';

export function graphqlToOpenApi(
  inputSchema: string,
  inputQuery: string
): string {
  const cliEngine = new CLIEngine({
    baseConfig: {
      rules: {
        'graphql/template-strings': ['error', {
          env: 'literal',
          schemaString: inputSchema,
        }],
        'graphql/named-operations' : ['error', {
          schemaString: inputSchema,
        }],
      },
    },
    rules: {
      'graphql/template-strings': ['error', {
        env: 'literal',
        schemaString: inputSchema,
      }],
      'graphql/named-operations' : ['error', {
        schemaString: inputSchema,
      }],
    },
    plugins: [
      'graphql',
    ],
    useEslintrc: false,
  });
  const report = cliEngine.executeOnText(inputQuery, 'inputQuery.graphql');
  console.info(JSON.stringify(report, null, 2));
  const parsedQuery = parse(inputQuery);
  return '';
}
