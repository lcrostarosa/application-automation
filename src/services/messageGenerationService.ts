import OpenAI from 'openai';

const client = new OpenAI();

type PreviousEmailContentsType = {
	contactName: string | null;
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
	const model = 'gpt-4o-mini';
	const MAX_TOKENS = 1000;
	const MAX_BODY_WORDS = 100;

	const preserveThreadContext =
		typeof options.preserveThreadContext === 'boolean'
			? options.preserveThreadContext
			: true;

	const systemInstruction = `RETURN ONLY one MINIFIED JSON object with keys: subject, bodyHtml, bodyPlain. bodyPlain MUST be <= ${MAX_BODY_WORDS} words. NO commentary, analysis, chain-of-thought, or role-play as any recipient. Use proper paragraphs (no <br>). Tone: polite, concise, "checking in". No em dashes.`;

	const keepSubjectNote =
		options.keepSubject && previousEmailContents.previousSubject
			? `Keep the existing subject exactly as provided.`
			: 'You may rewrite the subject if it will improve response rate.';

	const contactNameNote = previousEmailContents.contactName
		? `Address the contact by name like "Hi ${previousEmailContents.contactName},".`
		: 'No contact name was provided, so use a generic greeting like "Hi," or "Hello,".';

	const userPrompt = `Context: You are a professional executive assistant acting as the original sender. You are writing a short follow-up email no longer than 3 sentences or ${MAX_BODY_WORDS} words in length. ${keepSubjectNote} ${
		preserveThreadContext
			? 'Preserve thread context, if it makes sense to, include a very brief reference to the previous message (1-2 sentences MAX), and keep key topic nouns so recipients recognize the thread.'
			: 'Do NOT include the full original body; summarize key facts in one sentence and feel free to rewrite the body a little more freely.'
	} ${contactNameNote} Include one short check-in CTA (e.g., "Are you available for a 15-minute call next week?"). Make sure the CTA is not identical to the previously used CTA. Sign off the exact same as the previous message did. Here is the previous message for context:\n${
		previousEmailContents.previousBody
	}\n\nProduce the compact JSON object now.`;

	const promptTemplate = `${systemInstruction}\n\n${userPrompt}`;

	console.log('GPT Prompt Template:', promptTemplate);

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
				max_output_tokens: MAX_TOKENS,
				temperature: 0.2,
			});

			console.log('Response from OpenAI:', response);

			if (response.status === 'incomplete') {
				throw new Error(
					`LLM response incomplete: ${
						response.incomplete_details?.reason || 'unknown reason'
					}`
				);
			}

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
					? previousEmailContents.previousSubject.includes('Re: ')
						? previousEmailContents.previousSubject
						: `Re: ${previousEmailContents.previousSubject}`
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

			// console.log('Generated message meta from messageGenerationService.ts:', {
			// 	subject,
			// 	bodyHtml,
			// 	bodyPlain,
			// 	generationMeta,
			// });

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
