export const sequenceType = (type: string, startDate: Date) => {
	const sequenceTypes: { [key: string]: string } = {
		'3day': 'Every 3 days',
		'31day': 'Every 3 days then 1 day',
		weekly: `Weekly (on ${startDate.toLocaleDateString('en-US', {
			weekday: 'long',
		})}s)`,
		biweekly: `Bi-weekly (on ${startDate.toLocaleDateString('en-US', {
			weekday: 'long',
		})}s)`,
		monthly: `Every 4 weeks (on ${startDate.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
		})}s)`,
	};

	return sequenceTypes[type] || 'Custom';
};

export const parseEmailContent = (htmlString: string): string[] => {
	// Extract content from <p> tags using regex
	const pTagRegex = /<p[^>]*>(.*?)<\/p>/gi;
	const matches = htmlString.matchAll(pTagRegex);

	const textArray = Array.from(matches)
		.map((match) => {
			// Get the content inside <p> tags
			let text = match[1];

			// Remove HTML tags (like <strong>, <em>, etc.)
			text = text.replace(/<[^>]+>/g, '');

			// Decode common HTML entities
			text = text
				.replace(/&nbsp;/g, ' ')
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'");

			// Trim and normalize whitespace
			return text.trim().replace(/\s+/g, ' ');
		})
		.filter((text) => text.length > 0);

	return textArray;
};

export const parseSequenceData = (
	sequenceType: string,
	currentStep: number,
	endDate: Date | null
) => {
	const cadenceTypeMapping: { [key: string]: number } = {
		'1day': 1,
		'3day': 3,
		'31day': 31,
		weekly: 7,
		biweekly: 14,
		monthly: 28,
		none: 0,
	};

	const nextStepDueDateHelper = (
		sequenceType: string,
		currentStep: number,
		endDate: Date | null
	) => {
		if (sequenceType === '31day') {
			const days = currentStep % 2 === 0 ? 3 : 1;
			const proposedDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
			const nextStepDueDate =
				endDate && proposedDueDate > endDate ? null : proposedDueDate;
			return { nextStepDueDate };
		} else {
			const days = cadenceTypeMapping[sequenceType];
			const proposedDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
			const nextStepDueDate =
				endDate && proposedDueDate > endDate ? null : proposedDueDate;
			return { nextStepDueDate };
		}
	};

	const { nextStepDueDate } = nextStepDueDateHelper(
		sequenceType,
		currentStep,
		endDate
	);

	return { nextStepDueDate };
};
