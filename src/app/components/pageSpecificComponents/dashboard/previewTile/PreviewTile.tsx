// Library imports
import React, { ReactNode } from 'react';

// Hooks imports

// Styles imports
import styles from './previewTile.module.scss';

interface PreviewTileProps {
	title: string;
	children: ReactNode;
	className?: string;
	loading?: boolean;
	error?: boolean;
}

const PreviewTile = ({
	title,
	children,
	className,
	loading,
	error,
}: PreviewTileProps) => {
	return (
		<div className={styles.tileWrapper}>
			<h2 className={styles.tileTitle}>{title}</h2>
			{children}
		</div>
	);
};

export default PreviewTile;
