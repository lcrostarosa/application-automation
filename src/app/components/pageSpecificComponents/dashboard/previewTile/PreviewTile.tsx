// Library imports
import React, { ReactNode } from 'react';
import Link from 'next/link';

// Hooks imports

// Styles imports
import styles from './previewTile.module.scss';

interface PreviewTileProps {
	title: string;
	children: ReactNode;
	className?: string;
	loading?: boolean;
	error?: boolean;
	href?: string;
}

const PreviewTile = ({
	title,
	children,
	className: _className,
	loading: _loading,
	error: _error,
	href,
}: PreviewTileProps) => {
	return (
		<div className={styles.tileWrapper}>
			<Link href={href || '/dashboard'} className={styles.tileHeader}>
				<h2 className={styles.tileTitle}>{title}</h2>
			</Link>
			{children}
		</div>
	);
};

export default PreviewTile;
