import { SVGAttributes } from 'react';

export default function ApplicationLogo(props: SVGAttributes<SVGElement> & { size?: 'sm' | 'md' | 'lg' }) {
    const { size = 'md', className, ...rest } = props;

    const sizes = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-4xl',
    };

    return (
        <span className={`font-heading font-bold tracking-tight ${sizes[size]} ${className ?? ''}`}>
            <span className="text-brand-primary">Business</span>
            <span className="text-brand-accent"> Glu</span>
        </span>
    );
}
