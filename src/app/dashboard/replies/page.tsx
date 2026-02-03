// Services imports
import { getAllRepliesByUserId } from '@/services/repliesService';

// Components imports
import RepliesClient from './RepliesClient';
import PageTemplate from '@/app/components/pageSpecificComponents/PageTemplate';

const Page = async () => {
	const { replies } = await getAllRepliesByUserId();

	return (
		<PageTemplate
			title='Replies'
			description='Replies to emails sent from the platform.'
		>
			<RepliesClient initialReplies={replies} />
		</PageTemplate>
	);
};

export default Page;
