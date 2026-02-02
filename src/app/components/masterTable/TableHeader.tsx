// Library imports
import React from 'react';

// Services imports

// Hooks imports

// Styles imports
import styles from './masterTable.module.scss';

// MUI imports
import { SwapVert } from '@mui/icons-material';

// Components imports

// Context imports

const TableHeader = ({
	columnHeaders,
	handleSort,
}: {
	columnHeaders: any[];
	handleSort: (type: string) => void;
}) => {
	return (
		<thead className={styles.tableHeader}>
			<tr className={styles.headerRow}>
				{columnHeaders.map((header, index) => (
					<th
						key={index}
						className={`
							${styles[header.size]} 
							${header.sortable ? styles.sort : ''}`}
						onClick={() => {
							if (header.sortable) {
								handleSort(header.label);
							}
						}}
					>
						{header.sortable ? (
							<span className={styles.sort}>
								{header.label}
								<SwapVert fontSize='small' />
							</span>
						) : (
							header.label
						)}
					</th>
				))}
			</tr>
		</thead>
	);
};

export default TableHeader;
