// Services imports
import { getContactById } from '@/services/contactsService';

// Styles imports
import styles from './contactPage.module.scss';

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;

	const contact = await getContactById(Number(id));

	console.log('Fetched contact:', contact);

	return <div className={styles['page-wrapper']}>page</div>;
};

export default Page;
