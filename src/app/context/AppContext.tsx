'use client';

// Libraries imports
import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

// MUI imports
import { useMediaQuery } from '@mui/material';

// Types imports
import { ContactFromDB } from '@/types/contactTypes';

interface AppContextType {
	isTouchDevice: boolean;
	isMobile: boolean;
	isMobileWidth: boolean;
	isSmallTablet: boolean;
	isTablet: boolean;
	isTabletWidth: boolean;
	hydrated: boolean;
	isModalOpen: boolean;
	setIsModalOpen: (type: boolean) => void;
	modalType: string | null;
	setModalType: (type: string | null) => void;
	duplicateContact?: boolean;
	setDuplicateContact: (type: boolean) => void;
	selectedContact: ContactFromDB | null;
	setSelectedContact: (contact: ContactFromDB | null) => void;
	errors: string[];
	setErrors: (errors: string[]) => void;
	clearErrors: () => void;
	alertMessage: string | null;
	setAlertMessage: (message: string | null) => void;
	loading: boolean;
	setLoading: (loading: boolean) => void;
	loadingMessage: string | null;
	setLoadingMessage: (message: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface ContextProviderProps {
	children: ReactNode;
}

export const ContextProvider = ({ children }: ContextProviderProps) => {
	const pathname = usePathname();

	const [hydrated, setHydrated] = useState(false);
	const [isTouchDevice, setIsTouchDevice] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalType, setModalType] = useState<string | null>(null);
	const [duplicateContact, setDuplicateContact] = useState<boolean>(false);
	const [selectedContact, setSelectedContact] = useState<ContactFromDB | null>(
		null
	);
	const [errors, setErrors] = useState<string[]>([]);
	const [alertMessage, setAlertMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
	const clearErrors = () => {
		setErrors([]);
		setModalType(null);
	};

	// Auto-sync isModalOpen with modalType
	useEffect(() => {
		setIsModalOpen(!!modalType);
	}, [modalType]);

	// Reset selectedContact on pathname change
	useEffect(() => {
		setSelectedContact(null);
	}, [pathname]);

	// Fallback defaults for SSR — assumes desktop/non-touch
	const fallback = {
		isTouchDevice: false,
		isMobile: false,
		isMobileWidth: false,
		isSmallTablet: false,
		isTablet: false,
		isTabletWidth: false,
		hydrated: false,
		isModalOpen: false,
		setIsModalOpen: () => {},
		modalType: null,
		setModalType: () => {},
		duplicateContact: false,
		setDuplicateContact: () => {},
		selectedContact: null,
		setSelectedContact: () => {},
		errors: [],
		setErrors: () => {},
		clearErrors: () => {},
		alertMessage: null,
		setAlertMessage: () => {},
		loading: false,
		setLoading: () => {},
		loadingMessage: null,
		setLoadingMessage: () => {},
	};

	// Client-side checks only after hydration
	useEffect(() => {
		setHydrated(true);

		// Detect touch device
		const mq = window.matchMedia('(pointer: coarse)');
		setIsTouchDevice(mq.matches);

		const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	}, []);

	const rawMobileWidth = useMediaQuery(
		'(max-width: 550px) and (orientation: portrait)'
	);
	const rawMobileHeight = useMediaQuery(
		'(max-height: 550px) and (orientation: landscape)'
	);
	const rawTabletWidth = useMediaQuery(
		'(max-width: 950px) and (orientation: portrait)'
	);
	const rawTabletHeight = useMediaQuery(
		'(max-height: 850px) and (orientation: landscape)'
	);
	const rawSmallTablet = useMediaQuery(
		'(max-height: 850px) and (max-width: 850px)'
	);

	const isMobileWidth = hydrated ? rawMobileWidth : false;
	const isMobileHeight = hydrated ? rawMobileHeight : false;
	const isTabletWidth = hydrated ? rawTabletWidth : false;
	const isTabletHeight = hydrated ? rawTabletHeight : false;

	const isMobile = isMobileWidth || isMobileHeight;
	const isSmallTablet = hydrated ? rawSmallTablet : false;
	const isTablet = isTabletWidth || isTabletHeight;

	// Merge fallback values until hydration completes
	const contextValue = hydrated
		? {
				isTouchDevice,
				isMobile,
				isMobileWidth,
				isSmallTablet,
				isTablet,
				isTabletWidth,
				hydrated,
				isModalOpen,
				setIsModalOpen,
				modalType,
				setModalType,
				duplicateContact,
				setDuplicateContact,
				selectedContact,
				setSelectedContact,
				errors,
				setErrors,
				clearErrors,
				alertMessage,
				setAlertMessage,
				loading,
				setLoading,
				loadingMessage,
				setLoadingMessage,
		  }
		: fallback;

	return (
		<AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
	);
};

export const useAppContext = (): AppContextType => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useAppContext must be used within a ContextProvider');
	}
	return context;
};
