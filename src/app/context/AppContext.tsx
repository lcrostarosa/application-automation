'use client';

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';

import { useMediaQuery } from '@mui/material';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface ContextProviderProps {
	children: ReactNode;
}

export const ContextProvider = ({ children }: ContextProviderProps) => {
	const [hydrated, setHydrated] = useState(false);
	const [isTouchDevice, setIsTouchDevice] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalType, setModalType] = useState<string | null>(null);

	// Auto-sync isModalOpen with modalType
	useEffect(() => {
		setIsModalOpen(!!modalType);
	}, [modalType]);

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
