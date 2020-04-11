import React from 'react';

export const SchemaTextArea: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({
  value,
  onChange
}) => {
  return (
    <>
      <textarea 
        className="form-control"
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