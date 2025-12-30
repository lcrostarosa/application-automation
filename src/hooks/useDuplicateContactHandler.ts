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
	const [isDuplicateMode, setIsDuplicateMode] = useState(false);
	const [contactId, setContactId] = useState<number | null>(null);

	// Step 2: Move your utility functions here
	const normalizeValue = (value: any) => {
		if (value === null || value === undefined) return '';
		return String(value).trim().toLowerCase();
	};

	// Step 3: Create processDuplicate function
	const processDuplicate = (formData: ContactFormData, apiContact: any) => {
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
			associatedRole: apiContact.associatedRole || '',
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
		setIsDuplicateMode(true);

		// Return the normalized data so it can be used immediately
		return normalizedApiContact;
	};

	// Step 4: Create clearDuplicateState function
	const clearDuplicateState = () => {
		setMismatchFields([]);
		setDuplicateData(null);
		setSubmittedData(null);
		setIsDuplicateMode(false);
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
		isDuplicateMode,
		contactId,
		processDuplicate,
		clearDuplicateState,
		isFieldDifferent,
	};
};
