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
            onClick={disabled ? undefined : onClick}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
            <Icon
                size="1rem"
                color={disabled ? 'var(--color-text-muted)' : 'var(--color-text)'}
                {...props}
            />
        </span>
    );
};

export default ClickableIcon;
