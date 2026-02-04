// Hooks imports
import {
	useSequenceDeactivate,
	useSequenceDeactivateAll,
} from '@/hooks/useSequence';

// Styles imports
import styles from './deactivateSequenceModal.module.scss';

// Components imports
import ModalBackButton from '@/app/components/buttons/ModalBackButton';

// Context imports
import { useAppContext } from '@/app/context/AppContext';
import { useEmailContext } from '@/app/context/EmailContext';

// Types imports

const DeactivateSequenceModal = ({
	allSequences,
}: {
	allSequences?: boolean;
}) => {
	const { setModalType } = useAppContext();
	const { setSelectedSequenceId, selectedSequenceId } = useEmailContext();
	const { mutateAsync: deactivateSequence, isPending: deactivating } =
		useSequenceDeactivate(selectedSequenceId!);
	const { mutateAsync: deactivateAllSequences, isPending: deactivatingAll } =
		useSequenceDeactivateAll();

	const handleDelete = async () => {
		if (allSequences) {
			try {
				await deactivateAllSequences();
				setModalType(null);
				return;
			} catch (error) {
				console.error('Error deactivating all sequences:', error);
				return;
			}
		}

		try {
			await deactivateSequence(selectedSequenceId!);
			setModalType(null);
			setSelectedSequenceId(null);
		} catch (error) {
			console.error('Error deactivating sequence:', error);
		}
	};

	return (
		<div className={styles['deletecontactmodal-wrapper']}>
			<p className={styles.message}>
				{allSequences ?
					'Permanently deactivate all sequences?'
				:	'Permanently deactivate this sequence?'}
			</p>
			<div className={styles.buttons}>
				<button
					type='button'
					className={'button delete'}
					onClick={handleDelete}
					disabled={deactivating || deactivatingAll}
				>
					Deactivate
				</button>
				<ModalBackButton modalRedirect={null} title='Cancel' />
			</div>
		</div>
	);
};

export default DeactivateSequenceModal;
