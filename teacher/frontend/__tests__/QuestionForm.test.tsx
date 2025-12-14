import { render, screen, fireEvent } from '@testing-library/react';
import QuestionForm from '@/components/QuestionForm';

describe('QuestionForm', () => {
  it('renders the form fields correctly', () => {
    render(<QuestionForm />);
    
    expect(screen.getByLabelText(/Question Text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Question/i })).toBeInTheDocument();
  });
  
  it('shows options field when Multiple Choice is selected', () => {
      render(<QuestionForm />);
      const typeSelect = screen.getByLabelText(/Type/i);
      
      // Select Multiple Choice
      fireEvent.change(typeSelect, { target: { value: 'multiple-choice' } });
      
      // Expect options input to appear
      expect(screen.getByLabelText(/Options/i)).toBeInTheDocument();
  });
});
