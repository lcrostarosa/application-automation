import OpenAI from 'openai';

const client = new OpenAI();

type GenerateOptions = {
	previousSubject?: string;
	keepSubject?: boolean; // if true, return previousSubject as subject
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
	previousEmailContents: string,
	options: GenerateOptions = {}
): Promise<GeneratedMessage> => {
	const model = 'gpt-5-nano';
	const temperature = 0.2;
	const maxTokens = 300;

	const systemInstruction = `You are an assistant that drafts professional, concise follow-up emails. Return only a single JSON object with keys: subject, bodyHtml, bodyPlain. Keep HTML minimal and safe. Do not include any extraneous commentary.`;

	const keepSubjectNote =
		options.keepSubject && options.previousSubject
			? `If appropriate, keep the existing subject exactly as provided: "Re: ${options.previousSubject}".`
			: 'You may rewrite the subject if it will improve response rate.';

	const userPrompt = `Context: this is a reply-all follow-up to the previous thread. ${keepSubjectNote}\n\nPrevious message contents:\n${previousEmailContents}\n\nProduce the JSON object now.`;

	const promptTemplate = `${systemInstruction}\n\n${userPrompt}`;

	let attempt = 0;
	let lastError: any = null;
	while (attempt < 2) {
		attempt += 1;
		try {
			const response = await client.responses.create({
				model,
				input: promptTemplate,
				temperature,
				max_output_tokens: maxTokens,
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
				options.keepSubject && options.previousSubject
					? options.previousSubject
					: parsed.subject || parsed.subject_line || '';
			const bodyHtml =
				parsed.bodyHtml || parsed.body_html || parsed.html || parsed.body || '';
			const bodyPlain =
				parsed.bodyPlain || parsed.body_plain || parsed.text || '';

			if (!bodyPlain && !bodyHtml) throw new Error('LLM response missing body');

			const generationMeta = {
				model,
				temperature,
				maxTokens,
				raw: raw.slice ? raw.slice(0, 4000) : raw,
				attempt,
			};

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
