// Library imports
import { useForm, SubmitHandler } from 'react-hook-form';

// Hooks imports
import { useContactCreate, useContactUpdate } from '@/hooks/useContact';
import { useDuplicateContactHandler } from '@/hooks/useDuplicateContactHandler';

// Types imports
import { ContactFormData } from '@/types/contactTypes';

// Styles imports
import styles from './newContactModal.module.scss';

// Components imports

// Context imports
import { useAppContext } from '@/app/context/AppContext';

const NewContactModal = () => {
	const { setModalType, setDuplicateContact, setLoading, setLoadingMessage } =
		useAppContext();
	const { mutateAsync: createContact, isPending: saving } = useContactCreate();
	const { mutateAsync: updateContact, isPending: updating } =
		useContactUpdate();

	const {
		register,
		handleSubmit,
		formState: { touchedFields, errors },
		reset,
	} = useForm<ContactFormData>({
		defaultValues: {
			firstName: '',
			lastName: '',
			company: '',
			title: '',
			email: '',
			phone: '',
			linkedIn: '',
			importance: '',
			reasonForEmail: '',
		},
	});

	const {
		mismatchFields,
		isUpdateMode,
		contactId,
		processDuplicate,
		clearDuplicateState,
		isFieldDifferent,
	} = useDuplicateContactHandler();

	const onSubmit: SubmitHandler<ContactFormData> = async (data) => {
		if (isUpdateMode) {
			try {
				setLoading(true);
				setLoadingMessage('Saving');
				// Ensure contactId exists
				if (!contactId) {
					console.error('Contact ID is missing');
					return;
				}

				const changedFields = mismatchFields.reduce(
					(acc: Record<string, string>, fieldName) => {
						acc[fieldName] = data[fieldName as keyof ContactFormData];
						return acc;
					},
					{} as Record<string, string>
				);

				const updateData = {
					id: contactId,
					...changedFields,
				};

				await updateContact(updateData);

				// Handle success
				reset();
				setModalType(null);
				clearDuplicateState();
				setLoading(false);
				setLoadingMessage(null);
			} catch {
				// Error handling is done in the hook
				setLoading(false);
				setLoadingMessage(null);
			}
			return;
		}

		try {
			setLoading(true);
			setLoadingMessage('Saving');
			const response = await createContact(data);

			// Handle duplicate contact scenario
			if (response.success === false && response.duplicate) {
				const normalizedData = processDuplicate(data, response.existingContact);
				reset(normalizedData);
				return;
			}

			reset();
			setModalType(null);
			clearDuplicateState();
			setLoading(false);
			setLoadingMessage(null);
		} catch {
			// Error handling is done in the hook
			setLoading(false);
			setLoadingMessage(null);
		}
	};

	const handleCancel = () => {
		reset();
		setModalType(null);
		clearDuplicateState();
		setDuplicateContact(false);
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
							className={`${errors.firstName ? styles.error : ''} ${
								isFieldDifferent('firstName', touchedFields.firstName)
									? styles['field-updated']
									: ''
							}`}
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
							className={`${errors.lastName ? styles.error : ''} ${
								isFieldDifferent('lastName', touchedFields.lastName)
									? styles['field-updated']
									: ''
							}`}
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
						<input
							type='text'
							id='company'
							{...register('company')}
							className={`${
								isFieldDifferent('company', touchedFields.company)
									? styles['field-updated']
									: ''
							}`}
						/>
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='title'>Title</label>
						<input
							type='text'
							id='title'
							{...register('title')}
							className={`${
								isFieldDifferent('title', touchedFields.title)
									? styles['field-updated']
									: ''
							}`}
						/>
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
							className={`${errors.email ? styles.error : ''} ${
								isFieldDifferent('email', touchedFields.email)
									? styles['field-updated']
									: ''
							}`}
						/>
						{errors.email && (
							<span className={styles['error-message']}>
								{errors.email.message}
							</span>
						)}
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='phone'>Phone</label>
						<input
							type='tel'
							id='phone'
							{...register('phone')}
							className={`${
								isFieldDifferent('phone', touchedFields.phone)
									? styles['field-updated']
									: ''
							}`}
						/>
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
							className={`${errors.linkedIn ? styles.error : ''} ${
								isFieldDifferent('linkedIn', touchedFields.linkedIn)
									? styles['field-updated']
									: ''
							}`}
						/>
						{errors.linkedIn && (
							<span className={styles['error-message']}>
								{errors.linkedIn.message}
							</span>
						)}
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='importance'>Importance</label>
						<select
							id='importance'
							{...register('importance')}
							className={`${
								isFieldDifferent('importance', touchedFields.importance)
									? styles['field-updated']
									: ''
							}`}
						>
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
					<label htmlFor='reasonForEmail'>Reason for reaching out:</label>
					<input
						type='text'
						id='reasonForEmail'
						{...register('reasonForEmail')}
						className={`${errors.reasonForEmail ? styles.error : ''} ${
							isFieldDifferent('reasonForEmail', touchedFields.reasonForEmail)
								? styles['field-updated']
								: ''
						}`}
						placeholder='ex: Applied for Junior Engineer Role'
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
					>
						{isUpdateMode
							? updating
								? 'Updating...'
								: 'Update Contact'
							: saving
							? 'Saving...'
							: 'Save Contact'}
					</button>
					<button
						type='button'
						name='cancel'
						onClick={handleCancel}
						className={`${styles['cancel-button']} button`}
					>
						Cancel
					</button>
				</div>

				{/* Error Detected */}
				{isUpdateMode && !Object.values(touchedFields).some(Boolean) && (
					<div className={styles['error-duplicate']}>
						<h3>Duplicate Contact Detected</h3>
					</div>
				)}
			</form>
		</div>
	);
};

export default NewContactModal;
