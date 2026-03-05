import { ImgHTMLAttributes } from 'react';

interface ApplicationLogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'full' | 'icon' | 'transparent';
}

export default function ApplicationLogo({
    size = 'md',
    variant = 'full',
    className = '',
    ...props
}: ApplicationLogoProps) {
    const sizes = {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-16',
        xl: 'h-24',
    };

    const src = {
        full: '/images/full-logo.png',
        icon: '/images/only-logo.png',
        transparent: '/images/tranparent-logo.png',
    };

    return (
        <img
            src={src[variant]}
            alt="Business Glu"
            className={`${sizes[size]} w-auto ${className}`}
            {...props}
        />
    );
}
