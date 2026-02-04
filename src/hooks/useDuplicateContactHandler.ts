// src/hooks/useDuplicateContactHandler.ts
import { useState } from 'react';

// Types imports
import { ContactFormData } from '@/types/contactTypes';

export const useDuplicateContactHandler = () => {
	// Step 1: Add all your state here
	const [mismatchFields, setMismatchFields] = useState<string[]>([]);
	const [duplicateData, setDuplicateData] = useState<ContactFormData | null>(
		null
	);
	const [submittedData, setSubmittedData] = useState<ContactFormData | null>(
		null
	);
	const [isUpdateMode, setIsUpdateMode] = useState(false);
	const [contactId, setContactId] = useState<number | null>(null);

	// Step 2: Move your utility functions here
	const normalizeValue = (value: string | number | null | undefined) => {
		if (value === null || value === undefined) return '';
		return String(value).trim().toLowerCase();
	};

	interface ApiContact {
		id: number;
		firstName?: string | null;
		lastName?: string | null;
		company?: string | null;
		title?: string | null;
		email?: string | null;
		phone?: string | null;
		linkedIn?: string | null;
		importance?: number | null;
		reasonForEmail?: string | null;
	}

	// Step 3: Create processDuplicate function
	const processDuplicate = (formData: ContactFormData, apiContact: ApiContact) => {
		// Store what user originally submitted
		setSubmittedData(formData);

		// Store contact ID
		setContactId(apiContact.id);

		// Convert API contact to form format
		const normalizedApiContact: ContactFormData = {
			firstName: apiContact.firstName || '',
			lastName: apiContact.lastName || '',
			company: apiContact.company || '',
			title: apiContact.title || '',
			email: apiContact.email || '',
			phone: apiContact.phone || '',
			linkedIn: apiContact.linkedIn || '',
			importance: String(apiContact.importance || ''),
			reasonForEmail: apiContact.reasonForEmail || '',
		};

		// Find fields that are different
		const fieldsWithDifferences = (
			Object.keys(formData) as Array<keyof ContactFormData>
		).filter(
			(key) =>
				normalizeValue(formData[key]) !==
				normalizeValue(normalizedApiContact[key])
		);

		// Update all state
		setDuplicateData(normalizedApiContact);
		setMismatchFields(fieldsWithDifferences);
		setIsUpdateMode(true);

		// Return the normalized data so it can be used immediately
		return normalizedApiContact;
	};

	// Step 4: Create clearDuplicateState function
	const clearDuplicateState = () => {
		setMismatchFields([]);
		setDuplicateData(null);
		setSubmittedData(null);
		setIsUpdateMode(false);
		setContactId(null);
	};

	// Step 5: Create isFieldDifferent helper
	const isFieldDifferent = (fieldName: string, touched: boolean = false) => {
		return mismatchFields.includes(fieldName) && !touched;
	};

	// Step 6: Return everything
	return {
		mismatchFields,
		duplicateData,
		submittedData,
		isUpdateMode,
		contactId,
		processDuplicate,
		clearDuplicateState,
		isFieldDifferent,
	};
};
