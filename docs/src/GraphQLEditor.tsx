import React from 'react';
import AceEditor from 'react-ace';
import { Ace } from 'ace-builds';
import { GraphQLError } from 'graphql';
import 'ace-builds/src-noconflict/mode-graphqlschema';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-min-noconflict/ext-language_tools';

function graphQLErrorToAnnotations(
  graphQLErrors: readonly GraphQLError[]
): Ace.Annotation[] {
  const annotations = graphQLErrors.map(({ message, locations }) => {
    const annotation = {
      text: message,
      row: locations?.[0].line ?? 0,
      column: locations?.[0].column ?? 0,
      type: 'error',
    };
    annotation.row--;
    return annotation;
  });
  return annotations;
}

export const GraphQLEditor: React.FC<{
  errors: readonly GraphQLError[] | undefined;
  onChange: (value: string) => void;
  value: string;
}> = ({ errors, onChange, value }) => {
  const annotations = errors ? graphQLErrorToAnnotations(errors) : [];

  return (
    <>
      <AceEditor
        mode="graphqlschema"
        annotations={annotations}
        setOptions={{
          useWorker: false,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          tabSize: 2,
        }}
        value={value}
        onChange={onChange}
        width="100%"
        height="100%"
        style={{
          fontSize: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      />
    </>
  );
};
