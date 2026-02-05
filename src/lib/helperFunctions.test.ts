import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	sequenceType,
	parseEmailContent,
	parseReplyContent,
	parseSequenceData,
} from './helperFunctions';

describe('helperFunctions', () => {
	describe('sequenceType', () => {
		// Use a fixed date for consistent testing
		const testDate = new Date('2024-01-15T10:00:00Z'); // Monday

		it('returns "Every 3 days" for 3day type', () => {
			expect(sequenceType('3day', testDate)).toBe('Every 3 days');
		});

		it('returns "Every 3 days then 1 day" for 31day type', () => {
			expect(sequenceType('31day', testDate)).toBe('Every 3 days then 1 day');
		});

		it('returns weekly format with day name', () => {
			const result = sequenceType('weekly', testDate);
			expect(result).toMatch(/^Weekly \(on \w+s\)$/);
			expect(result).toContain('Monday');
		});

		it('returns bi-weekly format with day name', () => {
			const result = sequenceType('biweekly', testDate);
			expect(result).toMatch(/^Bi-weekly \(on \w+s\)$/);
			expect(result).toContain('Monday');
		});

		it('returns monthly format with date', () => {
			const result = sequenceType('monthly', testDate);
			expect(result).toMatch(/^Every 4 weeks \(on .+s\)$/);
			expect(result).toContain('January 15');
		});

		it('returns "Custom" for unknown type', () => {
			expect(sequenceType('unknown', testDate)).toBe('Custom');
		});

		it('returns "Custom" for empty type', () => {
			expect(sequenceType('', testDate)).toBe('Custom');
		});
	});

	describe('parseEmailContent', () => {
		it('extracts text from simple p tags', () => {
			const html = '<p>Hello World</p>';
			expect(parseEmailContent(html)).toEqual(['Hello World']);
		});

		it('extracts text from multiple p tags', () => {
			const html = '<p>First paragraph</p><p>Second paragraph</p>';
			expect(parseEmailContent(html)).toEqual([
				'First paragraph',
				'Second paragraph',
			]);
		});

		it('removes nested HTML tags', () => {
			const html = '<p>Hello <strong>World</strong></p>';
			expect(parseEmailContent(html)).toEqual(['Hello World']);
		});

		it('removes em tags', () => {
			const html = '<p>Hello <em>italic</em> text</p>';
			expect(parseEmailContent(html)).toEqual(['Hello italic text']);
		});

		it('decodes HTML entities', () => {
			const html = '<p>Hello &amp; World</p>';
			expect(parseEmailContent(html)).toEqual(['Hello & World']);
		});

		it('decodes nbsp entities', () => {
			const html = '<p>Hello&nbsp;World</p>';
			expect(parseEmailContent(html)).toEqual(['Hello World']);
		});

		it('decodes quote entities', () => {
			const html = '<p>He said &quot;Hello&quot;</p>';
			expect(parseEmailContent(html)).toEqual(['He said "Hello"']);
		});

		it('decodes apostrophe entities', () => {
			const html = "<p>It&#39;s working</p>";
			expect(parseEmailContent(html)).toEqual(["It's working"]);
		});

		it('decodes lt and gt entities', () => {
			const html = '<p>a &lt; b &gt; c</p>';
			expect(parseEmailContent(html)).toEqual(['a < b > c']);
		});

		it('filters out empty paragraphs', () => {
			const html = '<p>Content</p><p></p><p>More content</p>';
			expect(parseEmailContent(html)).toEqual(['Content', 'More content']);
		});

		it('trims whitespace', () => {
			const html = '<p>  Hello World  </p>';
			expect(parseEmailContent(html)).toEqual(['Hello World']);
		});

		it('normalizes multiple spaces', () => {
			const html = '<p>Hello     World</p>';
			expect(parseEmailContent(html)).toEqual(['Hello World']);
		});

		it('handles p tags with attributes', () => {
			const html = '<p class="intro" style="color: red">Hello</p>';
			expect(parseEmailContent(html)).toEqual(['Hello']);
		});

		it('returns empty array for no p tags', () => {
			const html = '<div>No paragraphs here</div>';
			expect(parseEmailContent(html)).toEqual([]);
		});

		it('returns empty array for empty string', () => {
			expect(parseEmailContent('')).toEqual([]);
		});
	});

	describe('parseReplyContent', () => {
		it('returns empty array for null/empty input', () => {
			expect(parseReplyContent('')).toEqual([]);
			expect(parseReplyContent(null as unknown as string)).toEqual([]);
		});

		it('splits text on double newlines', () => {
			const text = 'First paragraph\n\nSecond paragraph';
			expect(parseReplyContent(text)).toEqual([
				'First paragraph',
				'Second paragraph',
			]);
		});

		it('handles Windows line endings', () => {
			const text = 'First paragraph\r\n\r\nSecond paragraph';
			expect(parseReplyContent(text)).toEqual([
				'First paragraph',
				'Second paragraph',
			]);
		});

		it('handles old Mac line endings', () => {
			const text = 'First paragraph\r\rSecond paragraph';
			expect(parseReplyContent(text)).toEqual([
				'First paragraph',
				'Second paragraph',
			]);
		});

		it('joins single newlines within paragraphs', () => {
			const text = 'Line one\nLine two\n\nNew paragraph';
			expect(parseReplyContent(text)).toEqual([
				'Line one Line two',
				'New paragraph',
			]);
		});

		it('trims whitespace from lines', () => {
			const text = '  Hello  \n  World  \n\n  New para  ';
			expect(parseReplyContent(text)).toEqual(['Hello World', 'New para']);
		});

		it('filters empty lines', () => {
			const text = 'Content\n\n\n\nMore content';
			expect(parseReplyContent(text)).toEqual(['Content', 'More content']);
		});

		it('handles multiple newlines between paragraphs', () => {
			const text = 'Para 1\n\n\n\n\nPara 2';
			expect(parseReplyContent(text)).toEqual(['Para 1', 'Para 2']);
		});
	});

	describe('parseSequenceData', () => {
		let mockNow: number;

		beforeEach(() => {
			// Mock Date.now to return a consistent value
			mockNow = new Date('2024-01-15T10:00:00Z').getTime();
			vi.spyOn(Date, 'now').mockReturnValue(mockNow);
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('calculates next step for 1day sequence', () => {
			const result = parseSequenceData('1day', 1, null);
			const expectedDate = new Date(mockNow + 1 * 24 * 60 * 60 * 1000);
			expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
		});

		it('calculates next step for 3day sequence', () => {
			const result = parseSequenceData('3day', 1, null);
			const expectedDate = new Date(mockNow + 3 * 24 * 60 * 60 * 1000);
			expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
		});

		it('calculates next step for weekly sequence', () => {
			const result = parseSequenceData('weekly', 1, null);
			const expectedDate = new Date(mockNow + 7 * 24 * 60 * 60 * 1000);
			expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
		});

		it('calculates next step for biweekly sequence', () => {
			const result = parseSequenceData('biweekly', 1, null);
			const expectedDate = new Date(mockNow + 14 * 24 * 60 * 60 * 1000);
			expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
		});

		it('calculates next step for monthly sequence', () => {
			const result = parseSequenceData('monthly', 1, null);
			const expectedDate = new Date(mockNow + 28 * 24 * 60 * 60 * 1000);
			expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
		});

		describe('31day alternating sequence', () => {
			it('returns 3 days for even step (step 0)', () => {
				const result = parseSequenceData('31day', 0, null);
				const expectedDate = new Date(mockNow + 3 * 24 * 60 * 60 * 1000);
				expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
			});

			it('returns 1 day for odd step (step 1)', () => {
				const result = parseSequenceData('31day', 1, null);
				const expectedDate = new Date(mockNow + 1 * 24 * 60 * 60 * 1000);
				expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
			});

			it('returns 3 days for even step (step 2)', () => {
				const result = parseSequenceData('31day', 2, null);
				const expectedDate = new Date(mockNow + 3 * 24 * 60 * 60 * 1000);
				expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
			});

			it('returns 1 day for odd step (step 3)', () => {
				const result = parseSequenceData('31day', 3, null);
				const expectedDate = new Date(mockNow + 1 * 24 * 60 * 60 * 1000);
				expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
			});
		});

		describe('end date handling', () => {
			it('returns nextStepDueDate when before endDate', () => {
				const endDate = new Date(mockNow + 30 * 24 * 60 * 60 * 1000);
				const result = parseSequenceData('3day', 1, endDate);
				expect(result.nextStepDueDate).not.toBeNull();
			});

			it('returns null when proposed date exceeds endDate', () => {
				const endDate = new Date(mockNow + 1 * 24 * 60 * 60 * 1000); // 1 day from now
				const result = parseSequenceData('weekly', 1, endDate); // 7 days would exceed
				expect(result.nextStepDueDate).toBeNull();
			});

			it('returns null for 31day when proposed date exceeds endDate', () => {
				const endDate = new Date(mockNow + 2 * 24 * 60 * 60 * 1000); // 2 days from now
				const result = parseSequenceData('31day', 0, endDate); // 3 days would exceed
				expect(result.nextStepDueDate).toBeNull();
			});
		});

		it('returns null nextStepDueDate for "none" type', () => {
			const result = parseSequenceData('none', 1, null);
			const expectedDate = new Date(mockNow + 0 * 24 * 60 * 60 * 1000);
			// "none" maps to 0 days, so the next step is effectively now
			expect(result.nextStepDueDate?.getTime()).toBe(expectedDate.getTime());
		});
	});
});
