import React from 'react';
import { textAreaStyles } from './textAreaStyles';

export const QueryTextArea: React.FC<{
  isValid: boolean;
  onChange: (value: string) => void;
  value: string;
}> = ({
  isValid,
  onChange,
  value,
}) => {

  return (
    <>
      <textarea value={value}
        className={
          isValid ? "form-control" : "form-control is-invalid"
        }
        style={textAreaStyles}
        onChange={({ target: { value } }) => {
          onChange(value);
        }} />
    </>
  );

};