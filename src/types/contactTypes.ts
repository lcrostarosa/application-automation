export interface ContactFormData {
	firstName: string;
	lastName: string;
	company: string;
	title: string;
	email: string;
	phone: string;
	linkedIn: string;
	importance: string;
	associatedRole: string;
}

export interface ContactData {
	firstName: string;
	lastName: string;
	company?: string;
	title?: string;
	email: string;
	phone?: string;
	linkedIn?: string;
	importance?: string;
	associatedRole?: string;
}

export interface ContactResponse {
	success: boolean;
	duplicate?: boolean;
	existingContact?: {
		id: number;
		firstName: string;
		lastName: string;
		company: string;
		title: string;
		email: string;
		phone: string;
		linkedIn: string;
		importance: number;
		associatedRole: string;
	};
	contact: {
		id: number;
		firstName: string;
		lastName: string;
		company?: string;
		title?: string;
		email: string;
		phone?: string;
		linkedIn?: string;
		importance?: number;
		associatedRole?: string;
		createdAt: string;
		updatedAt: string;
	};
}

export interface ContactUpdateData {
	id: number;
	firstName?: string;
	lastName?: string;
	company?: string;
	title?: string;
	email?: string;
	phone?: string;
	linkedIn?: string;
	importance?: string;
	associatedRole?: string;
}

export interface ContactFromDB {
	id: number;
	email: string;
	ownerId: number;
	firstName: string | null;
	lastName: string | null;
	company: string | null;
	title: string | null;
	phone: string | null;
	linkedIn: string | null;
	importance: number | null;
	associatedRole: string | null;
	active: boolean;
	lastActivity: Date | null;
	replied: boolean;
	validEmail: boolean | null;
	createdAt: Date;
	updatedAt: Date;
	autoCreated: boolean;
}

// For contact of contacts (response from get all)
export interface ContactsResponse {
	contacts: [ContactFromDB];
}
