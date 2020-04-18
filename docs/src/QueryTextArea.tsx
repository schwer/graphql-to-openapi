import React from 'react';

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
        style={{
          width: '100%',
          height: '100%',
        }}
        onChange={({ target: { value } }) => {
          onChange(value);
        }} />
    </>
  );

};