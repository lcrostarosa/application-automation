import { emailAPI } from '@/services/api';

// Tanstack React Query
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Context
import { useAppContext } from '@/app/context/AppContext';
import { useEmailContext } from '@/app/context/EmailContext';

interface NewMessageData {
	to: string;
	subject: string;
	cadenceType: string;
	autoSend: boolean;
	autoSendDelay?: string;
	cadenceDuration: string;
	body: string;
	override?: boolean;
	referencePreviousEmail?: boolean | null;
	alterSubjectLine?: boolean | null;
}

interface ContactInfo {
	id: number;
	active: boolean;
}

interface MessageInfo {
	id: number;
}

interface NewMessageResponse {
	success: boolean;
	messageId: string;
	threadId: string;
	contact?: ContactInfo;
	message?: MessageInfo;
	newContact?: boolean;
}

export const useEmailSend = () => {
	const { setModalType, setAlertMessage, setErrors } = useAppContext();
	const { setPendingEmail, setEmailSentId } = useEmailContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: emailAPI.send,
		onSuccess: (response: NewMessageResponse, emailData: NewMessageData) => {
			if (response?.message?.id && emailData.cadenceType !== 'none') {
				setEmailSentId(Number(response.message.id));
			}

			if (response.contact) {
				const contactId = response.contact.id;
				const contactActive = response.contact.active;
				queryClient.setQueryData(
					['contact-get-unique', contactId],
					(oldData: Record<string, unknown> | undefined) => {
						return {
							...oldData,
							active: contactActive,
						};
					}
				);

				queryClient.setQueryData(['contacts-get-all'], (oldData: { contacts: Array<{ id: number; active: boolean }> } | undefined) => {
					if (!oldData) return oldData;
					const updatedContacts = oldData.contacts.map((contact) =>
						contact.id === contactId
							? { ...contact, active: contactActive }
							: contact
					);
					return { ...oldData, contacts: updatedContacts };
				});

				// Invalidate contact query to refresh data
				queryClient.invalidateQueries({
					queryKey: ['contact-get-unique', response.contact.id],
				});
				queryClient.invalidateQueries({ queryKey: ['contacts-get-all'] });
				queryClient.invalidateQueries({
					queryKey: ['sequences-by-contact-id'],
				});
				queryClient.invalidateQueries({
					queryKey: ['all-messages-by-contact-id'],
				});
			}
			setModalType('alert');
			setAlertMessage('Email sent successfully!');
		},
		onError: (error: Error & { status?: number; responseData?: { sequenceExists?: boolean; emailData?: NewMessageData } }) => {
			if (error.status === 409 && error.responseData?.sequenceExists) {
				setPendingEmail({ ...error.responseData.emailData!, override: true });
				setModalType('override');
			} else {
				console.error('Error sending email:', error);

				setErrors([`Failed to send email: ${error.message}`]);
				setModalType('error');
			}
		},
	});
};
