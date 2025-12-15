'use client';

// Library imports
import { useForm, SubmitHandler } from 'react-hook-form';

// Hooks imports

// Styles imports
import styles from './newEmailForm.module.scss';

// Components imports

// Context imports

interface EmailFormData {
	to: string;
	subject: string;
	followUpCadence: string;
	reviewBeforeSending: boolean;
	sendWithoutReviewAfter: string;
}

const NewEmailForm = () => {
	const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<EmailFormData>({
		defaultValues: {
			to: '',
			subject: '',
			followUpCadence: '',
			reviewBeforeSending: false,
			sendWithoutReviewAfter: '',
		},
	});

	const onPreviewMessage = (data: EmailFormData) => {
		console.log('Preview Message:');
		// Handle preview logic here
	};

	const onSendWithoutPreview = (data: EmailFormData) => {
		console.log('Send Without Preview:');
		// Handle send without preview logic here
	};

	return (
		<div className={styles['newemailform-wrapper']}>
			<form>
				<section className={styles['form-settings']}>
					<h2>Follow-up Settings</h2>
					{/* Follow-up Cadence */}
					<div>
						<label htmlFor='followUpCadence'>Follow-up Cadence:</label>
						<select
							id='followUpCadence'
							{...register('followUpCadence', {
								required: 'Please select a follow-up cadence',
							})}
						>
							<option value=''>Select cadence...</option>
							<option value='2day'>Every 2 days</option>
							<option value='3day'>Every 3 days</option>
							<option value='32day'>Wait 3 then Wait 2 Repeat</option>
							<option value='weekly'>Weekly on {today}</option>
							<option value='biweekly'>Bi-weekly on {today}</option>
						</select>
						{errors.followUpCadence && (
							<span>{errors.followUpCadence.message}</span>
						)}
					</div>
					{/* Review Before Sending */}
					<div>
						<label htmlFor='reviewBeforeSending'>
							Review Before Sending:
							<input
								type='checkbox'
								id='reviewBeforeSending'
								{...register('reviewBeforeSending')}
							/>
						</label>
					</div>
					{/* Send without Review after */}
					<div>
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
				</section>

				<section className={styles['form-email']}>
					{/* To Field */}
					<div>
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
						{errors.to && <span>{errors.to.message}</span>}
					</div>

					{/* Subject Field */}
					<div>
						<label htmlFor='subject'>Subject:</label>
						<input
							type='text'
							id='subject'
							{...register('subject', { required: 'Subject is required' })}
						/>
						{errors.subject && <span>{errors.subject.message}</span>}
					</div>

					{/* Email Body - RTE */}
					<div className={styles['rte-wrapper']}></div>

					{/* Buttons */}
					<div>
						<button type='button' onClick={handleSubmit(onPreviewMessage)}>
							Preview Email
						</button>
						<button type='button' onClick={handleSubmit(onSendWithoutPreview)}>
							Send without Preview
						</button>
					</div>
				</section>
			</form>
		</div>
	);
};

export default NewEmailForm;
