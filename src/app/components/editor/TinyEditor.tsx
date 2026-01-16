'use client';

// Library imports
import { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor } from 'tinymce';

// Styles imports
import styles from './tinyEditor.module.scss';

const TinyEditor = ({
	height,
	initialValue,
	setEditorContent,
}: {
	height?: number;
	initialValue?: string;
	setEditorContent: (content: string) => void;
}) => {
	const editorRef = useRef<TinyMCEEditor | null>(null);

	const [value, setValue] = useState<string>(initialValue || '');
	const sizeLimit = 4000;

	const handleEditorChange = (content: string, editor: TinyMCEEditor) => {
		const length = editor.getContent({ format: 'text' }).length;
		if (length <= sizeLimit) {
			setValue(content);
			setEditorContent(content);
		}
	};

	const handleBeforeAddUndo = (evt: any, editor: TinyMCEEditor) => {
		const length = editor.getContent({ format: 'text' }).length;
		if (length > sizeLimit) {
			evt.preventDefault();
		}
	};

	return (
		<div className={styles.editorContainer}>
			<Editor
				id='tiny-editor'
				apiKey='smh31v60fpm15ps7kl66wjz9tj2hiw8z2mha2fk414vegawf'
				value={value}
				onInit={(_evt, editor) => {
					editorRef.current = editor;
				}}
				onEditorChange={handleEditorChange}
				onBeforeAddUndo={handleBeforeAddUndo}
				initialValue={initialValue || '<p></p>'}
				init={{
					height: height || 500,
					menubar: false,
					plugins: [
						'advlist',
						'autolink',
						'lists',
						'link',
						'image',
						'charmap',
						'preview',
						'anchor',
						'searchreplace',
						'visualblocks',
						'code',
						'fullscreen',
						'insertdatetime',
						'media',
						'table',
						'code',
					],
					placeholder: 'Compose your email here...',
					toolbar:
						'undo redo | blocks | ' +
						'bold italic forecolor | alignleft aligncenter ' +
						'alignright alignjustify | bullist numlist outdent indent | ' +
						'removeformat ',
					toolbar_location: 'bottom',
					content_style:
						'body { font-family:Calibri,Arial,sans-serif; font-size:16px; margin:.75rem;}',
					// 'p { margin: 0; padding: 0; }' +
					// 'div { margin: 0; padding: 0; }',
					statusbar: false,
					maxlength: 4500,
				}}
			/>
		</div>
	);
};

export default TinyEditor;
