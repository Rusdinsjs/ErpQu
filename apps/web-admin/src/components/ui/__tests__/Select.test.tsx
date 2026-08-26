import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../Select';

describe('Select Component', () => {
    const options = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
    ];

    it('renders with label and options', () => {
        render(
            <Select
                label="Test Select"
                options={options}
                value="opt1"
                onChange={() => {}}
            />
        );

        expect(screen.getByText('Test Select')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('triggers onChange when selecting an option', () => {
        const handleChange = vi.fn();
        render(
            <Select
                label="Test Select"
                options={options}
                value="opt1"
                onChange={handleChange}
            />
        );

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opt2' } });
        expect(handleChange).toHaveBeenCalledWith('opt2');
    });
});
