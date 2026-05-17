import React from 'react';
import type { ButtonHTMLAttributes, PropsWithoutRef, RefAttributes } from 'react';

interface ButtonProps extends PropsWithoutRef<ButtonHTMLAttributes<HTMLButtonElement>>, RefAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  type = 'button',
  children,
  className,
  ...props
}) => {
  // Base classes
  const baseClasses = 'rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Block class
  const blockClass = block ? 'w-full' : '';

  const allClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    blockClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      variant={variant}
      size={size}
      className={allClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

Button.displayName = 'Button';

export default Button;