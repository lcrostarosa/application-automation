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

interface NewMessageResponse {
	success: boolean;
	messageId: string;
	threadId: string;
	contact?: any;
}

export const useEmailSend = () => {
	const { setModalType, setAlertMessage } = useAppContext();
	const { setPendingEmail } = useEmailContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: emailAPI.send,
		onSuccess: (response: NewMessageResponse, emailData: NewMessageData) => {
			if (response.contact) {
				queryClient.setQueryData(
					['contact-get-unique', response.contact.id],
					(oldData: any) => {
						return {
							...oldData,
							active: response.contact.active,
						};
					}
				);

				queryClient.setQueryData(['contacts-get-all'], (oldData: any) => {
					if (!oldData) return oldData;
					const updatedContacts = oldData.contacts.map((contact: any) =>
						contact.id === response.contact.id
							? { ...contact, active: response.contact.active }
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
		onError: (error: any, emailData: NewMessageData) => {
			if (error.status === 409 && error.responseData?.sequenceExists) {
				setPendingEmail({ ...error.responseData.emailData, override: true });
				setModalType('override');
			} else {
				console.error('Error sending email:', error);

				alert(`Failed to send email: ${error.message}`);
			}
		},
	});
};
