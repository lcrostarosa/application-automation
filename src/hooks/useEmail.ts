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

interface ContactData {
	id: number;
	active: boolean;
}

interface MessageData {
	id: number;
}

interface NewMessageResponse {
	success: boolean;
	messageId: string;
	threadId: string;
	contact?: ContactData;
	message?: MessageData;
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
				queryClient.setQueryData(
					['contact-get-unique', response.contact.id],
					(oldData: ContactData | undefined) => {
						if (!oldData) return oldData;
						return {
							...oldData,
							active: response.contact!.active,
						};
					}
				);

				queryClient.setQueryData(
					['contacts-get-all'],
					(oldData: { contacts: ContactData[] } | undefined) => {
						if (!oldData) return oldData;
						const updatedContacts = oldData.contacts.map((contact) =>
							contact.id === response.contact!.id
								? { ...contact, active: response.contact!.active }
								: contact
						);
						return { ...oldData, contacts: updatedContacts };
					}
				);

				queryClient.invalidateQueries({
					predicate: (query) =>
						[
							'contacts-get-all',
							'contact-get-unique',
							'sequences-by-contact-id',
							'all-messages-by-contact-id',
						].includes(query.queryKey[0] as string),
				});
			}
			setModalType('alert');
			setAlertMessage('Email sent successfully!');
		},
		onError: (error: Error & { status?: number; responseData?: { sequenceExists?: boolean; emailData?: NewMessageData } }) => {
			if (error.status === 409 && error.responseData?.sequenceExists) {
				setPendingEmail({ ...error.responseData.emailData, override: true });
				setModalType('override');
			} else {
				console.error('Error sending email:', error);

				setErrors([`Failed to send email: ${error.message}`]);
				setModalType('error');
			}
		},
	});
};
