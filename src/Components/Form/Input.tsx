import React, { FunctionComponent, useEffect, useState } from "react";

const Input: FunctionComponent<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & { initialValue?: string }
> = (props) => {
  const [value, setValue] = useState(props.initialValue || "");

  useEffect(() => {
    setValue(props.initialValue || "");
  }, [props.initialValue]);

  const inputProps = { ...props };
  delete inputProps.initialValue;

  return (
    <input
      value={value}
      onChange={(e) => {
        e.preventDefault();
        setValue(e.target.value);
        if (inputProps.onChange) inputProps.onChange(e);
      }}
      {...inputProps}
    />
  );
};

export default Input;
