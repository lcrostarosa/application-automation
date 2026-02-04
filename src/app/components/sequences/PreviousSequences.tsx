// Library imports
import { useMemo } from 'react';

// Helpers imports
import { sequenceType } from '@/lib/helperFunctions';

// Types imports
import { SequenceFromDB } from '@/types/sequenceTypes';
import {
	MasterTableData,
	CellOrientation,
	CellStyling,
} from '@/types/masterTableTypes';

// Components
import MasterTable from '../masterTable/MasterTable';

const PreviousSequences = ({
	sequences,
	contact,
}: // previousActivities,
{
	sequences: SequenceFromDB[];
	contact?: boolean;
	// previousActivities: PreviousActivity[];
}) => {
	const columnHeaders = [
		{ label: 'Sequence Name', size: 'lrg' },
		{ label: 'Sequence Type', size: 'sm' },
		{ label: 'Duration (Days)', size: 'sm' },
		{ label: 'Messages Sent', size: 'sm' },
		{ label: 'Completion Date', size: 'sm', sortable: true },
		{ label: 'Replied', size: 'sm', sortable: true },
	];

	const contactColumnHeaders = contact
		? [{ label: 'Contact', size: 'sm', sortable: true }, ...columnHeaders]
		: [];

	const nestedMessagesHeaders = [
		{ label: 'Subject', size: 'md' },
		{ label: 'Content', size: 'lrg', contentCell: true },
		{ label: 'Status', size: 'sm' },
		{ label: 'Sent Date', size: 'sm', sortable: true },
	];

	const nestedTablesById = useMemo(() => {
		const headers = nestedMessagesHeaders;
		return new Map(
			sequences.map((sequence) => {
				const rowData = sequence.messages.map((message) => {
					const messageStatus =
						message.status === 'pending' ||
						(message.status === 'scheduled' &&
							message.needsApproval &&
							!message.approved)
							? 'Pending Approval'
							: message.status[0].toUpperCase() + message.status.slice(1);
					const sendDate =
						message.status === 'cancelled'
							? 'N/A'
							: message.sentAt
							? new Date(message.sentAt).toLocaleDateString()
							: `Scheduled for ${new Date(
									message.scheduledAt!
							  ).toLocaleDateString()}`;

					return {
						rowId: message.id,
						cellData: [
							{ value: message.subject, size: headers[0].size },
							{
								value: message.contents,
								size: headers[1].size,
								contentCell: true,
							},
							{ value: messageStatus, size: headers[2].size },
							{
								value: sendDate,
								size: headers[3].size,
								cellOrientation: 'right' as CellOrientation,
								cellStyling: 'transparent' as CellStyling,
							},
						],
					};
				});

				const nestedTable: MasterTableData = {
					columnHeaders: headers,
					rowData,
				};

				return [sequence.id, nestedTable] as const;
			})
		);
	}, [sequences, nestedMessagesHeaders]);

	const tableData: MasterTableData = {
		columnHeaders: contact ? contactColumnHeaders : columnHeaders,
		rowData: sequences
			.map((sequence) => {
				const sequenceCompletionDate = new Date(sequence.endDate!);
				const sequenceStartDate = new Date(sequence.createdAt);
				const sequenceDuration = Math.ceil(
					(sequenceCompletionDate.getTime() - sequenceStartDate.getTime()) /
						(1000 * 60 * 60 * 24)
				);
				const messagesSent = sequence.messages.filter(
					(message) => message.status === 'sent'
				).length;

				const cellData = [
					{
						value: sequence.title,
						size: contact
							? contactColumnHeaders[1].size
							: columnHeaders[0].size,
						cellStyling: 'bold' as CellStyling,
					},
					{
						value: sequenceType(
							sequence.sequenceType,
							new Date(sequence.createdAt)
						),
						size: contact
							? contactColumnHeaders[2].size
							: columnHeaders[1].size,
						cellOrientation: 'right' as CellOrientation,
					},
					{
						value: sequenceDuration,
						size: contact
							? contactColumnHeaders[3].size
							: columnHeaders[2].size,
						cellOrientation: 'right' as CellOrientation,
					},
					{
						value: messagesSent,
						size: contact
							? contactColumnHeaders[4].size
							: columnHeaders[3].size,
						cellOrientation: 'right' as CellOrientation,
					},
					{
						value: sequence.endDate ? sequence.endDate : '',
						size: contact
							? contactColumnHeaders[5].size
							: columnHeaders[4].size,
						cellOrientation: 'right' as CellOrientation,
						isDate: true,
					},
					{
						value: sequence.emailReplies.length > 0 ? 'Yes' : 'No',
						size: contact
							? contactColumnHeaders[6].size
							: columnHeaders[5].size,
						cellOrientation: 'right' as CellOrientation,
					},
				];

				const contactCellData = contact
					? [
							{
								value:
									sequence.contact.firstName + ' ' + sequence.contact.lastName,
								size: contactColumnHeaders[0].size,
								cellStyling: 'link' as CellStyling,
								isLink: true,
								href: `/dashboard/contacts/${sequence.contact.id}`,
							},
							...cellData,
					  ]
					: [];

				return {
					rowId: sequence.id,
					cellData: contact ? contactCellData : cellData,
					nestedData: { value: nestedTablesById.get(sequence.id) ?? null },
				};
			})
			.sort((a, b) => {
				const valA = a.cellData[4]?.value
					? new Date(a.cellData[4].value as string).getTime()
					: 0;
				const valB = b.cellData[4]?.value
					? new Date(b.cellData[4].value as string).getTime()
					: 0;
				return valB - valA;
			}),
	};

	console.log(tableData);

	return (
		<MasterTable
			tableData={tableData}
			tableType='previousSequences'
			tableSize={tableData.columnHeaders.length}
		/>
	);
};

export default PreviousSequences;
