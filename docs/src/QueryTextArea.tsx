import React from 'react';

export const QueryTextArea: React.FC<{
  onChange: (value: string) => void;
  value: string;
}> = ({
  onChange,
  value,
}) => {

  return (
    <>
      <textarea value={value}
        className="form-control"
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