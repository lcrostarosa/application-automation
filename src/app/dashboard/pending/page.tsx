// Services imports
import { getAllPendingMessages } from '@/services/messageService';

// Components imports
import PendingMessagesClient from './PendingMessagesClient';
import PageTemplate from '@/app/components/pageSpecificComponents/PageTemplate';

const Page = async () => {
	const { messages } = await getAllPendingMessages();

	return (
		<PageTemplate
			title='Pending Emails'
			description='Approve or edit pending emails.'
		>
			<PendingMessagesClient initialMessages={messages} />
		</PageTemplate>
	);
};

export default Page;
