import { visit, Kind, TypeNode, visitWithTypeInfo } from 'graphql/language';
import { parse } from 'graphql/language/parser';
import { buildSchema, TypeInfo } from 'graphql';
import { CLIEngine } from 'eslint';

interface GraphqlToOpenApiErrorReport {
  inputQuery?: string;
  schemaString?: string;
}

interface GraphqlToOpenApiResult {
  errorReport?: GraphqlToOpenApiErrorReport;
  openApiSchemaJson?: string;
}

export function graphqlToOpenApi(
  schemaString: string,
  inputQuery: string
): GraphqlToOpenApiResult {
  const enabled = ['error', {
    env: 'literal',
    schemaString,
  }];
  const cli = new CLIEngine({
    extensions: ['.gql', '.graphql'],
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
  let openApiSchemaJson = {
    swagger: '2.0',
    schemes: [
      'http', 'https'
    ],
    consumes: [
      'application/json'
    ],
    produces: [
      'application/json'
    ],
    paths: {
    }
  };

  let operationDef;
  let currentSelection = [];
  let firstParent;
  let outputPointer = null;
  let a = null;
  const typeInfo = new TypeInfo(buildSchema(schemaString));
  openApiSchemaJson = visit(parsedQuery, visitWithTypeInfo(typeInfo, {
    Document: {
      leave() {
        return openApiSchemaJson;
      },
    },
    OperationDefinition: {
      enter(node) {
        const openApiType = { test: 'here'};
        openApiSchemaJson.paths['/' + node.name.value] = operationDef = {
          get: {
            responses: {
              '200': openApiType,
            },
          },
        };
        currentSelection.unshift({
          node,
          openApiType,
        });
      },
      leave(node) {
        if (node === currentSelection[0].node) {
          return currentSelection.shift().openApiType;
        }
      },
    },
    VariableDefinition({ variable, type }) {
      if (!operationDef.parameters) {
        operationDef.get.parameters = [];
      }
      const openApiType = graphqlTypeToOpenApiType(type, {});
      operationDef.get.parameters.push({
        name: variable.name.value,
        in: 'query',
        required: !openApiType.nullable,
        type: openApiType.type,
      });
    },
    Field: {
      enter(node, key, parent, path, ancestors) {
        const openApiType = fieldDefToOpenApiField(typeInfo, node);
        let parentObj;
        if (currentSelection.length > 0) {
          parentObj = currentSelection[0].openApiType;
        }
        if (parentObj.type === 'object') {
          parentObj.properties[node.name.value] = openApiType;
        } else if (parentObj.type === 'array') {
          parentObj.items = openApiType;
        }
        if (openApiType.type === 'array' && !openApiType.items.type) {
          currentSelection.unshift({
            node,
            openApiType,
          });
        } else if (openApiType.type === 'object') {
          currentSelection.unshift({
            node,
            openApiType,
          });
        }
      },
      leave(node) {
        if (currentSelection[0].node === node) {
          return currentSelection.shift().openApiType;
        }
      }
    },
  }));
  console.log(JSON.stringify(openApiSchemaJson, null, 2));
  return {
    openApiSchemaJson: JSON.stringify(openApiSchemaJson, null, 2),
  };
}

function fieldDefToOpenApiField(typeInfo: TypeInfo, name) {
  const fieldDef = typeInfo.getFieldDef();
  const typeName = fieldDef.type.toString();
  let nullable;
  if (typeName.match(/[!]$/)) {
    nullable = false;
  } else {
    nullable = true;
  }
  let openApiType = {
    nullable,
    items: undefined,
    properties: undefined,
    type: undefined,
  };
  const typeNameWithoutBang = typeName.replace(/[!]$/, '');
  if (typeMap[typeNameWithoutBang]) {
    if (openApiType.type === 'array') {
      openApiType.items = {
        ...typeMap[typeNameWithoutBang],
        nullable,
      };
    } else if (openApiType.type === 'object') {
      openApiType.properties[name.value] = {
        ...typeMap[typeNameWithoutBang],
        nullable,
      }
    } else {
      return {
        ...typeMap[typeNameWithoutBang],
        ...openApiType,
      };
    }
  } else if (typeNameWithoutBang.match(/^\[/)) {
    openApiType.type = 'array';
    openApiType.items = {};
    return openApiType;
  } else {
    openApiType.type = 'object';
    openApiType.properties = {};
    return openApiType;
  }
}

const typeMap = {
  'String': { type: 'string' },
  '[String!]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: false,
    },
  },
  '[String]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: true,
    }
  },
  '[Int]': {
    type: 'array',
    items: {
      type: 'integer',
      nullable: true,
    }
  },
  '[Int!]': {
    type: 'array',
    items: {
      type: 'integer',
      nullable: false,
    }
  },
  '[Float]': {
    type: 'array',
    items: {
      type: 'number',
      nullable: true,
    }
  },
  '[Float!]': {
    type: 'array',
    items: {
      type: 'number',
      nullable: false,
    }
  },
  '[Boolean]': {
    type: 'array',
    items: {
      type: 'boolean',
      nullable: true,
    }
  },
  '[Boolean!]': {
    type: 'array',
    items: {
      type: 'boolean',
      nullable: false,
    }
  },
  'Int': { type: 'integer' },
  'Float': { type: 'number' },
  'Boolean': { type: 'boolean' },
};

function graphqlTypeToOpenApiType(typeNode: TypeNode, objectDefinitions) {
  let nullable = true;
  if (typeNode.kind === Kind.NON_NULL_TYPE) {
    nullable = false;
    return {
      ...graphqlTypeToOpenApiType(typeNode.type, objectDefinitions),
      nullable: false,
    }
  }
  if (typeNode.kind === Kind.NAMED_TYPE) {
    return {
      ...typeMap[typeNode.name.value],
    };
  }

}
