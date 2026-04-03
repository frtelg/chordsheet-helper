import React, { FunctionComponent } from 'react';

const Input: FunctionComponent<
    React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
        initialValue?: string;
    }
> = (props) => {
    const inputProps = { ...props };
    delete inputProps.initialValue;

    return (
        <input
            key={props.initialValue || ''}
            defaultValue={props.initialValue || ''}
            onChange={(e) => {
                e.preventDefault();
                if (inputProps.onChange) inputProps.onChange(e);
            }}
            {...inputProps}
        />
    );
};

export default Input;
