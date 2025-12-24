// Library imports
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

const NewContactModal = () => {
	const { setModalType } = useAppContext();
	const { mutate: createContact, loading: saving } = useContactCreate();

	const {
		register,
		handleSubmit,
		formState: { errors },
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
		console.log('Contact form submitted:', data);

		try {
			await createContact(data);

			reset();
			setModalType(null);
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
							className={errors.first ? styles.error : ''}
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
							className={errors.last ? styles.error : ''}
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
						<input type='text' id='company' {...register('company')} />
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='title'>Job Title</label>
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
						<input
							type='tel'
							id='phone'
							{...register('phone')}
							placeholder='(555) 123-4567'
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
							placeholder='https://linkedin.com/in/username'
							className={errors.linkedin ? styles.error : ''}
						/>
						{errors.linkedin && (
							<span className={styles['error-message']}>
								{errors.linkedin.message}
							</span>
						)}
					</div>

					<div className={styles['input-group']}>
						<label htmlFor='importance'>Importance *</label>
						<select
							id='importance'
							{...register('importance', {
								required: 'Please select importance level',
							})}
							className={errors.importance ? styles.error : ''}
						>
							<option value=''>Select importance...</option>
							<option value='1'>1 - Low Priority</option>
							<option value='2'>2 - Below Average</option>
							<option value='3'>3 - Average</option>
							<option value='4'>4 - High Priority</option>
							<option value='5'>5 - Critical</option>
						</select>
						{errors.importance && (
							<span className={styles['error-message']}>
								{errors.importance.message}
							</span>
						)}
					</div>
				</div>

				{/* Additional Fields */}
				<div className={styles['input-group']}>
					<label htmlFor='associatedRole'>Associated Role (Applying For)</label>
					<input
						type='text'
						id='associatedRole'
						{...register('associatedRole')}
						className={errors.associatedRole ? styles.error : ''}
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
						Save Contact
					</button>
					<button
						type='button'
						onClick={handleCancel}
						className={`${styles['cancel-button']} button`}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
};

export default NewContactModal;
