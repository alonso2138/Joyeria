
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ComponentProps<typeof motion.button> {
  variant?: 'primary' | 'secondary' | 'outline';
  children?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

const Button = ({ children, variant = 'primary', className = '', ...props }: ButtonProps) => {
  const baseClasses = "px-4 md:px-6 py-2 md:py-2.5 text-[11px] md:text-[12px] font-bold tracking-wider md:tracking-widest uppercase rounded-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";

  const variantClasses = {
    primary: 'bg-[var(--primary-color)] text-[var(--secondary-color)] hover:bg-opacity-90 focus:ring-[var(--primary-color)]',
    secondary: 'bg-transparent border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-[var(--secondary-color)] focus:ring-[var(--primary-color)]',
    outline: 'bg-transparent border border-white text-white hover:bg-white hover:text-black focus:ring-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
