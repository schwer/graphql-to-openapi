/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit, BREAK } from 'graphql/language';
import { visitWithTypeInfo } from 'graphql/utilities';
import { validate } from 'graphql/validation';
import { parse } from 'graphql';
import {
  GraphQLEnumType,
  GraphQLError,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLSchema,
  IntrospectionQuery,
  Source,
  TypeInfo,
  buildClientSchema,
  buildSchema,
} from 'graphql';
import { GraphQLList, GraphQLObjectType, GraphQLUnionType } from 'graphql';

export class NoOperationNameError extends Error {
  /* v8 ignore next */
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = NoOperationNameError.name;
  }
}

export class MissingSchemaError extends Error {
  /* v8 ignore next */
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = MissingSchemaError.name;
  }
}

export class UnknownScalarError extends Error {
  /* v8 ignore next */
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = UnknownScalarError.name;
  }
}

export interface GraphQLToOpenAPIResult {
  readonly queryErrors?: readonly GraphQLError[];
  readonly error?: NoOperationNameError;
  readonly schemaError?: GraphQLError;
  openApiSchema?: any;
}

const typeMap: { [key: string]: object } = {
  ID: {
    type: 'string',
  },
  '[ID]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: true,
    },
  },
  '[ID!]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: false,
    },
  },
  String: {
    type: 'string',
  },
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
    },
  },
  '[Int]': {
    type: 'array',
    items: {
      type: 'integer',
      nullable: true,
    },
  },
  '[Int!]': {
    type: 'array',
    items: {
      type: 'integer',
      nullable: false,
    },
  },
  '[Float]': {
    type: 'array',
    items: {
      type: 'number',
      nullable: true,
    },
  },
  '[Float!]': {
    type: 'array',
    items: {
      type: 'number',
      nullable: false,
    },
  },
  '[Boolean]': {
    type: 'array',
    items: {
      type: 'boolean',
      nullable: true,
    },
  },
  '[Boolean!]': {
    type: 'array',
    items: {
      type: 'boolean',
      nullable: false,
    },
  },
  Int: { type: 'integer' },
  Float: { type: 'number' },
  Boolean: { type: 'boolean' },
};

function getScalarType(
  typeName: string,
  scalarConfig: { [key: string]: object },
  onUnknownScalar: (s: string) => object
): object {
  if (scalarConfig[typeName]) {
    return scalarConfig[typeName];
  }
  const r = onUnknownScalar(typeName);
  /* v8 ignore start */
  if (r) {
    scalarConfig[typeName] = r;
    return r;
  }
  throw new UnknownScalarError('Unknown scalar: ' + typeName);
  /* v8 ignore stop */
}

function fieldDefToOpenApiField(
  typeInfo: TypeInfo,
  scalarConfig: { [key: string]: object },
  onUnknownScalar: (s: string) => object
) {
  const fieldDef = typeInfo.getFieldDef();
  /* v8 ignore start */
  if (!fieldDef) {
    throw new Error('Field definition is null or undefined');
    /* v8 ignore stop */
  }
  const typeName = fieldDef.type.toString();
  const description = fieldDef.description || undefined;
  let nullable;
  let type = fieldDef.type;
  if (type instanceof GraphQLNonNull) {
    nullable = false;
    type = type.ofType;
  } else {
    nullable = true;
  }
  const openApiType: any = {
    nullable,
    items: undefined,
    properties: undefined,
    type: undefined,
    enum: undefined,
    anyOf: undefined,
    description,
  };
  const typeNameWithoutBang = typeName.replace(/[!]$/, '');
  if (typeMap[typeNameWithoutBang]) {
    return {
      ...typeMap[typeNameWithoutBang],
      description,
      nullable,
    };
  }
  if (type instanceof GraphQLList) {
    openApiType.type = 'array';
    let itemType = (type as GraphQLList<any>).ofType;
    let nullableItems = true;
    if (itemType instanceof GraphQLNonNull) {
      nullableItems = false;
      itemType = itemType.ofType;
    }
    if (itemType instanceof GraphQLObjectType) {
      openApiType.items = {
        type: 'object',
        properties: {},
      };
    }
    if (itemType instanceof GraphQLUnionType) {
      openApiType.items = {
        anyOf: [],
        nullable: nullableItems,
      };
    }
    if (itemType instanceof GraphQLScalarType) {
      openApiType.items = getScalarType(
        itemType.name,
        scalarConfig,
        onUnknownScalar
      );
      openApiType.items.nullable = nullableItems;
    }
    return openApiType;
  }
  if (type instanceof GraphQLObjectType) {
    openApiType.type = 'object';
    openApiType.properties = {};
    return openApiType;
  }
  if (type instanceof GraphQLEnumType) {
    openApiType.type = 'string';
    openApiType.enum = type.getValues().map((v) => v.value);
    openApiType.nullable = nullable;
    return openApiType;
  }
  if (type instanceof GraphQLUnionType) {
    openApiType.anyOf = [];
    openApiType.nullable = nullable;
    return openApiType;
  }
  const scalarType = type as GraphQLScalarType;
  const t = getScalarType(scalarType.name, scalarConfig, onUnknownScalar);
  return {
    ...t,
    description,
    nullable,
  };
}

type InputType =
  | GraphQLInputObjectType
  | GraphQLScalarType
  | GraphQLEnumType
  | GraphQLList<any>
  | GraphQLNonNull<any>;

function recurseInputType(
  obj: InputType,
  depth: number,
  scalarConfig: { [key: string]: object },
  onUnknownScalar: (s: string) => object
): any {
  /* v8 ignore start */
  if (depth > 50) {
    throw new Error('depth limit exceeded: ' + depth);
  }
  /* v8 ignore stop */
  if (obj instanceof GraphQLInputObjectType) {
    const inputObjectType = obj as GraphQLInputObjectType;
    const properties: { [key: string]: any } = Object.entries(
      inputObjectType.getFields()
    ).reduce((properties: { [key: string]: any }, [name, f]) => {
      properties[name] = recurseInputType(
        f.type,
        depth + 1,
        scalarConfig,
        onUnknownScalar
      );
      properties[name].description = f.description;
      return properties;
    }, {});
    return {
      type: 'object',
      nullable: true,
      description: inputObjectType.description || undefined,
      properties,
    };
  }
  if (obj instanceof GraphQLList) {
    const list = obj as GraphQLList<any>;
    return {
      type: 'array',
      nullable: true,
      items: recurseInputType(
        list.ofType,
        depth + 1,
        scalarConfig,
        onUnknownScalar
      ),
    };
  }
  if (obj instanceof GraphQLScalarType) {
    const { name } = obj;
    if (name === 'Float') {
      return {
        type: 'number',
        nullable: true,
      };
    }
    if (name === 'Int') {
      return {
        type: 'integer',
        nullable: true,
      };
    }
    if (name === 'String') {
      return {
        type: 'string',
        nullable: true,
      };
    }
    if (name === 'Boolean') {
      return {
        type: 'boolean',
        nullable: true,
      };
    }
    // v8 ignore else
    if (name === 'ID') {
      return {
        type: 'string',
        nullable: true,
      };
    }
    return getScalarType(name, scalarConfig, onUnknownScalar);
  }
  if (obj instanceof GraphQLEnumType) {
    const enumValues = obj.getValues();
    return {
      type: 'string',
      description: obj.description || undefined,
      nullable: true,
      enum: enumValues.map(({ name }) => name),
    };
  }
  /* v8 ignore start */
  if (obj instanceof GraphQLNonNull) {
    /* v8 ignore stop */

    const nonNull = obj as GraphQLNonNull<any>;
    return {
      ...recurseInputType(
        nonNull.ofType,
        depth + 1,
        scalarConfig,
        onUnknownScalar
      ),
      nullable: false,
    };
  }
  /* v8 ignore start */
  throw new Error(`Unexpected InputType: ${obj}`);
  /* v8 ignore stop */
}

export class GraphQLToOpenAPIConverter {
  private graphqlSchema!: GraphQLSchema;
  private schemaError?: GraphQLError;
  constructor(
    private schema?: string | Source,
    private introspectionSchema?: IntrospectionQuery,
    private onUnknownScalar?: (s: string) => object,
    private scalarConfig?: { [key: string]: object }
  ) {
    if (!onUnknownScalar) {
      this.onUnknownScalar = () => {
        return {};
      };
    }
    if (!scalarConfig) {
      this.scalarConfig = {};
    }
    if (schema) {
      try {
        this.graphqlSchema = buildSchema(this.schema as string | Source);
      } catch (err) {
        this.schemaError = err as GraphQLError;
      }
    } else if (introspectionSchema) {
      try {
        this.graphqlSchema = buildClientSchema(
          this.introspectionSchema as IntrospectionQuery
        );
      } catch (err) {
        this.schemaError = err as GraphQLError;
      }
    } else {
      throw new MissingSchemaError(
        'neither schema nor introspection schema supplied'
      );
    }
  }

  public toOpenAPI(query: string | Source): GraphQLToOpenAPIResult {
    const { schemaError, onUnknownScalar, scalarConfig } = this;
    if (schemaError) {
      return {
        schemaError,
      };
    }
    const { graphqlSchema } = this;
    let parsedQuery;
    try {
      parsedQuery = parse(query);
    } catch (err) {
      return { queryErrors: [err as GraphQLError] };
    }
    const queryErrors = validate(graphqlSchema, parsedQuery);
    if (queryErrors.length > 0) {
      return {
        queryErrors,
      };
    }
    let openApiSchema: any = {
      openapi: '3.0.3',
      info: {
        title: 'Not specified',
        license: {
          name: 'Not specified',
        },
        version: 'Not specified',
      },
      servers: [
        {
          url: '/',
        },
      ],
      paths: {},
    };

    let error: NoOperationNameError | undefined;
    let operationDef: any;
    const currentSelection: any[] = [];
    const typeInfo = new TypeInfo(graphqlSchema);
    const fragments: { [key: string]: any } = {};
    openApiSchema = visit(
      parsedQuery,
      visitWithTypeInfo(typeInfo, {
        Document: {
          leave() {
            return openApiSchema;
          },
        },
        FragmentDefinition: {
          enter(node: any) {
            const fragmentType = typeInfo.getType();
            let openApiType;
            if (fragmentType instanceof GraphQLUnionType) {
              openApiType = {
                anyOf: [],
              };
            } else {
              openApiType = {
                type: 'object',
                properties: {},
              };
            }
            currentSelection.unshift({
              node,
              openApiType,
            });
          },
          leave(node: any) {
            const result = currentSelection.shift().openApiType;
            fragments[node.name.value] = result;
            return result;
          },
        },
        OperationDefinition: {
          enter(node: any) {
            const openApiType = {
              type: 'object',
              properties: {
                // To be filled by Field visitor
              },
            };
            if (!node.name) {
              error = new NoOperationNameError(
                'GraphQLToOpenAPIConverter requires a named ' +
                  `operation on line ${node.loc.source.locationOffset.line} ` +
                  'of input query'
              );
              return BREAK;
            }
            openApiSchema.paths['/' + node.name.value] = operationDef = {
              get: {
                parameters: [],
                responses: {
                  '200': {
                    description: 'response',
                    content: {
                      'application/json': {
                        schema: openApiType,
                      },
                    },
                  },
                },
              },
            };
            currentSelection.unshift({
              node,
              openApiType,
            });
          },
          leave() {
            return openApiSchema;
          },
        },
        VariableDefinition({ variable }: any) {
          const inputType = typeInfo.getInputType();
          /* v8 ignore start */
          if (!inputType) {
            return;
          }
          /* v8 ignore stop */
          const t = recurseInputType(
            inputType,
            0,
            scalarConfig as { [key: string]: object },
            onUnknownScalar as (s: string) => object
          );
          if (t.type === 'object' || t.type === 'array') {
            operationDef.get.parameters.push({
              name: variable.name.value,
              in: 'query',
              required: !t.nullable,
              schema: {
                type: t.type,
                items: t.items,
                properties: t.properties,
              },
              description: t.description || undefined,
            });
          } else {
            operationDef.get.parameters.push({
              name: variable.name.value,
              in: 'query',
              required: !t.nullable,
              schema: {
                type: t.type,
              },
              description: t.description || undefined,
            });
          }
        },
        FragmentSpread: {
          enter(node: any) {
            const openApiType = currentSelection[0].openApiType;
            const fragment = fragments[node.name.value];
            if (openApiType.anyOf) {
              openApiType.anyOf = fragment.anyOf;
            } else if (openApiType.items) {
              openApiType.items.properties = fragment.properties;
            } else {
              openApiType.properties = fragment.properties;
            }
          },
        },
        Field: {
          enter(node: any) {
            let name;
            if (node.alias) {
              name = node.alias.value;
            } else {
              name = node.name.value;
            }
            const openApiType = fieldDefToOpenApiField(
              typeInfo,
              scalarConfig as { [key: string]: object },
              onUnknownScalar as (s: string) => object
            );
            const parentObj = currentSelection[0].openApiType;
            if (parentObj.type === 'object') {
              parentObj.properties[name] = openApiType;
            } else {
              // array
              parentObj.items.properties[name] = openApiType;
            }
            if (
              openApiType.type === 'array' &&
              openApiType.items?.type === 'object'
            ) {
              currentSelection.unshift({
                node,
                openApiType,
              });
            } else if (
              openApiType.type === 'array' &&
              openApiType.items?.anyOf
            ) {
              currentSelection.unshift({
                node,
                openApiType,
              });
            } else if (openApiType.anyOf) {
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
          leave(node: any) {
            // raw reference comparison doesn't work here. Using
            // loc as a proxy instead.
            if (currentSelection[0].node.loc === node.loc) {
              const result = currentSelection.shift().openApiType;
              return result;
            }
          },
        },
        InlineFragment: {
          enter(node: any) {
            const openApiType = {
              type: 'object',
              nullable: undefined,
              properties: {},
            };
            const topOfStack = currentSelection[0].openApiType;
            if (topOfStack.items?.anyOf) {
              const nullable = topOfStack.items.nullable;
              openApiType.nullable = nullable;
              topOfStack.items.anyOf.push(openApiType);
            } else {
              topOfStack.anyOf.push(openApiType);
            }
            currentSelection.unshift({
              node,
              openApiType,
            });
          },
          leave() {
            return currentSelection.shift().openApiType;
          },
        },
      })
    );
    if (error) {
      return {
        error,
      };
    }
    return {
      openApiSchema,
    };
  }
}
