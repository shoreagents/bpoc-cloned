// Global type declarations
declare module '@radix-ui/react-visually-hidden' {
  import * as React from 'react';
  
  export interface VisuallyHiddenProps {
    children: React.ReactNode;
    asChild?: boolean;
  }
  
  export const VisuallyHidden: React.FC<VisuallyHiddenProps>;
}
