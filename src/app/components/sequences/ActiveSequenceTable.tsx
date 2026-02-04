// Types imports
import { SequenceFromDB } from '@/types/sequenceTypes';
import { MasterTableData } from '@/types/masterTableTypes';

// Components imports
import MasterTable from '../masterTable/MasterTable';

const ActiveSequenceTable = ({ sequence }: { sequence: SequenceFromDB }) => {
	const columnHeaders = [
		{ label: 'Subject', size: 'md' },
		{ label: 'Content', size: 'lrg' },
		{ label: 'Status', size: 'sm' },
		{ label: 'Send Date', size: 'sm', sortable: true },
	];

	const tableData: MasterTableData = {
		columnHeaders,
		rowData: sequence.messages.map((message) => {
			const messageStatus =
				message.status === 'pending' ||
				(message.status === 'scheduled' &&
					message.needsApproval &&
					!message.approved)
					? 'Pending Approval'
					: message.status[0].toUpperCase() + message.status.slice(1);
			const sendDate = message.sentAt
				? message.sentAt
				: `Scheduled for ${new Date(
						message.scheduledAt!
				  ).toLocaleDateString()}`;

			return {
				rowId: message.id,
				cellData: [
					{
						value: message.subject,
						size: columnHeaders[0].size,
						cellStyling: 'bold',
					},
					{
						value: message.contents,
						size: columnHeaders[1].size,
						contentCell: true,
					},
					{
						value: messageStatus,
						size: columnHeaders[2].size,
						cellStyling:
							message.status === 'pending'
								? 'pending'
								: message.status === 'scheduled'
								? 'scheduled'
								: null,
					},
					{
						value: sendDate,
						size: columnHeaders[3].size,
						cellOrientation: 'right',
						isDate: message.sentAt ? true : false,
					},
				],
				rowStyling:
					message.status === 'scheduled'
						? 'scheduled'
						: message.status === 'pending'
						? 'pending'
						: null,
			};
		}),
	};

	return <MasterTable tableData={tableData} tableType='activeSequence' />;
};

export default ActiveSequenceTable;
