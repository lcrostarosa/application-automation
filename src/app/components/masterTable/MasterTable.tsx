'use client';

// Library imports
import { useState, Fragment } from 'react';

// Styles imports
import styles from './masterTable.module.scss';

// Helper functions imports
import { parseEmailContent } from '@/lib/helperFunctions';

// Components imports
import TableHeader from './TableHeader';
import NestedTable from './NestedTable';

// Types imports
import { MasterTableData } from '@/types/masterTableTypes';

const MasterTable = ({
	inModal,
	tableData,
	tableType,
}: {
	inModal?: boolean;
	tableData: MasterTableData;
	tableType:
		| 'contacts'
		| 'activeSequence'
		| 'previousSequences'
		| 'allActivities'
		| 'replies'
		| 'pendingEmails';
}) => {
	const [sortType, setSortType] = useState<string | null>(null);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedRow, setSelectedRow] = useState<number | null>(null);

	const parseTableType = (type: string) => {
		switch (type) {
			case 'contacts':
				return 'contacts';
			case 'activeSequence':
				return 'active sequences';
			case 'previousSequences':
				return 'previous sequences';
			case 'allActivities':
				return 'activities';
			case 'replies':
				return 'replies';
			case 'pendingEmails':
				return 'pending emails';
			default:
				return 'items';
		}
	};

	const handleSort = (type: string) => {
		if (sortType === type) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortType(type);
			setSortOrder('asc');
		}
	};

	const handleClick = (rowId: number) => {
		if (selectedRow === rowId) {
			setSelectedRow(null);
			return;
		}

		setSelectedRow(rowId);
	};

	const sortedRowData = tableData.rowData.sort((a, b) => {
		const sortIndex = tableData.columnHeaders.findIndex(
			(header) => header.label === sortType
		);

		if (!sortType) return 0;
		const valA = (a.cellData[sortIndex]?.value || '').toString().toLowerCase();
		const valB = (b.cellData[sortIndex]?.value || '').toString().toLowerCase();
		if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
		if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
		return 0;
	});

	if (!tableData.rowData.length)
		return (
			<div className={styles.activity}>
				<p>No {parseTableType(tableType)} found</p>
			</div>
		);

	const { columnHeaders } = tableData;

	return (
		<table
			className={`${styles['master-table']} ${inModal ? styles.inModal : ''}`}
		>
			<TableHeader columnHeaders={columnHeaders} handleSort={handleSort} />
			<tbody className={styles.tableBody}>
				{sortedRowData.map((row) => {
					const nestedRowData = row.nestedData?.value ?? null;

					return nestedRowData ? (
						<Fragment key={row.rowId}>
							<tr
								className={`
									${selectedRow === row.rowId ? styles.selected : ''} 
									${styles.bodyRow} ${row.rowStyling ? styles[row.rowStyling] : ''}
								`}
								onClick={() => handleClick(row.rowId)}
							>
								{row.cellData.map((cell: any, cellIndex: number) => {
									const parsedContent =
										cell.contentCell && parseEmailContent(cell.value);

									return cell.contentCell ? (
										<td
											key={`nestedCellMaster-${cellIndex}`}
											className={`
												${styles[cell.size]} 
												${cell.cellStyling ? styles[cell.cellStyling] : ''} 
												${styles['content-cell']}
											`}
										>
											<div className={styles['parsed-content']}>
												<span className={styles['message-preview']}>
													{parsedContent[0]}
												</span>
												{parsedContent.length > 1 &&
													parsedContent
														.slice(1)
														.map((text: string, index: number) => (
															<span key={index}>{text}</span>
														))}
											</div>
										</td>
									) : (
										<td
											key={`nestedCellMaster-${cellIndex}`}
											className={`
												${styles[cell.size]} 
												${cell.cellStyling ? styles[cell.cellStyling] : ''} 
												${cell.cellOrientation ? styles[cell.cellOrientation] : ''}
											`}
										>
											{cell.isDate
												? new Date(cell.value as string).toLocaleDateString()
												: cell.value}
										</td>
									);
								})}
							</tr>
							{selectedRow === row.rowId && (
								<tr
									className={`${styles['expanded-row']} ${
										selectedRow === row.rowId ? styles.selected : ''
									} ${styles.bodyRow}`}
								>
									<td colSpan={6}>
										<NestedTable
											inModal={inModal}
											tableData={nestedRowData}
											tableType={tableType}
										/>
									</td>
								</tr>
							)}
						</Fragment>
					) : (
						<tr
							key={row.rowId}
							className={`${styles.bodyRow} ${
								row.rowStyling ? styles[row.rowStyling] : ''
							}`}
							onClick={() => handleClick(row.rowId)}
						>
							{row.cellData.map((cell: any, index: number) => {
								const parsedContent =
									cell.contentCell && parseEmailContent(cell.value);

								return cell.contentCell ? (
									<td
										key={index}
										className={`
											${styles[cell.size]} 
											${cell.cellStyling ? styles[cell.cellStyling] : ''} 
											${styles['content-cell']}
										`}
									>
										<div className={styles['parsed-content']}>
											<span
												className={`
													${styles['message-preview']} 
													${
														cell.subjectContentCell &&
														row.rowStyling !== 'cancelled'
															? styles.subject
															: ''
													}
												`}
											>
												{parsedContent[0]}
											</span>
											{selectedRow === row.rowId &&
												parsedContent.length > 1 &&
												parsedContent
													.slice(1)
													.map((text: string, index: number) => (
														<span key={index}>{text}</span>
													))}
										</div>
									</td>
								) : (
									<td
										key={index}
										className={`
											${styles[cell.size]} 
											${cell.cellStyling ? styles[cell.cellStyling] : ''} 
											${cell.cellOrientation ? styles[cell.cellOrientation] : ''}
										`}
									>
										{cell.isDate
											? new Date(cell.value as string).toLocaleDateString()
											: cell.value}
									</td>
								);
							})}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default MasterTable;
