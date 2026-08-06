/**
 * Muthu Browser — Global Type Declarations
 *
 * Extends the Window interface with the muthuAPI exposed by the preload script.
 */

import type { MuthuAPI } from '../preload/preload';

declare global {
  interface Window {
    muthuAPI: MuthuAPI;
  }
}

export {};
