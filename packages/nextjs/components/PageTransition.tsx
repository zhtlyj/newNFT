'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  isVisible?: boolean;
}

const NFTLogoAnimation = ({ isVisible = false }: PageTransitionProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000] pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.svg
            width="200"
            height="200"
            viewBox="0 0 41 49"
            fill="none"
          >
            <motion.g>
              <motion.path
                d="M24.6207 2.49347L20.4872 0L0.798342 11.4399L20.3619 23.2893L26.5513 19.6333L19.3691 15.3217L31.6386 8.11129L27.5052 5.64786L15.0959 12.8339L11.0416 10.345L24.6207 2.49347Z"
                stroke="url(#gradient)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              <motion.path
                d="M14.8397 22.1843L20.2218 25.2901L20.2172 49L13.9377 45.1819L5.26708 27.7572V40.0909L0 36.9506V13.3829L5.52884 16.4393L14.8397 34.0137V22.1843Z"
                stroke="url(#gradient)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.3 }}
              />
              <motion.path
                d="M41 13.5855L21.8212 24.8095V30.2702L28.5802 26.2771V44.1789L34.0468 41.0749V23.2559L40.9984 19.2223L41 13.5855Z"
                stroke="url(#gradient)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.6 }}
              />
            </motion.g>
            <defs>
              <linearGradient
                id="gradient"
                x1="0"
                y1="0"
                x2="41"
                y2="49"
                gradientUnits="userSpaceOnUse"
              >
                <motion.stop
                  offset="0%"
                  animate={{ stopColor: ["#4A34A7", "#B97AFA", "#4A34A7"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.stop
                  offset="100%"
                  animate={{ stopColor: ["#B97AFA", "#4A34A7", "#B97AFA"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </linearGradient>
            </defs>
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NFTLogoAnimation; 