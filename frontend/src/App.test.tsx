import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders TabOrder application', () => {
  render(<App />);
  // Basic test to ensure the app renders without crashing
  expect(document.body).toBeInTheDocument();
});

test('App component loads without errors', () => {
  const { container } = render(<App />);
  expect(container).toBeInTheDocument();
});