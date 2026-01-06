'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for email sending and override
export interface PendingEmailData {
	to: string;
	subject: string;
	cadenceType: string;
	reviewBeforeSending: boolean;
	sendWithoutReviewAfter?: string;
	body: string;
	override?: boolean;
}

interface EmailContextType {
	pendingEmail: PendingEmailData | null;
	setPendingEmail: (data: PendingEmailData | null) => void;
	showOverrideModal: boolean;
	setShowOverrideModal: (show: boolean) => void;
	lastError: any;
	setLastError: (err: any) => void;
	clearEmailContext: () => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailContextProvider = ({ children }: { children: ReactNode }) => {
	const [pendingEmail, setPendingEmail] = useState<PendingEmailData | null>(
		null
	);
	const [showOverrideModal, setShowOverrideModal] = useState(false);
	const [lastError, setLastError] = useState<any>(null);

	const clearEmailContext = () => {
		setPendingEmail(null);
		setShowOverrideModal(false);
		setLastError(null);
	};

	return (
		<EmailContext.Provider
			value={{
				pendingEmail,
				setPendingEmail,
				showOverrideModal,
				setShowOverrideModal,
				lastError,
				setLastError,
				clearEmailContext,
			}}
		>
			{children}
		</EmailContext.Provider>
	);
};

export const useEmailContext = (): EmailContextType => {
	const context = useContext(EmailContext);
	if (!context) {
		throw new Error(
			'useEmailContext must be used within an EmailContextProvider'
		);
	}
	return context;
};
