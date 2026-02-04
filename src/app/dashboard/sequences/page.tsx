// Libraries imports
import { redirect } from 'next/navigation';

// Services imports
import { getAllSequencesByUserId } from '@/services/sequenceService';
import { getApiUser } from '@/services/getUserService';

// Components imports
import PageTemplate from '@/app/components/pageSpecificComponents/PageTemplate';
import SequencesClient from './SequencesClient';

const Page = async () => {
	const { user } = await getApiUser();

	if (!user) {
		redirect('/');
	}

	const { sequences } = await getAllSequencesByUserId();

	console.log(sequences);

	return (
		<PageTemplate
			title='Sequences'
			description='View all active and previous sequences.'
		>
			<SequencesClient initialSequences={sequences} />
		</PageTemplate>
	);
};

export default Page;
