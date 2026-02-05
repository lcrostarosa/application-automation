/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeactivateSequenceButton from './DeactivateSequenceButton';

// Mock the context hooks
const mockSetModalType = vi.fn();
const mockSetSelectedSequenceId = vi.fn();

vi.mock('@/app/context/AppContext', () => ({
	useAppContext: vi.fn(() => ({
		setModalType: mockSetModalType,
	})),
}));

vi.mock('@/app/context/EmailContext', () => ({
	useEmailContext: vi.fn(() => ({
		setSelectedSequenceId: mockSetSelectedSequenceId,
	})),
}));

// Mock MUI Close icon
vi.mock('@mui/icons-material', () => ({
	Close: () => <span data-testid="close-icon">X</span>,
}));

// Mock styles
vi.mock('./buttons.module.scss', () => ({
	default: {
		'edit-contact-button': 'mock-button-class',
	},
}));

describe('DeactivateSequenceButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the button with correct text', () => {
		render(<DeactivateSequenceButton sequenceId={1} />);

		expect(screen.getByText('Deactivate Sequence')).toBeInTheDocument();
	});

	it('renders the Close icon', () => {
		render(<DeactivateSequenceButton sequenceId={1} />);

		expect(screen.getByTestId('close-icon')).toBeInTheDocument();
	});

	it('sets selected sequence id on click', () => {
		render(<DeactivateSequenceButton sequenceId={42} />);

		const button = screen.getByRole('button');
		fireEvent.click(button);

		expect(mockSetSelectedSequenceId).toHaveBeenCalledWith(42);
	});

	it('opens deactivate sequence modal on click', () => {
		render(<DeactivateSequenceButton sequenceId={1} />);

		const button = screen.getByRole('button');
		fireEvent.click(button);

		expect(mockSetModalType).toHaveBeenCalledWith('deactivateSequence');
	});

	it('sets sequence id before opening modal', () => {
		render(<DeactivateSequenceButton sequenceId={5} />);

		const button = screen.getByRole('button');
		fireEvent.click(button);

		// Both should be called
		expect(mockSetSelectedSequenceId).toHaveBeenCalledWith(5);
		expect(mockSetModalType).toHaveBeenCalledWith('deactivateSequence');

		// Sequence ID should be set first (checked by call order)
		const setIdOrder = mockSetSelectedSequenceId.mock.invocationCallOrder[0];
		const setModalOrder = mockSetModalType.mock.invocationCallOrder[0];
		expect(setIdOrder).toBeLessThan(setModalOrder);
	});

	it('handles different sequence IDs', () => {
		const { rerender } = render(<DeactivateSequenceButton sequenceId={1} />);

		let button = screen.getByRole('button');
		fireEvent.click(button);
		expect(mockSetSelectedSequenceId).toHaveBeenCalledWith(1);

		vi.clearAllMocks();

		rerender(<DeactivateSequenceButton sequenceId={999} />);
		button = screen.getByRole('button');
		fireEvent.click(button);
		expect(mockSetSelectedSequenceId).toHaveBeenCalledWith(999);
	});

	it('is a button element with type="button"', () => {
		render(<DeactivateSequenceButton sequenceId={1} />);

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('type', 'button');
	});

	it('applies the correct CSS class', () => {
		render(<DeactivateSequenceButton sequenceId={1} />);

		const button = screen.getByRole('button');
		expect(button).toHaveClass('mock-button-class');
	});
});
