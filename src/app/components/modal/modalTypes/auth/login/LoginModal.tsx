'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

// Styles imports
import styles from './loginModal.module.scss';

// Context imports
import { useAppContext } from '@/app/context/AppContext';

interface LoginFormData {
	email: string;
	password: string;
}

export default function LoginModal() {
	const { setModalType } = useAppContext();

	// Form handling for email/password login (currently commented out in JSX)
	const [_isLoading, _setIsLoading] = useState(false);
	const {
		register: _register,
		handleSubmit: _handleSubmit,
		formState: { errors: _errors },
		reset: _reset,
	} = useForm<LoginFormData>();

	// Keeping for future email/password login implementation
	const _onSubmit = async (data: LoginFormData) => {
		_setIsLoading(true);
		try {
			// Handle email/password login here
			console.log('Login attempt:', data);
			// You would typically call your authentication API here
		} catch (error) {
			console.error('Login error:', error);
		} finally {
			_setIsLoading(false);
			_reset();
		}
	};

	const handleSocialLogin = (provider: string) => {
		if (provider === 'apple' || provider === 'microsoft') {
			return;
		}

		// Redirect to Auth0 with specific provider
		window.location.href = `/auth/login?connection=${provider}`;
	};

	return (
		<div className={styles.loginModal}>
			{/* Email/Password Form */}
			{/* <form onSubmit={handleSubmit(onSubmit)} className={styles.authForm}>
				<div className={styles.formGroup}>
					<label htmlFor='email'>Email</label>
					<input
						id='email'
						type='email'
						{...register('email', {
							required: 'Email is required',
							pattern: {
								value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
								message: 'Invalid email address',
							},
						})}
						className={errors.email ? styles.error : ''}
						placeholder='Enter your email'
					/>
					{errors.email && (
						<span className={styles.errorMessage}>{errors.email.message}</span>
					)}
				</div>

				<div className={styles.formGroup}>
					<label htmlFor='password'>Password</label>
					<input
						id='password'
						type='password'
						{...register('password', {
							required: 'Password is required',
							minLength: {
								value: 6,
								message: 'Password must be at least 6 characters',
							},
						})}
						className={errors.password ? styles.error : ''}
						placeholder='Enter your password'
					/>
					{errors.password && (
						<span className={styles.errorMessage}>
							{errors.password.message}
						</span>
					)}
				</div>

				<button type='submit' disabled={isLoading} className={styles.submitBtn}>
					{isLoading ? 'Signing in...' : 'Sign In'}
				</button>
			</form>

			<div className={styles.divider}>
				<span>or</span>
			</div> */}

			{/* Social Login Buttons */}
			<div className={styles.socialLoginSection}>
				<button
					type='button'
					onClick={() => handleSocialLogin('google-oauth2')}
					className={`${styles.socialLoginBtn} ${styles.google}`}
				>
					<svg viewBox='0 0 24 24' width='20' height='20'>
						<path
							fill='#4285F4'
							d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
						/>
						<path
							fill='#34A853'
							d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
						/>
						<path
							fill='#FBBC05'
							d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
						/>
						<path
							fill='#EA4335'
							d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
						/>
					</svg>
					Continue with Google
				</button>

				<button
					type='button'
					onClick={() => handleSocialLogin('apple')}
					className={`${styles.socialLoginBtn} ${styles.apple}`}
				>
					<svg viewBox='0 0 24 24' width='20' height='20'>
						<path
							fill='currentColor'
							d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'
						/>
					</svg>
					Continue with Apple
				</button>

				<button
					type='button'
					onClick={() => handleSocialLogin('microsoft')}
					className={`${styles.socialLoginBtn} ${styles.microsoft}`}
				>
					<svg viewBox='0 0 24 24' width='20' height='20'>
						<path fill='#f25022' d='M1 1h10v10H1z' />
						<path fill='#7fba00' d='M13 1h10v10H13z' />
						<path fill='#00a4ef' d='M1 13h10v10H1z' />
						<path fill='#ffb900' d='M13 13h10v10H13z' />
					</svg>
					Continue with Microsoft
				</button>
			</div>

			<div className={styles.authFooter}>
				<p>
					Don&apos;t have an account?{' '}
					<button
						type='button'
						className={styles.linkBtn}
						onClick={() => setModalType('register')}
					>
						Sign up
					</button>
				</p>
				<button type='button' className={styles.linkBtn}>
					Forgot password?
				</button>
			</div>
		</div>
	);
}
