import React from 'react';

export const SchemaTextArea: React.FC<{
  isValid: boolean;
  value: string;
  onChange: (value: string) => void;
}> = ({
  isValid,
  value,
  onChange
}) => {
  return (
    <>
      <textarea 
        className={
          isValid ? "form-control" : "form-control is-invalid"
        }
        style={{
          width: '100%',
          height: '100%',
        }}
        value={value}
        onChange={({ target: { value } }) => {
          onChange(value);
        }} />
    </>
  );
}