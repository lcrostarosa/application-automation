import { emailAPI } from '@/services/api';

// Tanstack React Query
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Context
import { useEmailContext } from '@/app/context/EmailContext';

interface EmailData {
	to: string;
	subject: string;
	cadenceType: string;
	reviewBeforeSending: boolean;
	sendWithoutReviewAfter?: string;
	body: string;
	override?: boolean;
}

interface EmailResponse {
	success: boolean;
	messageId: string;
	threadId: string;
	contact?: any;
}

export const useEmailSend = () => {
	const { setShowOverrideModal, setPendingEmail } = useEmailContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: emailAPI.send,
		onSuccess: (response: EmailResponse, emailData: EmailData) => {
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
			}
			alert(`Email sent successfully! Message ID: ${response.messageId}`);
		},
		onError: (error: any, emailData: EmailData) => {
			if (error.status === 409 && error.responseData?.sequenceExists) {
				console.log('sequence exists idiet', error.responseData.emailData);
				setPendingEmail({ ...error.responseData.emailData, override: true });
				setShowOverrideModal(true);
			} else {
				console.error('Error sending email:', error);

				alert(`Failed to send email: ${error.message}`);
			}
		},
	});
};
