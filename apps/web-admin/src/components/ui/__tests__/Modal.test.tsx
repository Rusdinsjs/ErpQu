import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../Modal';

describe('Modal Component', () => {
    it('renders title and children when isOpen is true', () => {
        render(
            <Modal isOpen={true} onClose={() => {}} title="Test Modal Title">
                <div>Modal Content Here</div>
            </Modal>
        );

        expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
        expect(screen.getByText('Modal Content Here')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <Modal isOpen={false} onClose={() => {}} title="Test Modal Title">
                <div>Modal Content Here</div>
            </Modal>
        );

        expect(screen.queryByText('Test Modal Title')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const handleClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={handleClose} title="Test Modal Title">
                <div>Modal Content Here</div>
            </Modal>
        );

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);
        expect(handleClose).toHaveBeenCalled();
    });
});
