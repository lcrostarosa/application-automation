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
	const { mutate: sendEmail, loading: sending } = useEmailSend();

	const [editorContent, setEditorContent] = useState<string>('');

	const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

	const {
		register,
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
				<section className={styles['form-settings']}>
					<h2>Follow-up Settings</h2>
					{/* Follow-up Cadence */}
					<div className={styles['input-group']}>
						<div className={styles.input}>
							<label htmlFor='followUpCadence'>Follow-up Cadence:</label>
							<select
								id='followUpCadence'
								// {...register('followUpCadence', {
								// 	required: 'Please select a follow-up cadence',
								// })}
							>
								<option value=''>Select cadence...</option>
								<option value='2day'>Every 2 days</option>
								<option value='3day'>Every 3 days</option>
								<option value='32day'>Wait 3 then Wait 2 Repeat</option>
								<option value='weekly'>Weekly on {today}</option>
								<option value='biweekly'>Bi-weekly on {today}</option>
							</select>
						</div>
						{errors.followUpCadence && (
							<span>{errors.followUpCadence.message}</span>
						)}
					</div>
					{/* Review Before Sending */}
					<div className={styles['input-group']}>
						<div className={styles.input}>
							<label htmlFor='reviewBeforeSending'>
								Review Before Sending:
							</label>
							<input
								type='checkbox'
								id='reviewBeforeSending'
								{...register('reviewBeforeSending')}
							/>
						</div>
					</div>
					{/* Send without Review after */}
					<div className={styles['input-group']}>
						<div className={styles.input}>
							<label htmlFor='sendWithoutReviewAfter'>
								Send without Review after:
							</label>
							<select
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
				</section>

				<section className={styles['form-email']}>
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

					{/* Send Buttons */}
					<button type='submit' disabled={sending}>
						{sending ? 'Sending...' : 'Send Test Email'}
					</button>
				</section>
			</form>
		</div>
	);
};

export default NewEmailForm;
