'use client';
// Library imports
import { useEffect } from 'react';

// Hooks imports
import { useQueryClient } from '@tanstack/react-query';
import { useContactGetUnique } from '@/hooks/useContact';
import { useSequencesByContactId } from '@/hooks/useSequence';
import { useAllMessagesByContactId } from '@/hooks/useMessages';

// Styles imports
import styles from './contactPage.module.scss';

// MUI imports
import {
	Phone,
	MailOutline,
	LinkedIn,
	Close,
	Check,
} from '@mui/icons-material';

// Types imports
import type { ContactFromDB } from '@/types/contactTypes';
import type { SequencesResponse } from '@/types/sequenceTypes';
import type { MessagesResponse } from '@/types/messageTypes';

// Components
import EditContactButton from '@/app/components/buttons/EditContactButton';
import DeleteContactButton from '@/app/components/buttons/DeleteContactButton';
import ContactActivities from './ContactActivities';

export default function ContactDetailsClient({
	initialContact,
	initialSequences,
	initialAllMessages,
}: {
	initialContact: ContactFromDB;
	initialSequences: SequencesResponse;
	initialAllMessages: MessagesResponse;
}) {
	const queryClient = useQueryClient();

	// hydrate server data into the cache
	useEffect(() => {
		if (initialContact) {
			queryClient.setQueryData<ContactFromDB>(
				['contact-get-unique', initialContact.id],
				initialContact
			);
		}

		if (initialSequences) {
			queryClient.setQueryData<SequencesResponse>(
				['sequences-by-contact-id', initialContact.id],
				initialSequences
			);
		}

		if (initialAllMessages) {
			queryClient.setQueryData<MessagesResponse>(
				['all-messages-by-contact-id', initialContact.id],
				initialAllMessages
			);
		}
	}, []);

	const { data } = useContactGetUnique(initialContact.id);
	const contact = data || initialContact;
	const { data: sequencesData } = useSequencesByContactId(initialContact.id);
	const sequences = sequencesData || initialSequences;
	const { data: allMessagesData } = useAllMessagesByContactId(
		initialContact.id
	);

	const { messages: allMessages } = allMessagesData || initialAllMessages;

	const importance: Record<number, string> = {
		1: 'Lowest',
		2: 'Low',
		3: 'Medium',
		4: 'High',
		5: 'Highest',
	};

	return (
		<>
			<section className={styles['header-section']}>
				<div className={styles['details-wrapper']}>
					<div className={styles['header-details']}>
						<h1 className={styles.name}>
							{contact.firstName ? contact.firstName : 'Name Needed'}{' '}
							{contact.lastName ? contact.lastName : ''}
						</h1>
						<EditContactButton contact={contact!} />
						<DeleteContactButton contact={contact!} />
					</div>

					<div className={styles['contact-details']}>
						{(contact.company || contact.title || contact.importance) && (
							<div className={styles['company-info']}>
								{contact.company && (
									<div className={styles['info-row']}>
										<span>Company:</span>
										<span
											className={styles.value}
											style={{ fontWeight: '600' }}
										>
											{contact?.company || 'N/A'}
										</span>
									</div>
								)}
								{contact.title && (
									<div className={styles['info-row']}>
										<span>Title:</span>
										<span
											className={styles.value}
											style={{ fontWeight: '600' }}
										>
											{contact?.title || 'N/A'}
										</span>
									</div>
								)}
								{contact.importance && (
									<div className={styles['info-row']}>
										<span>Priority:</span>
										<span style={{ fontWeight: '600' }}>
											{contact?.importance
												? importance[contact.importance]
												: 'N/A'}
										</span>
									</div>
								)}
							</div>
						)}
						<div className={styles['personal-info']}>
							<div className={styles['info-row']}>
								<span className={styles.label}>
									<MailOutline className={styles.icon} />
								</span>
								<span className={styles.value}>{contact?.email || 'N/A'}</span>
								{contact.validEmail !== null &&
									(contact.validEmail ? (
										<Check
											className={styles.icon}
											style={{ color: 'hsl(120, 100%, 40%)' }}
											titleAccess='Email Valid'
										/>
									) : (
										<Close
											className={styles.icon}
											style={{ color: 'hsl(0, 100%, 40%)' }}
											titleAccess='Invalid Email'
										/>
									))}
							</div>
							{contact.phone && (
								<div className={styles['info-row']}>
									<span className={styles.label}>
										<Phone className={styles.icon} />
									</span>
									<span className={styles.value}>
										{contact?.phone || 'N/A'}
									</span>
								</div>
							)}
							{contact?.linkedIn && (
								<div className={styles['info-row']}>
									<span className={styles.label}>
										<LinkedIn className={styles.icon} />
									</span>
									<a
										href={contact?.linkedIn || ''}
										className={styles.value}
										target='_blank'
										rel='noopener noreferrer'
									>
										{contact?.linkedIn || 'N/A'}
									</a>
								</div>
							)}
						</div>
					</div>

					<div className={styles['application-details']}>
						{contact.associatedRole && (
							<div className={styles['info-row']}>
								<span className={styles.label}>
									Associated Role Applied For:
								</span>
								<span className={styles.value} style={{ fontWeight: '600' }}>
									{contact?.associatedRole || 'N/A'}
								</span>
							</div>
						)}
						<div className={styles['info-row']}>
							<span className={styles.label}>Active Sequence:</span>
							<span className={styles.value} style={{ fontWeight: '600' }}>
								{contact?.active ? 'Yes' : 'No'}
							</span>
						</div>
					</div>
				</div>
			</section>
			<ContactActivities
				contact={contact}
				sequences={sequences}
				allMessages={allMessages}
			/>
		</>
	);
}
