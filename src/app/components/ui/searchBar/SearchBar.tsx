'use client';

// Library imports
import React, { useState } from 'react';

// Hooks imports

// Styles imports
import styles from './searchBar.module.scss';

// MUI imports
import { Search } from '@mui/icons-material';

// Components imports

// Context imports

interface SearchBarProps {
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	onSearch?: (value: string) => void;
	disabled?: boolean;
	className?: string;
	showSearchButton?: boolean;
}

const SearchBar = ({
	placeholder = 'Search...',
	value,
	onChange,
	onSearch,
	disabled = false,
	className = '',
	showSearchButton = true,
}: SearchBarProps) => {
	const [internalValue, setInternalValue] = useState('');

	// Use controlled value if provided, otherwise use internal state
	const currentValue = value !== undefined ? value : internalValue;

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;

		if (value === undefined) {
			setInternalValue(newValue);
		}

		onChange?.(newValue);
	};

	const handleSearch = () => {
		onSearch?.(currentValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	return (
		<div className={`${styles['searchbar-wrapper']} ${className}`}>
			<div className={styles['search-container']}>
				<input
					type='text'
					value={currentValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={disabled}
					className={styles['search-input']}
				/>
				{showSearchButton && (
					<button
						type='button'
						onClick={handleSearch}
						disabled={disabled}
						className={styles['search-button']}
					>
						<Search />
					</button>
				)}
			</div>
		</div>
	);
};

export default SearchBar;
