'use client';

// Library imports
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

// Hooks imports
import { useEmailSend } from '@/hooks/useEmail';

// Styles imports
import styles from './newEmailForm.module.scss';

// Component imports
import TinyEditor from '../../editor/TinyEditor';

// Context imports
import { useAppContext } from '@/app/context/AppContext';

interface EmailFormData {
	to: string;
	subject: string;
	followUpCadence: string;
	reviewBeforeSending: boolean;
	sendWithoutReviewAfter: string;
}

const NewEmailForm = () => {
	const { setModalType, selectedContact, setSelectedContact } = useAppContext();
	const { mutateAsync: sendEmail, isPending: sending } = useEmailSend();

	const [editorContent, setEditorContent] = useState<string>('');

	const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

	const {
		register,
		watch,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
	} = useForm<EmailFormData>({
		defaultValues: {
			to: '',
			subject: '',
			followUpCadence: '',
			reviewBeforeSending: false,
			sendWithoutReviewAfter: '',
		},
	});

	const reviewBeforeSendingChecked = watch('reviewBeforeSending');
	const followingUp = watch('followUpCadence') !== 'none';

	useEffect(() => {
		if (selectedContact?.email) {
			setValue('to', selectedContact.email);
		}
	}, [selectedContact, setValue]);

	const onSubmit: SubmitHandler<EmailFormData> = async (data) => {
		try {
			await sendEmail({
				to: data.to,
				subject: data.subject || 'Email from Application',
				body:
					editorContent ||
					'This is an email from the application automation system.',
			});

			// Success handling is done in the hook
			setEditorContent('');
			setSelectedContact(null);
			reset(); // Reset form fields
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	return (
		<div className={styles['newemailform-wrapper']}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className={styles['form-email-wrapper']}>
					<section className={styles['form-email']}>
						<h2>Email:</h2>

						{/* To Field */}
						<div className={styles['input-group']}>
							<div className={styles.input}>
								<label htmlFor='to'>To:</label>
								<input
									type='email'
									id='to'
									{...register('to', {
										required: 'Email address is required',
										pattern: {
											value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
											message: 'Invalid email address',
										},
									})}
								/>
								<button
									type='button'
									className={styles['contact-select']}
									data-tooltip='Select from contacts'
									onClick={() => setModalType('searchContacts')}
								>
									...
								</button>
							</div>
							{errors.to && <span>{errors.to.message}</span>}
						</div>

						{/* Subject Field */}
						<div className={styles['input-group']}>
							<div className={styles.input}>
								<label htmlFor='subject'>Subject:</label>
								<input
									type='text'
									id='subject'
									{...register('subject', { required: 'Subject is required' })}
								/>
							</div>
							{errors.subject && <span>{errors.subject.message}</span>}
						</div>

						{/* Email Body - RTE */}
						<div className={styles['rte-wrapper']}>
							<TinyEditor setEditorContent={setEditorContent} />
						</div>
					</section>

					<section className={styles['form-settings']}>
						<h2>Automation Settings:</h2>
						{/* Follow-up Cadence */}
						<div className={styles['input-group']}>
							<div className={styles.input}>
								<label htmlFor='followUpCadence'>Follow-up Cadence:</label>
								<select
									className={styles.select}
									id='followUpCadence'
									{...register('followUpCadence', {
										required: 'Please select a follow-up cadence',
									})}
								>
									<option value=''>Select cadence...</option>
									<option value='3day'>Every 3 days</option>
									<option value='31day'>3... 1... 3... 1... Repeat</option>
									<option value='weekly'>Weekly on {today}</option>
									<option value='biweekly'>Bi-weekly on {today}</option>
									<option value='none'>No Follow-up</option>
								</select>
							</div>
							{errors.followUpCadence && (
								<span>{errors.followUpCadence.message}</span>
							)}
						</div>

						{followingUp && (
							<>
								{/* Review Before Sending */}
								<div className={styles['input-group']}>
									<div className={styles.input}>
										<label htmlFor='reviewBeforeSending'>
											Review Before Sending:
										</label>
										<input
											className={styles.checkbox}
											type='checkbox'
											id='reviewBeforeSending'
											{...register('reviewBeforeSending')}
										/>
									</div>
								</div>

								{/* Send without Review after */}
								{reviewBeforeSendingChecked && (
									<div className={styles['input-group']}>
										<div className={styles.input}>
											<label htmlFor='sendWithoutReviewAfter'>
												Send without Review after:
											</label>
											<select
												className={styles.select}
												id='sendWithoutReviewAfter'
												{...register('sendWithoutReviewAfter')}
											>
												<option value=''>Select time...</option>
												<option value='1day'>1 Day</option>
												<option value='2days'>2 Days</option>
												<option value='never'>Never</option>
											</select>
										</div>
									</div>
								)}
							</>
						)}

						{/* Send Buttons */}
						<button
							className={'button send-email'}
							type='submit'
							disabled={sending}
						>
							{sending ? 'Sending...' : 'Send Email'}
						</button>
					</section>
				</div>
			</form>
		</div>
	);
};

export default NewEmailForm;
