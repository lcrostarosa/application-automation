// Library imports
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

// Hooks imports
import { useContactCreate } from '@/hooks/useContact';

// Styles imports
import styles from './newContactModal.module.scss';

// Components imports

// Context imports
import { useAppContext } from '@/app/context/AppContext';

interface ContactFormData {
	first: string;
	last: string;
	company: string;
	title: string;
	email: string;
	phone: string;
	linkedin: string;
	importance: string;
	associatedRole?: string;
}

interface DuplicateContact {
	first: string;
	last: string;
	company: string;
	title: string;
	email: string;
	phone: string;
	linkedin: string;
	importance: string;
	associatedRole: string;
}

const NewContactModal = () => {
	const { setModalType, duplicateContact, setDuplicateContact } =
		useAppContext();
	const { mutate: createContact, loading: saving } = useContactCreate();
	const [submittedData, setSubmittedData] = useState<ContactFormData | null>(
		null
	);
	const [duplicateData, setDuplicateData] = useState<DuplicateContact | null>(
		null
	);

	const {
		register,
		handleSubmit,
		formState: { touchedFields, errors },
		reset,
	} = useForm<ContactFormData>({
		defaultValues: {
			first: '',
			last: '',
			company: '',
			title: '',
			email: '',
			phone: '',
			linkedin: '',
			importance: '',
			associatedRole: '',
		},
	});

	const onSubmit: SubmitHandler<ContactFormData> = async (data) => {
		try {
			const response = await createContact(data);

			// Handle duplicate contact scenario
			if (response.success === false && response.duplicate) {
				setSubmittedData(data);
				console.log('Duplicate contact detected:', response.existingContact);
				const duplicateData: DuplicateContact = {
					first: response.existingContact?.firstName || '',
					last: response.existingContact?.lastName || '',
					company: response.existingContact?.company || '',
					title: response.existingContact?.title || '',
					email: response.existingContact?.email || '',
					phone: response.existingContact?.phone || '',
					linkedin: response.existingContact?.linkedIn || '',
					importance: response.existingContact?.importance?.toString() || '',
					associatedRole: response.existingContact?.associatedRole || '',
				};

				setDuplicateData(duplicateData);
				reset({
					...duplicateData,
				});
				return;
			}

			reset();
			setModalType(null);
			setSubmittedData(null);
			setDuplicateContact(false);
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	const handleCancel = () => {
		reset();
		setModalType(null);
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
							id='first'
							{...register('first', {
								required: 'First name is required',
								minLength: {
									value: 2,
									message: 'First name must be at least 2 characters',
								},
							})}
							className={`${errors.first ? styles.error : ''} ${
								submittedData?.first !== duplicateData?.first &&
								!touchedFields.first
									? styles['field-updated']
									: ''
							}`}
						/>
						{errors.first && (
							<span className={styles['error-message']}>
								{errors.first.message}
							</span>
						)}
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='last'>Last Name *</label>
						<input
							type='text'
							id='last'
							{...register('last', {
								required: 'Last name is required',
								minLength: {
									value: 2,
									message: 'Last name must be at least 2 characters',
								},
							})}
							className={`${errors.last ? styles.error : ''} ${
								submittedData?.last !== duplicateData?.last &&
								!touchedFields.last
									? styles['field-updated']
									: ''
							}`}
						/>
						{errors.last && (
							<span className={styles['error-message']}>
								{errors.last.message}
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
								submittedData?.company !== duplicateData?.company &&
								!touchedFields.company
									? styles['field-updated']
									: ''
							}`}
						/>
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='title'>Job Title</label>
						<input
							type='text'
							id='title'
							{...register('title')}
							className={`${
								submittedData?.title !== duplicateData?.title &&
								!touchedFields.title
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
								submittedData?.email !== duplicateData?.email &&
								!touchedFields.email
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
								submittedData?.phone !== duplicateData?.phone &&
								!touchedFields.phone
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
							id='linkedin'
							{...register('linkedin', {
								pattern: {
									value: /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i,
									message: 'Please enter a valid LinkedIn URL',
								},
							})}
							className={`${errors.linkedin ? styles.error : ''} ${
								submittedData?.linkedin !== duplicateData?.linkedin &&
								!touchedFields.linkedin
									? styles['field-updated']
									: ''
							}`}
						/>
						{errors.linkedin && (
							<span className={styles['error-message']}>
								{errors.linkedin.message}
							</span>
						)}
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='importance'>Importance</label>
						<select
							id='importance'
							{...register('importance')}
							className={`${
								submittedData?.importance !== duplicateData?.importance &&
								!touchedFields.importance
									? styles['field-updated']
									: ''
							}`}
						>
							<option value=''>Select importance...</option>
							<option value='1'>1 - Low Priority</option>
							<option value='2'>2 - Below Average</option>
							<option value='3'>3 - Average</option>
							<option value='4'>4 - High Priority</option>
							<option value='5'>5 - Critical</option>
						</select>
					</div>
				</div>

				{/* Additional Fields */}
				<div className={styles['input-group']}>
					<label htmlFor='associatedRole'>Associated Role (Applying For)</label>
					<input
						type='text'
						id='associatedRole'
						{...register('associatedRole')}
						className={`${errors.associatedRole ? styles.error : ''} ${
							submittedData?.associatedRole !== duplicateData?.associatedRole &&
							!touchedFields.associatedRole
								? styles['field-updated']
								: ''
						}`}
						placeholder='ex: Junior Engineer'
					/>
					{errors.associatedRole && (
						<span className={styles['error-message']}>
							{errors.associatedRole.message}
						</span>
					)}
				</div>

				{/* Action Buttons */}
				<div className={styles['form-actions']}>
					<button
						type='submit'
						className={`${styles['save-button']} button contact`}
					>
						{duplicateContact
							? saving
								? 'Updating...'
								: 'Update Contact'
							: saving
							? 'Saving...'
							: 'Save Contact'}
					</button>
					<button
						type='button'
						onClick={handleCancel}
						className={`${styles['cancel-button']} button`}
					>
						Cancel
					</button>
				</div>

				{/* Error Detected */}
				{duplicateContact && !Object.values(touchedFields).some(Boolean) && (
					<div className={styles['error-duplicate']}>
						<h3>Duplicate Contact Detected</h3>
					</div>
				)}
			</form>
		</div>
	);
};

export default NewContactModal;
