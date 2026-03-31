/**
 * Dev Shop Selector - For testing multiple shops locally
 * 
 * Usage: Import this component and add it to your App.jsx temporarily
 */

import { useState, useEffect } from 'react';

export const DevShopSelector = () => {
  const [currentSubdomain, setCurrentSubdomain] = useState('');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const subdomain = localStorage.getItem('dev_shop_subdomain') || '';
    setCurrentSubdomain(subdomain);
    setInputValue(subdomain);
  }, []);

  const handleSave = () => {
    localStorage.setItem('dev_shop_subdomain', inputValue);
    setCurrentSubdomain(inputValue);
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem('dev_shop_subdomain');
    setCurrentSubdomain('');
    setInputValue('');
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#1a1a1a',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 9999,
      minWidth: '250px'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ 
          color: '#0ea5e9', 
          fontWeight: 'bold', 
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          🛠️ Dev Mode
        </span>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          color: '#9ca3af', 
          fontSize: '11px',
          marginBottom: '4px'
        }}>
          Current Subdomain:
        </label>
        <div style={{ 
          backgroundColor: '#262626', 
          padding: '8px 12px', 
          borderRadius: '6px',
          color: currentSubdomain ? '#10b981' : '#ef4444',
          fontSize: '13px',
          fontFamily: 'monospace'
        }}>
          {currentSubdomain || 'Not set (shows landing page)'}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          color: '#9ca3af', 
          fontSize: '11px',
          marginBottom: '4px'
        }}>
          Set Test Shop:
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="testshop11"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #404040',
            backgroundColor: '#262626',
            color: '#fff',
            fontSize: '13px',
            fontFamily: 'monospace',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Set & Reload
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: '8px 12px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ 
        marginTop: '12px', 
        paddingTop: '12px', 
        borderTop: '1px solid #404040',
        fontSize: '10px', 
        color: '#6b7280' 
      }}>
        <p style={{ marginBottom: '4px' }}>Quick access:</p>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['testshop11', 'cheechak', 'fitbaku'].map(sub => (
            <button
              key={sub}
              onClick={() => {
                localStorage.setItem('dev_shop_subdomain', sub);
                window.location.reload();
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#262626',
                color: '#9ca3af',
                border: '1px solid #404040',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
