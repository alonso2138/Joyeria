
import React from 'react';
import { motion } from 'framer-motion';

interface SpinnerProps {
    size?: number;
    text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 40, text }) => {
  return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <motion.div
            style={{
                width: size,
                height: size,
                border: '4px solid rgba(255, 255, 255, 0.2)',
                borderTop: '4px solid var(--primary-color)',
                borderRadius: '50%',
            }}
            animate={{ rotate: 360 }}
            transition={{
                // FIX: Replace deprecated 'loop' property with 'repeat' for infinite animation.
                repeat: Infinity,
                ease: 'linear',
                duration: 1,
            }}
        />
        {text && <p className="text-lg font-serif tracking-wider">{text}</p>}
      </div>
  );
};

export default Spinner;
