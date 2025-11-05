import React from 'react';
import type { BufferHeaderProps } from '@/types/buffer';

interface CalculatorHeaderFactory {
  direction: "horizontal" | "vertical";
  bufferId?: string;
  isPopup?: boolean;
}

export const createCalculatorHeader = ({
  direction,
  bufferId,
  isPopup = false
}: CalculatorHeaderFactory): BufferHeaderProps => {
  return {
    title: "Scientific Calculator",
    bufferId,
    direction,
    right: {
      actions: [
        {
          type: 'toggle-direction',
          title: direction,
          order: 97,
        },
        {
          type: isPopup ? 'pop-in' : 'pop-out',
          order: 98,
        },
        {
          type: 'close',
          order: 99,
        }
      ]
    }
  };
};