import OpenAI from 'openai';

const client = new OpenAI();

type PreviousEmailContentsType = {
	contactName: string;
	previousSubject: string;
	previousBody: string;
};

type GenerateOptions = {
	keepSubject?: boolean; // if true, return previousSubject as subject
	preserveThreadContext?: boolean; // references the referencePreviousEmail col in db
};

type GeneratedMessage = {
	subject: string;
	bodyHtml: string;
	bodyPlain: string;
	generationMeta: Record<string, any>;
};

function extractJsonObject(text: string): string | null {
	const firstBrace = text.indexOf('{');
	const lastBrace = text.lastIndexOf('}');
	if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace)
		return null;
	return text.slice(firstBrace, lastBrace + 1);
}

export const generateMessage = async (
	previousEmailContents: PreviousEmailContentsType,
	options: GenerateOptions = {}
): Promise<GeneratedMessage> => {
	const model = 'gpt-5-nano';
	// const temperature = 0.2;
	const MAX_TOKENS = 5000;

	const MAX_BODY_WORDS = 100;

	const preserveThreadContext =
		typeof options.preserveThreadContext === 'boolean'
			? options.preserveThreadContext
			: true;

	// const systemInstruction = `You are an assistant that drafts professional, concise follow-up emails. Return only a single JSON object with keys: subject, bodyHtml, bodyPlain. Keep HTML minimal and safe. Do not include any extraneous commentary. Do not produce chain-of-thought or internal reasoning. Do not use em dashes or anything that might suggest this is Ai-generated. Do not use <br> tags for line breaks; use proper paragraphs. Output must be valid JSON only.`;

	const systemInstruction = `You are an assistant that drafts concise follow-up emails. RETURN ONLY a single MINIFIED JSON object with keys: subject, bodyHtml, bodyPlain. bodyPlain MUST NOT exceed ${MAX_BODY_WORDS} words. ALWAYS start a new line after the greeting/introduction. ALWAYS address the contact by name: ${previousEmailContents.contactName}. If the contact's name is not available, use a generic greeting. DO NOT output any commentary, analysis, or reasoning. Output must be valid compact JSON only.`;

	// const systemInstruction = `You are an assistant that drafts professional, concise follow-up emails. RETURN ONLY a single MINIFIED JSON object with these keys: subject, bodyHtml, bodyPlain. DO NOT output any commentary, labels, or analysis. DO NOT produce chain-of-thought or internal reasoning. Output must be valid compact JSON only.`;

	const keepSubjectNote =
		options.keepSubject && previousEmailContents.previousSubject
			? `If appropriate, keep the existing subject exactly as provided: "Re: ${previousEmailContents.previousSubject}".`
			: 'You may rewrite the subject if it will improve response rate.';

	const threadContextNote = preserveThreadContext
		? 'This is a reply-all — preserve thread context. Include a very brief excerpt (1-2 sentences) and keep key topic nouns so recipients recognize the thread.'
		: 'Do NOT include the original message body. Summarize key facts in one sentence and feel free to rewrite the subject more freely.';

	const userPrompt = `Context: this is a reply-all follow-up to the previous thread. ${keepSubjectNote} ${threadContextNote}\n\nPrevious message contents:\n${previousEmailContents.previousBody}\n\nProduce the JSON object now.`;

	const promptTemplate = `${systemInstruction}\n\n${userPrompt}`;

	let attempt = 0;
	let lastError: any = null;

	while (attempt < 2) {
		attempt += 1;
		try {
			// let response: any;
			// let usedTemperature = true;

			const response = await client.responses.create({
				model,
				input: promptTemplate,
				// temperature,
				max_output_tokens: MAX_TOKENS,
			});

			// `response.output_text` is a convenience field; fall back to assembling from output items
			const raw =
				(response as any).output_text ||
				((response as any).output &&
					(response as any).output
						.map((o: any) => o.content?.map((c: any) => c.text).join(''))
						.join('\n')) ||
				JSON.stringify(response);

			const jsonText = extractJsonObject(raw);
			if (!jsonText) throw new Error('LLM did not return a JSON object');

			let parsed: any;
			try {
				parsed = JSON.parse(jsonText);
			} catch (err) {
				throw new Error('Failed to parse JSON from LLM response');
			}

			const subject =
				options.keepSubject && previousEmailContents.previousSubject
					? previousEmailContents.previousSubject
					: parsed.subject || parsed.subject_line || '';
			const bodyHtml =
				parsed.bodyHtml || parsed.body_html || parsed.html || parsed.body || '';
			const bodyPlain =
				parsed.bodyPlain || parsed.body_plain || parsed.text || '';

			if (!bodyPlain && !bodyHtml) throw new Error('LLM response missing body');

			const generationMeta = {
				model,
				// temperature: usedTemperature ? temperature : null,
				maxTokens: MAX_TOKENS,
				preserveThreadContext,
				raw: raw.slice ? raw.slice(0, 4000) : raw,
				attempt,
			};

			console.log('Generated message meta from messageGenerationService.ts:', {
				subject,
				bodyHtml,
				bodyPlain,
				generationMeta,
			});

			return {
				subject,
				bodyHtml,
				bodyPlain,
				generationMeta,
			};
		} catch (err) {
			lastError = err;
			// retry once on transient failures
			if (attempt >= 2) break;
			await new Promise((r) => setTimeout(r, 500 * attempt));
		}
	}

	throw new Error(
		`Message generation failed: ${lastError?.message || lastError}`
	);
};
