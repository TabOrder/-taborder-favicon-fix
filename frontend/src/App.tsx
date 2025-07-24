import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#1976d2', marginBottom: '1rem' }}>
          🦁 TabOrder Frontend
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Frontend is working! Favicon should be accessible.
        </p>
        <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '1rem' }}>
          Check the browser tab for the favicon icon.
        </p>
      </div>
    </div>
  );
};

export default App;
