export default function LogoutButton() {
	return (
		<a
			href='/auth/logout'
			className='button logout'
			role='button'
			aria-label='Log out of your account'
		>
			Log Out
		</a>
	);
}
