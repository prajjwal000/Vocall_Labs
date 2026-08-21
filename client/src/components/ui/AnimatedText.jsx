import React from 'react';
import { motion } from 'framer-motion';

export const StaggeredWords = ({ text, className = '', delay = 0 }) => {
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 12,
      filter: 'blur(4px)',
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          key={index}
          className="mr-1.5 inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

export const ShimmerHeading = ({ children, className = '' }) => {
  return (
    <span
      className={`bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer font-extrabold ${className}`}
    >
      {children}
    </span>
  );
};

export default StaggeredWords;
