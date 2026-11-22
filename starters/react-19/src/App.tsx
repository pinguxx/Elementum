import React, { useState } from 'react';

// React 19 JSX IntrinsicElements augmentation (passes props, attributes, and events natively)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'el-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { bordered?: boolean }, HTMLElement>;
      'el-input': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { placeholder?: string; value?: string }, HTMLElement>;
      'el-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { variant?: string }, HTMLElement>;
      'el-alert': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { variant?: string }, HTMLElement>;
    }
  }
}

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  return (
    <div style={{ padding: '48px 16px', maxWidth: '500px', margin: '0 auto' }}>
      <el-card bordered>
        <h2 slot="header" style={{ margin: 0, fontSize: '1.25rem' }}>React 19 Custom Elements Integration</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <el-input 
            placeholder="Type a message..." 
            value={inputValue}
            onInput={(e: React.FormEvent<HTMLElement>) => {
              const target = e.target as HTMLInputElement;
              setInputValue(target.value);
            }}
          />

          <el-button 
            variant="primary" 
            onClick={() => setShowAlert(true)}
          >
            Trigger Alert
          </el-button>

          {showAlert && (
            <el-alert variant="success">
              You entered: "{inputValue || '(empty)'}"
            </el-alert>
          )}
        </div>
      </el-card>
    </div>
  );
}
