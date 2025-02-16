declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      'camera-controls'?: string;
      'shadow-intensity'?: string;
      exposure?: string;
      'environment-image'?: string;
      ar?: string;
      'ar-modes'?: string;
      'interaction-prompt'?: string;
      'camera-orbit'?: string;
      'min-camera-orbit'?: string;
      'max-camera-orbit'?: string;
      'touch-action'?: string;
      'min-field-of-view'?: string;
      'max-field-of-view'?: string;
    };
  }
} 