import React, { FunctionComponent } from 'react';
import Icon from '@mdi/react';
import { IconProps } from '@mdi/react/dist/IconProps';

interface ClickableIconProps extends IconProps {
    onClick(): void;
    disabled?: boolean;
}

const ClickableIcon: FunctionComponent<ClickableIconProps> = ({ onClick, disabled, ...props }) => {
    return (
        <span
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onClick={disabled ? () => {} : onClick}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
            <Icon size="1rem" color={disabled ? 'grey' : 'black'} {...props} />
        </span>
    );
};

export default ClickableIcon;
