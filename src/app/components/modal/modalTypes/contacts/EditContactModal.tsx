// Library imports
import { useForm, SubmitHandler } from 'react-hook-form';

// Hooks imports
import { useContactUpdate } from '@/hooks/useContact';

// Types imports
import { ContactFromDB, ContactFormData } from '@/types/contactTypes';

// Styles imports
import styles from './newContactModal.module.scss';

// Components imports

// Context imports
import { useAppContext } from '@/app/context/AppContext';

const EditContactModal = ({
	selectedContact,
}: {
	selectedContact?: ContactFromDB;
}) => {
	if (!selectedContact) {
		return null;
	}

	const {
		setModalType,
		setSelectedContact,
		duplicateContact,
		setDuplicateContact,
		setLoading,
		setLoadingMessage,
	} = useAppContext();
	const { mutateAsync: updateContact, isPending: updating } =
		useContactUpdate();

	const {
		register,
		handleSubmit,
		formState: { touchedFields, errors },
		reset,
	} = useForm<ContactFormData>({
		defaultValues: {
			firstName: selectedContact.firstName || '',
			lastName: selectedContact.lastName || '',
			company: selectedContact.company || '',
			title: selectedContact.title || '',
			email: selectedContact.email || '',
			phone: selectedContact.phone || '',
			linkedIn: selectedContact.linkedIn || '',
			importance:
				selectedContact.importance !== undefined &&
				selectedContact.importance !== null
					? String(selectedContact.importance)
					: '',
			reasonForEmail: selectedContact.reasonForEmail || '',
		},
	});

	const onSubmit: SubmitHandler<ContactFormData> = async (data) => {
		try {
			setLoading(true);
			setLoadingMessage('Saving');
			await updateContact({ id: selectedContact.id, ...data });
			// Handle success
			reset();
			setModalType(null);
			setSelectedContact(null);
			setLoading(false);
			setLoadingMessage(null);
		} catch (error) {
			// Error handling is done in the hook
			setLoading(false);
			setLoadingMessage(null);
		}
	};

	const handleCancel = () => {
		reset();
		setModalType(null);
		setSelectedContact(null);
	};

	return (
		<div className={styles['newcontact-modal-wrapper']}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className={styles['contact-form']}
			>
				{/* Name Fields */}
				<div className={styles['form-row']}>
					<div className={styles['input-group']}>
						<label htmlFor='first'>First Name *</label>
						<input
							type='text'
							id='firstName'
							{...register('firstName', {
								required: 'First name is required',
								minLength: {
									value: 2,
									message: 'First name must be at least 2 characters',
								},
							})}
							className={errors.firstName ? styles.error : ''}
						/>
						{errors.firstName && (
							<span className={styles['error-message']}>
								{errors.firstName.message}
							</span>
						)}
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='last'>Last Name *</label>
						<input
							type='text'
							id='lastName'
							{...register('lastName', {
								required: 'Last name is required',
								minLength: {
									value: 2,
									message: 'Last name must be at least 2 characters',
								},
							})}
							className={errors.lastName ? styles.error : ''}
						/>
						{errors.lastName && (
							<span className={styles['error-message']}>
								{errors.lastName.message}
							</span>
						)}
					</div>
				</div>

				{/* Company and Title */}
				<div className={styles['form-row']}>
					<div className={styles['input-group']}>
						<label htmlFor='company'>Company</label>
						<input type='text' id='company' {...register('company')} />
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='title'>Title</label>
						<input type='text' id='title' {...register('title')} />
					</div>
				</div>

				{/* Contact Information */}
				<div className={styles['form-row']}>
					<div className={styles['input-group']}>
						<label htmlFor='email'>Email *</label>
						<input
							type='email'
							id='email'
							{...register('email', {
								required: 'Email is required',
								pattern: {
									value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
									message: 'Invalid email address',
								},
							})}
							className={errors.email ? styles.error : ''}
						/>
						{errors.email && (
							<span className={styles['error-message']}>
								{errors.email.message}
							</span>
						)}
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='phone'>Phone</label>
						<input type='tel' id='phone' {...register('phone')} />
					</div>
				</div>

				{/* LinkedIn and Importance */}
				<div className={styles['form-row']}>
					<div className={styles['input-group']}>
						<label htmlFor='linkedin'>LinkedIn Profile</label>
						<input
							type='url'
							id='linkedIn'
							{...register('linkedIn', {
								pattern: {
									value: /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i,
									message: 'Please enter a valid LinkedIn URL',
								},
								onChange: (e) => {
									const value = e.target.value;
									if (
										value &&
										!value.startsWith('http') &&
										(value.startsWith('www') || value.startsWith('linkedin'))
									) {
										e.target.value = `https://${value}`;
									}
								},
							})}
							placeholder='https://'
							className={errors.linkedIn ? styles.error : ''}
						/>
						{errors.linkedIn && (
							<span className={styles['error-message']}>
								{errors.linkedIn.message}
							</span>
						)}
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='importance'>Importance</label>
						<select id='importance' {...register('importance')}>
							<option value=''>Select importance...</option>
							<option value='1'>1 - Lowest</option>
							<option value='2'>2 - Low</option>
							<option value='3'>3 - Medium</option>
							<option value='4'>4 - High</option>
							<option value='5'>5 - Highest</option>
						</select>
					</div>
				</div>

				{/* Additional Fields */}
				<div className={styles['input-group']}>
					<label htmlFor='reasonForEmail'>Reason for Reaching Out:</label>
					<input
						type='text'
						id='reasonForEmail'
						{...register('reasonForEmail')}
						className={errors.reasonForEmail ? styles.error : ''}
						placeholder='ex: Junior Engineer'
					/>
					{errors.reasonForEmail && (
						<span className={styles['error-message']}>
							{errors.reasonForEmail.message}
						</span>
					)}
				</div>

				{/* Action Buttons */}
				<div className={styles['form-actions']}>
					<button
						type='submit'
						className={`${styles['save-button']} button contact`}
						disabled={updating || duplicateContact}
					>
						{updating ? 'Saving...' : 'Save Changes'}
					</button>
					<button
						type='button'
						name='cancel'
						onClick={handleCancel}
						className={`${styles['cancel-button']} button`}
						disabled={updating || duplicateContact}
					>
						Cancel
					</button>
				</div>

				{/* Error Detected */}
				{duplicateContact && (
					<div className={styles['mini-alert']}>
						<p className={styles['error-message']}>
							One of your contacts is already using this email.
						</p>
						<button type='button' onClick={() => setDuplicateContact(false)}>
							Ok
						</button>
					</div>
				)}
			</form>
		</div>
	);
};

export default EditContactModal;
