import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white shadow-sm border border-gray-200',
      elevated: 'bg-white shadow-lg border border-gray-200',
      outlined: 'bg-white border-2 border-gray-200',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-lg p-6', variants[variant], className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export default Card;
