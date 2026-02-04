// Styles imports
import styles from './pageTemplate.module.scss';

const PageTemplate = async ({
	children,
	title,
	description,
}: {
	children: React.ReactNode;
	title: string;
	description: string;
}) => {
	return (
		<div className={styles['page-wrapper']}>
			<section className={styles['header-section']}>
				<h1 className={styles.welcomeTitle} id='contacts-title'>
					{title}
				</h1>
				<p className={styles.welcomeSubtitle} aria-describedby='contacts-title'>
					{description}
				</p>
			</section>
			<section className={styles['page-content']}>{children}</section>
		</div>
	);
};

export default PageTemplate;
