import React from 'react';
import { textAreaStyles } from './textAreaStyles';

export const SchemaTextArea: React.FC<{
  isValid: boolean;
  value: string;
  onChange: (value: string) => void;
}> = ({ isValid, value, onChange }) => {
  return (
    <>
      <textarea
        className={isValid ? 'form-control' : 'form-control is-invalid'}
        style={textAreaStyles}
        value={value}
        onChange={({ target: { value } }) => {
          onChange(value);
        }}
      />
    </>
  );
};
