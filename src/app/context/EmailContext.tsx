'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for email sending and override
import { PendingEmailData } from '@/types/emailTypes';

interface EmailContextType {
	pendingEmail: PendingEmailData | null;
	setPendingEmail: (data: PendingEmailData | null) => void;
	lastError: any;
	setLastError: (err: any) => void;
	clearEmailContext: () => void;
	resetForm: boolean;
	setResetForm: (callback: boolean) => void;
	selectedSequenceId: number | null;
	setSelectedSequenceId: (sequenceId: number | null) => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailContextProvider = ({ children }: { children: ReactNode }) => {
	const [pendingEmail, setPendingEmail] = useState<PendingEmailData | null>(
		null
	);
	const [lastError, setLastError] = useState<any>(null);
	const [resetForm, setResetForm] = useState<boolean>(false);
	const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(
		null
	);

	const clearEmailContext = () => {
		setPendingEmail(null);
		setLastError(null);
		setResetForm(true);
	};

	return (
		<EmailContext.Provider
			value={{
				pendingEmail,
				setPendingEmail,
				lastError,
				setLastError,
				clearEmailContext,
				resetForm,
				setResetForm,
				selectedSequenceId,
				setSelectedSequenceId,
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
