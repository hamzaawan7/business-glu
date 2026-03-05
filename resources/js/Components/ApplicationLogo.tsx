import { ImgHTMLAttributes } from 'react';

interface ApplicationLogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'primary' | 'stacked' | 'dark';
}

export default function ApplicationLogo({
    size = 'md',
    variant = 'primary',
    className = '',
    ...props
}: ApplicationLogoProps) {
    const sizes = {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-14',
        xl: 'h-20',
    };

    const src = {
        primary: '/images/logo-primary.png',
        stacked: '/images/logo-stacked.png',
        dark: '/images/logo-dark.png',
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
