import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';

const SimpleComponent = () => <div>Hello World</div>;

describe('SimpleComponent', () => {
  it('renders hello world', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
}); 