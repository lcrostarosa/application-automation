// Library imports

// Styles imports
import styles from './dashboard.module.scss';

// Components imports
import PreviewTile from '../components/pageSpecificComponents/dashboard/previewTile/PreviewTile';

const Dashboard = () => {
	return (
		<div
			className={styles.dashboardHome}
			role='region'
			aria-labelledby='dashboard-title'
		>
			<section
				className={styles.welcomeSection}
				aria-labelledby='dashboard-title'
				role='region'
			>
				<h1 className={styles.welcomeTitle} id='dashboard-title'>
					Dashboard Overview
				</h1>
				<p
					className={styles.welcomeSubtitle}
					aria-describedby='dashboard-title'
				>
					Welcome to your application follow-up management center
				</p>
			</section>

			<section
				className={styles.previewTiles}
				aria-labelledby='preview-tiles-title'
			>
				<PreviewTile title='Recent Activity'>
					<div></div>
				</PreviewTile>
				<PreviewTile title='Pending & Upcoming Activities'>
					<div></div>
				</PreviewTile>
				<PreviewTile title='Active Contacts'>
					<div></div>
				</PreviewTile>
			</section>

			<section
				className={styles.quickActions}
				aria-labelledby='quick-actions-title'
				role='region'
			>
				<h2 className={styles.sectionTitle} id='quick-actions-title'>
					Quick Actions
				</h2>
			</section>
		</div>
	);
};

export default Dashboard;
