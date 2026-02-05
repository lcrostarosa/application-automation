'use client';

// Libraries imports
import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Types for email sending and override
import { PendingEmailData } from '@/types/emailTypes';

interface EmailContextType {
	pendingEmail: PendingEmailData | null;
	setPendingEmail: (data: PendingEmailData | null) => void;
	lastError: Error | null;
	setLastError: (err: Error | null) => void;
	clearEmailContext: () => void;
	resetForm: boolean;
	setResetForm: (callback: boolean) => void;
	selectedSequenceId: number | null;
	setSelectedSequenceId: (sequenceId: number | null) => void;
	emailSentId: number | null;
	setEmailSentId: (id: number | null) => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailContextProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient();
	const [pendingEmail, setPendingEmail] = useState<PendingEmailData | null>(
		null
	);
	const [lastError, setLastError] = useState<Error | null>(null);
	const [resetForm, setResetForm] = useState<boolean>(false);
	const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(
		null
	);
	const [emailSentId, setEmailSentId] = useState<number | null>(null);

	useEffect(() => {
		if (emailSentId === null) return;

		(async () => {
			try {
				const result = await fetch(`/api/messages/${emailSentId}/generate`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: emailSentId }),
				});

				if (!result.ok) {
					console.error(
						'Failed to trigger follow-up generation:',
						await result.text()
					);
					return;
				}

				const body = await result.json();

				const {
					result: { contactId },
				} = body;

				if (!contactId) {
					console.log(
						'No contactId returned from follow-up generation. Nothing to invalidate.'
					);
					return;
				}

				// Invalidate contact data to refresh any changes
				queryClient.invalidateQueries({
					queryKey: ['contact-get-unique', contactId],
				});
				queryClient.invalidateQueries({ queryKey: ['contacts-get-all'] });
				queryClient.invalidateQueries({
					queryKey: ['sequences-by-contact-id', contactId],
				});
				queryClient.invalidateQueries({
					queryKey: ['all-messages-by-contact-id', contactId],
				});
				queryClient.invalidateQueries({
					queryKey: ['pending-messages-get-all'],
				});
			} catch (error) {
				console.error('Error triggering follow-up generation:', error);
			} finally {
				setEmailSentId(null);
			}
		})();
		setEmailSentId(null);
	}, [emailSentId]);

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
				emailSentId,
				setEmailSentId,
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
