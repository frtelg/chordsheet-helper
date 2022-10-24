import React, { FunctionComponent } from 'react';
import Icon from '@mdi/react';
import { IconProps } from '@mdi/react/dist/IconProps';

interface ClickableIconProps extends IconProps {
    onClick(): void;
}

const ClickableIcon: FunctionComponent<ClickableIconProps> = ({ onClick, ...props }) => {
    return (
        <span onClick={onClick} style={{ cursor: 'pointer' }}>
            <Icon size="1rem" {...props} />
        </span>
    );
};

export default ClickableIcon;
