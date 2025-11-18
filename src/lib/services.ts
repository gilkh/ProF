
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, DocumentData, deleteDoc, addDoc, serverTimestamp, orderBy, onSnapshot, limit, increment, writeBatch, runTransaction, arrayUnion, arrayRemove, getCountFromServer, deleteField } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { UserProfile, VendorProfile, Service, Offer, QuoteRequest, Booking, SavedTimeline, ServiceOrOffer, VendorCode, Chat, ChatMessage, UpgradeRequest, VendorAnalyticsData, PlatformAnalytics, Review, LineItem, VendorInquiry, AppNotification, QuestionTemplate, TemplateResponse, QuestionTemplateMessage, TimeSlot, DayAvailability, ServiceAvailability, VendorAvailability, AvailabilitySlot, MeetingProposal, MeetingType, MeetingProposalStatus, Report, SponsoredBanner } from './types';
import { formatItemForMessage, formatQuoteResponseMessage, parseForwardedMessage, formatMeetingProposalMessage, formatMeetingStatusMessage } from './utils';
import { dataCache, cacheKeys } from './cache';
import { subMonths, format, startOfMonth, addDays, addMonths, startOfDay, subDays } from 'date-fns';
import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, sendPasswordResetEmail as firebaseSendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';

// Helper to safely convert Firestore Timestamp / Date-like values to JS Date
function toDate(value: any): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    // Firestore Timestamp
    if (typeof value?.toDate === 'function') return value.toDate();
    // Safely parse ISO-like strings
    if (typeof value === 'string') {
        // Handle plain date strings like "yyyy-MM-dd" as LOCAL dates to avoid timezone shifts
        const plainDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
        if (plainDateMatch) {
            const [y, m, d] = value.split('-').map(Number);
            // new Date(year, monthIndex, day) produces a local midnight date
            return new Date(y, m - 1, d);
        }
        // Fallback to native parsing for other formats
        return new Date(value);
    }
    // Numbers or other serializable values
    return new Date(value);
}

export async function createNewUser(data: {
    accountType: 'client' | 'vendor';
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
    businessName?: string;
    vendorCode?: string;
    avatar?: string;
}) {
    const { accountType, email, password, vendorCode, businessName } = data;
    
    if (!password) {
        throw new Error("Password is required to create a new user.");
    }
    
    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (!firebaseUser) {
        throw new Error("Could not create user account in Firebase Authentication.");
    }
    
    // Step 2: Send verification email for non-admin accounts when enabled
    let verificationSent = false;
    const emailVerificationRequired = await getEmailVerificationSetting();
    if (emailVerificationRequired) {
        await sendCustomVerificationEmail(firebaseUser, data.firstName);
        verificationSent = true;
    }
    
    // Step 3: For vendors, validate the code and mark it as "reserved" for this user
    // The full vendor profile will be created upon first login.
    if (accountType === 'vendor') {
        if (!vendorCode) {
             throw new Error("A registration code is required for vendors.");
        }
        const codeQuery = query(collection(db, 'vendorCodes'), where('code', '==', vendorCode), where('isUsed', '==', false));
        const codeSnapshot = await getDocs(codeQuery);
        if (codeSnapshot.empty) {
            throw new Error("Invalid or already used vendor code.");
        }
        const codeDoc = codeSnapshot.docs[0];
        await updateDoc(codeDoc.ref, { isUsed: true, usedBy: firebaseUser.uid, usedAt: serverTimestamp() });
        
        // Store temporary vendor info needed for first login.
        const tempVendorData = {
            ...data,
            id: firebaseUser.uid,
        };
        await setDoc(doc(db, 'pendingVendors', firebaseUser.uid), tempVendorData);

    } else {
        // Store temporary client info
        if (emailVerificationRequired) {
            const tempClientData = {
                 ...data,
                id: firebaseUser.uid,
                isPendingVerification: true,
            };
            await setDoc(doc(db, 'pendingClients', firebaseUser.uid), tempClientData);
        } else {
            // Create client profile immediately if verification is disabled
            const userProfile: Omit<UserProfile, 'id'> = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                createdAt: new Date(),
                savedItemIds: [],
                status: 'active',
                avatar: data.avatar || '',
                emailVerified: true, // Skip verification
                provider: 'password',
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
        }
    }
    
    // Step 4: Set durable role claim via secure server route and refresh token
    try {
        const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
        const { token } = await csrfRes.json();
        const idToken = await firebaseUser.getIdToken();
        await fetch('/api/auth/set-role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': token,
            },
            body: JSON.stringify({ role: accountType, idToken })
        });
        // Force refresh so subsequent operations see the role claim
        await firebaseUser.getIdToken(true);
    } catch (e) {
        console.warn('Failed to set durable role claim at registration; will bootstrap on session.', e);
    }

    return { success: true, userId: firebaseUser.uid, role: accountType, verificationSent };
}


export async function signInUser(email: string, password?: string): Promise<{ success: boolean, role?: 'client' | 'vendor' | 'admin'; userId?: string; idToken?: string; message?: string }> {
    
    // Handle admin sign-in through Firebase Auth
    const adminEmails = [
        process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        process.env.ADMIN_EMAIL,
        'admin@tradecraft.com'
    ].filter(Boolean).map(e => (e as string).toLowerCase());
    const inputEmail = email.trim().toLowerCase();
    if (adminEmails.includes(inputEmail)) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password!);
            const user = userCredential.user;
            const idToken = await user.getIdToken();
            return { success: true, role: 'admin', userId: user.uid, idToken };
        } catch (e: any) {
            console.error("Admin Firebase Auth sign in error:", e);
            if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                return { success: false, message: 'Invalid admin credentials.' };
            }
            if (e.code === 'auth/too-many-requests') {
                return { success: false, message: 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.' };
            }
            return { success: false, message: 'An unknown error occurred during admin sign-in.'};
        }
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password!);
        const user = userCredential.user;

        // Post-auth admin fallback to bypass client/vendor registration checks
        const signedInEmail = (user.email || '').toLowerCase();
        if (adminEmails.includes(signedInEmail)) {
            const idToken = await user.getIdToken();
            return { success: true, role: 'admin', userId: user.uid, idToken };
        }

        // Check if user is a vendor before checking email verification
        const pendingVendorSnap = await getDoc(doc(db, 'pendingVendors', user.uid));
        const vendorProfileSnap = await getDoc(doc(db, 'vendors', user.uid));
        const isVendor = pendingVendorSnap.exists() || vendorProfileSnap.exists();
        
        // Check if user is in pending clients (awaiting email verification)
        const pendingClientDoc = await getDoc(doc(db, 'pendingClients', user.uid));
        if (pendingClientDoc.exists()) {
            const emailVerificationRequired = await getEmailVerificationSetting();
            // If verification is disabled or user is verified, complete their profile
            if (!emailVerificationRequired || user.emailVerified) {
                await completeEmailVerification(user.uid);
            }
        }
        
        // Defer email verification enforcement to the server-side session route
        
        let userProfileDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userProfileDoc.exists()) {
            console.log(`First login for ${user.uid}. Creating profile...`);

            if (pendingVendorSnap.exists()) {
                const data = pendingVendorSnap.data() as any;
                const userProfile: Omit<UserProfile, 'id'> = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone || '',
                    createdAt: new Date(),
                    savedItemIds: [],
                    status: 'active',
                    avatar: data.avatar || user?.photoURL || '',
                    emailVerified: !!user.emailVerified,
                    provider: 'password',
                };
                const vendorProfile: Omit<VendorProfile, 'id'> = {
                    businessName: data.businessName || `${data.firstName}'s Business`,
                    email: data.email,
                    ownerId: user.uid,
                    category: 'Venues',
                    tagline: '',
                    description: '',
                    phone: data.phone || '',
                    accountTier: 'free',
                    createdAt: new Date(),
                    status: 'active',
                    rating: 0,
                    reviewCount: 0,
                    avatar: data.avatar || '',
                    portfolio: [],
                    verification: 'none',
                    location: 'Beirut',
                    totalPhoneReveals: 0,
                };
                const batch = writeBatch(db);
                batch.set(doc(db, 'users', user.uid), userProfile);
                batch.set(doc(db, 'vendors', user.uid), vendorProfile);
                batch.delete(pendingVendorSnap.ref);
                await batch.commit();

            } else {
                const pendingClientSnap = await getDoc(doc(db, 'pendingClients', user.uid));
                 if (pendingClientSnap.exists()) {
                     const data = pendingClientSnap.data() as any;
                     const userProfile: Omit<UserProfile, 'id'> = {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        phone: data.phone || '',
                        createdAt: new Date(),
                        savedItemIds: [],
                        status: 'active',
                        avatar: data.avatar || user?.photoURL || '',
                        emailVerified: user.emailVerified,
                        provider: 'password',
                    };
                    await setDoc(doc(db, 'users', user.uid), userProfile);
                    await deleteDoc(pendingClientSnap.ref);
                } else {
                     return { success: false, message: 'Your account is verified, but we could not find your initial registration data. Please contact support.' };
                }
            }
            userProfileDoc = await getDoc(doc(db, 'users', user.uid));
        }

        if (userProfileDoc.data()?.status === 'disabled') {
            return { success: false, message: 'Your account has been disabled. Please contact support.'};
        }

        if (isVendor) {
            if (vendorProfileSnap.exists() && vendorProfileSnap.data().status === 'disabled') {
                 return { success: false, message: 'Your account has been disabled. Please contact support.'};
            }
            const idToken = await user.getIdToken();
            return { success: true, role: 'vendor', userId: user.uid, idToken };
        }
        
        const idToken = await user.getIdToken();
        return { success: true, role: 'client', userId: user.uid, idToken };

    } catch (e: any) {
        console.error("Firebase Auth sign in error:", e);
        if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
             return { success: false, message: 'Invalid email or password.' };
        }
         if (e.code === 'auth/too-many-requests') {
             return { success: false, message: 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.' };
        }
        return { success: false, message: 'An unknown error occurred during sign-in.'};
    }
}

async function handleSocialSignIn(firebaseUser: FirebaseUser): Promise<{ success: boolean; userId: string; role: 'client' | 'vendor'; idToken: string }> {
    if (!firebaseUser.email || !firebaseUser.uid) {
        throw new Error("Social sign-in failed to provide user details.");
    }
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    const providerId = firebaseUser.providerData?.[0]?.providerId || 'unknown';


    if (userDoc.exists()) {
        const vendorCheck = await getDoc(doc(db, 'vendors', firebaseUser.uid));
        const role = vendorCheck.exists() ? 'vendor' : 'client';
        // Update provider if user exists but provider is not set
        if (!userDoc.data().provider) {
            await updateDoc(userRef, { provider: providerId });
        }
        // Ensure durable role claim exists; bootstrap if missing
        try {
            const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
            const { token } = await csrfRes.json();
            const idToken = await firebaseUser.getIdToken();
            await fetch('/api/auth/set-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token,
                },
                body: JSON.stringify({ role, idToken })
            });
            // Refresh to pick up any newly-set claims
            await firebaseUser.getIdToken(true);
        } catch (e) {
            console.warn('Social sign-in claim bootstrap failed; will rely on server session bootstrap.', e);
        }
        const idToken = await firebaseUser.getIdToken();
        return { success: true, userId: firebaseUser.uid, role, idToken };
    } else {
        const [firstName, ...lastNameParts] = (firebaseUser.displayName || 'New User').split(' ');
        const lastName = lastNameParts.join(' ');
        
        const userProfile: Omit<UserProfile, 'id'> = {
            firstName,
            lastName,
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber || '',
            createdAt: new Date(),
            savedItemIds: [],
            status: 'active',
            avatar: firebaseUser.photoURL || '',
            emailVerified: true, // Social provider handles verification
            provider: providerId,
        };
        await setDoc(userRef, userProfile);
        // Set durable client role claim and return idToken for session
        try {
            const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
            const { token } = await csrfRes.json();
            const idToken = await firebaseUser.getIdToken();
            await fetch('/api/auth/set-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token,
                },
                body: JSON.stringify({ role: 'client', idToken })
            });
            await firebaseUser.getIdToken(true);
        } catch (e) {
            console.warn('Failed to set client role claim on social sign-up; will bootstrap on session.', e);
        }
        const idToken = await firebaseUser.getIdToken();
        return { success: true, userId: firebaseUser.uid, role: 'client', idToken };
    }
}

export async function signInWithGoogle(): Promise<{ success: boolean; role?: 'client' | 'vendor' | 'admin'; userId?: string; idToken?: string; message?: string; }> {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return await handleSocialSignIn(result.user);
    } catch (error: any) {
        console.error("Google sign-in error:", error);
        if (error.code === 'auth/operation-not-allowed') {
            return { success: false, message: "Google sign-in is not enabled. Please enable it in the Firebase console." };
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
             return { success: false, message: "An account already exists with this email address. Please sign in with your original method." };
        }
        return { success: false, message: error.message };
    }
}

// User Profile Services
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            } as UserProfile;
        }
    } catch (e) {
        console.warn("Firebase error getting user profile:", e);
        if ((e as any).code === 'unavailable') {
            return null;
        }
    }
    return null;
}

export async function createOrUpdateUserProfile(userId: string, data: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'password'>>) {
    if (!userId) return;
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { ...data, lastModified: serverTimestamp() }, { merge: true });
}


export async function getVendorProfile(vendorId: string): Promise<VendorProfile | null> {
    if (!vendorId) return null;
    try {
        const docRef = doc(db, 'vendors', vendorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const raw = docSnap.data();
            const data = toPlain(raw);
            return {
                id: docSnap.id,
                ...data,
                createdAt: toDate(data.createdAt)
            } as VendorProfile;
        }
    } catch (e) {
        console.warn("Firebase error getting vendor profile:", e);
         if ((e as any).code === 'unavailable') {
            return null;
        }
    }
    return null;
}

export async function createOrUpdateVendorProfile(vendorId: string, data: Partial<Omit<VendorProfile, 'id' | 'createdAt'>>) {
    if (!vendorId) return;
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');
    const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
    const { token } = await csrfRes.json();
    const res = await fetch('/api/vendor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({ idToken, vendorId, data }),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to update vendor profile');
    }
}

// Timeline Services
export async function getSavedTimelines(userId: string): Promise<SavedTimeline[]> {
    if (!userId) return [];
    try {
        const q = query(collection(db, `users/${userId}/timelines`));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const d = doc.data() as DocumentData;
            return { id: doc.id, ...d } as SavedTimeline;
        });
    } catch(e) {
         console.warn(`Firebase error getting saved timelines:`, e);
        if ((e as any).code === 'unavailable') {
            return [];
        }
        throw e;
    }
}

export async function saveTimeline(userId: string, timeline: Omit<SavedTimeline, 'id'>): Promise<string> {
    const collectionRef = collection(db, `users/${userId}/timelines`);
    const docRef = await addDoc(collectionRef, timeline);
    return docRef.id;
}

export async function updateTimeline(userId: string, timelineId: string, timeline: SavedTimeline) {
    const docRef = doc(db, `users/${userId}/timelines`, timelineId);
    await setDoc(docRef, timeline, { merge: true });
}

export async function deleteTimeline(userId: string, timelineId: string) {
    const docRef = doc(db, `users/${userId}/timelines`, timelineId);
    await deleteDoc(docRef);
}

async function fetchCollection<T extends {id: string}>(path: string, q?: any, transform?: (data: DocumentData) => T): Promise<T[]> {
    try {
        const querySnapshot = await getDocs(q || collection(db, path));
        return querySnapshot.docs.map(doc => {
            const d = doc.data() as DocumentData;
            const data = { id: doc.id, ...d } as DocumentData;
            return transform ? transform(data) : data as T;
        });
    } catch (e) {
        console.warn(`Firebase error fetching collection ${path}:`, e);
        if ((e as any).code === 'unavailable') {
            return []; 
        }
        throw e;
    }
}


// Service and Offer Services
export const getServices = (vendorId?: string, count?: number) => {
    let q = query(collection(db, 'services'));
    if (vendorId) q = query(q, where('vendorId', '==', vendorId));
    if (count) q = query(q, limit(count));
    return fetchCollection<Service>('services', q);
}

export const getOffers = (vendorId?: string, count?: number) => {
    let q = query(collection(db, 'offers'));
    if (vendorId) q = query(q, where('vendorId', '==', vendorId));
    if (count) q = query(q, limit(count));
    return fetchCollection<Offer>('offers', q);
}


export const getServicesAndOffers = async (vendorId?: string, options?: { count?: number; includePending?: boolean }): Promise<ServiceOrOffer[]> => {
    const { count, includePending = false } = options || {};
    
    let servicesQuery = query(collection(db, 'services'));
    let offersQuery = query(collection(db, 'offers'));

    if (vendorId) {
        servicesQuery = query(servicesQuery, where('vendorId', '==', vendorId));
        offersQuery = query(offersQuery, where('vendorId', '==', vendorId));
    }
    
    if (!includePending) {
        servicesQuery = query(servicesQuery, where('status', '==', 'approved'));
        offersQuery = query(offersQuery, where('status', '==', 'approved'));
    }
    
    if (count) {
        servicesQuery = query(servicesQuery, limit(count));
        offersQuery = query(offersQuery, limit(count));
    }
    
    try {
        const [servicesSnapshot, offersSnapshot, vendorsSnapshot] = await Promise.all([
            getDocs(servicesQuery),
            getDocs(offersQuery),
            getDocs(collection(db, 'vendors'))
        ]);

        const vendorsData = new Map(vendorsSnapshot.docs.map(doc => [doc.id, toPlain(doc.data()) as Omit<VendorProfile, 'id'>]));

        const services = servicesSnapshot.docs.map(doc => {
            const data = toPlain(doc.data()) as DocumentData as Omit<Service, 'id'>;
            const vendor = vendorsData.get(data.vendorId);
            return { 
                id: doc.id, 
                ...data, 
                type: 'service',
                vendorVerification: vendor?.verification || 'none',
                vendorAvatar: vendor?.avatar || ''
            } as Service;
        });
        const offers = offersSnapshot.docs.map(doc => {
            const data = toPlain(doc.data()) as DocumentData as Omit<Offer, 'id'>;
            const vendor = vendorsData.get(data.vendorId);
            return { 
                id: doc.id, 
                ...data, 
                type: 'offer',
                vendorVerification: vendor?.verification || 'none',
                vendorAvatar: vendor?.avatar || ''
            } as Offer;
        });
        
        let combined = [...services, ...offers];
        if (count) {
            combined = combined.slice(0, count);
        }
        return combined;
    } catch(e) {
         console.warn(`Firebase error getting services/offers:`, e);
        if ((e as any).code === 'unavailable') {
            return [];
        }
        throw e;
    }
}

function toPlain(value: any): any {
    if (value === null || typeof value !== 'object') return value;
    if (typeof (value as any)?.toDate === 'function') return (value as any).toDate();
    if (Array.isArray(value)) return value.map(v => toPlain(v));
    const out: any = {};
    for (const k of Object.keys(value)) out[k] = toPlain((value as any)[k]);
    return out;
}

export async function getSponsoredBanners(): Promise<SponsoredBanner[]> {
    try {
        const q = query(collection(db, 'banners'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const d = doc.data() as DocumentData;
            return {
                id: doc.id,
                image: d.image || d.bannerImage || '',
                vendorId: d.vendorId || '',
                vendorName: d.vendorName || 'Vendor',
                title: d.title || '',
                ctaLabel: d.ctaLabel || 'View Package',
                ctaHref: d.ctaHref || (d.vendorId ? `/vendor/${d.vendorId}` : undefined),
            } as SponsoredBanner;
        });
    } catch (e) {
        console.warn('Error fetching sponsored banners:', e);
        return [];
    }
}

export async function getTopVendors(options?: { count?: number }): Promise<VendorProfile[]> {
    const count = options?.count ?? 10;
    try {
        const snapshot = await getDocs(collection(db, 'vendors'));
        const vendors = snapshot.docs.map(doc => ({ id: doc.id, ...toPlain(doc.data()) })) as VendorProfile[];
        const tierWeight: Record<VendorProfile['accountTier'], number> = { free: 0, vip1: 1, vip2: 2, vip3: 3 };
        const sorted = vendors
            .filter(v => v.status === 'active')
            .sort((a, b) => {
                const aScore = (a.rating || 0) * 100 + (a.reviewCount || 0) * 2 + tierWeight[a.accountTier] * 50;
                const bScore = (b.rating || 0) * 100 + (b.reviewCount || 0) * 2 + tierWeight[b.accountTier] * 50;
                return bScore - aScore;
            })
            .slice(0, count);
        return sorted;
    } catch (e) {
        console.warn('Error fetching top vendors:', e);
        return [];
    }
}

export async function getServiceOrOfferById(id: string): Promise<ServiceOrOffer | null> {
    if (!id) return null;
    try {
        // Fetch from both collections in parallel
        const [serviceDoc, offerDoc] = await Promise.all([
            getDoc(doc(db, 'services', id)),
            getDoc(doc(db, 'offers', id))
        ]);

        let item: ServiceOrOffer | null = null;
        
        if (serviceDoc.exists()) {
            item = { id: serviceDoc.id, ...toPlain(serviceDoc.data()), type: 'service' } as Service;
        } else if (offerDoc.exists()) {
            item = { id: offerDoc.id, ...toPlain(offerDoc.data()), type: 'offer' } as Offer;
        }
        
        if (!item) {
            return null;
        }
        
        // Fetch vendor data in parallel
        const vendorDoc = await getDoc(doc(db, 'vendors', item.vendorId));
        
        // Enhance item with vendor data if available
        if (vendorDoc.exists()) {
            const vendorData = toPlain(vendorDoc.data());
            item.vendorVerification = vendorData.verification || 'none';
            item.vendorAvatar = vendorData.avatar || item.vendorAvatar;
        }
        
        return item;

    } catch (e) {
        console.warn(`Firebase error getting item by ID ${id}:`, e);
        if ((e as any).code === 'unavailable') {
            return null;
        }
        throw e;
    }
}


export async function createServiceOrOffer(item: Omit<Service, 'id'> | Omit<Offer, 'id'>) {
    const collectionName = item.type === 'service' ? 'services' : 'offers';
    const docRef = await addDoc(collection(db, collectionName), {
        ...item,
        rating: 0,
        reviewCount: 0,
        status: 'pending',
    });

    try {
        const config = await getAutoApprovalConfig();
        if (config.enabled) {
            if (config.mode === 'instant') {
                await updateDoc(docRef, { status: 'approved' });
            } else if (config.hours && config.hours > 0) {
                await scheduleListingApproval(docRef.id, item.type, 'approved', config.hours);
            }
        }
    } catch (e) {
        console.warn('Auto-approval processing failed, leaving listing pending:', e);
    }
}

export async function updateServiceOrOffer(itemId: string, itemData: Partial<ServiceOrOffer>) {
    const collectionName = itemData.type === 'service' ? 'services' : 'offers';
    const docRef = doc(db, collectionName, itemId);
    await updateDoc(docRef, itemData);
}

export async function deleteServiceOrOffer(itemId: string, itemType: 'service' | 'offer') {
    const docRef = doc(db, itemType === 'service' ? 'services' : 'offers', itemId);
    await deleteDoc(docRef);
}


// Quote Request Services
export async function createQuoteRequest(request: Omit<QuoteRequest, 'id'| 'status' | 'createdAt'> & { item: ServiceOrOffer }) {
    const { message, item, ...restOfRequest } = request;
    
    const formattedMessage = formatItemForMessage(item, message, true, request);

    const chatId = [request.clientId, request.vendorId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);

    try {
        await runTransaction(db, async (transaction) => {
            const chatSnap = await transaction.get(chatRef);
            const otherParticipantId = request.vendorId;

            if (!chatSnap.exists()) {
                const clientProfile = await getUserProfile(request.clientId);
                const vendorProfile = await getVendorProfile(request.vendorId);
        
                const newChat: Omit<Chat, 'id'> = {
                    participantIds: [request.clientId, request.vendorId],
                    participants: [
                        { id: request.clientId, name: `${clientProfile?.firstName} ${clientProfile?.lastName}`, avatar: clientProfile?.avatar || '' },
                        { id: request.vendorId, name: vendorProfile?.businessName || 'Vendor', avatar: vendorProfile?.avatar || '', verification: vendorProfile?.verification }
                    ],
                    lastMessage: formattedMessage,
                    lastMessageTimestamp: new Date(),
                    lastMessageSenderId: request.clientId,
                    unreadCount: { [otherParticipantId]: 1 }
                }
                transaction.set(chatRef, newChat);
            } else {
                 transaction.update(chatRef, { 
                    lastMessage: formattedMessage,
                    lastMessageTimestamp: new Date(),
                    lastMessageSenderId: request.clientId,
                    [`unreadCount.${otherParticipantId}`]: increment(1)
                });
            }

            const messagesRef = collection(db, `chats/${chatId}/messages`);
            const newMessage: Omit<ChatMessage, 'id'> = {
                senderId: request.clientId,
                text: formattedMessage,
                timestamp: new Date()
            };
            transaction.set(doc(messagesRef), newMessage);

            const quoteRef = collection(db, 'quoteRequests');
            const newQuoteRequest: Omit<QuoteRequest, 'id'> = {
                ...restOfRequest,
                serviceTitle: item.title,
                message: message,
                status: 'pending',
                createdAt: serverTimestamp()
            }
            transaction.set(doc(quoteRef), newQuoteRequest);
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
}


export async function getVendorQuoteRequests(vendorId: string): Promise<QuoteRequest[]> {
     if (!vendorId) return [];
     const q = query(collection(db, 'quoteRequests'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            return {
                id: doc.id,
                ...data,
                createdAt: toDate(data.createdAt),
                phone: data.phone || 'Not Provided',
            } as QuoteRequest
        });
    } catch(e) {
        console.warn("Firebase error getting quote requests:", e);
        if ((e as any).code === 'unavailable') {
            return [];
        }
        throw e;
    }
}

export async function respondToQuote(requestId: string, vendorId: string, clientId: string, total: number, response: string, lineItems: LineItem[]) {
    console.log("lineItems received in respondToQuote:", JSON.stringify(lineItems, null, 2));

    // fetch vendor profile to include friendly vendor name in the message
    let vendorProfile = null;
    try {
        vendorProfile = await getVendorProfile(vendorId);
    } catch (e) {
        console.warn('Could not load vendor profile for message formatting', e);
    }

    const quoteRef = doc(db, 'quoteRequests', requestId);
    const chatId = [clientId, vendorId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);

    
    try {
        await runTransaction(db, async (transaction) => {
            const quoteSnap = await transaction.get(quoteRef);
            if (!quoteSnap.exists()) throw new Error("Quote request not found");
            const quoteData = quoteSnap.data() as QuoteRequest;

            // Deep sanitize lineItems for message formatting only
            let safeLineItemsForMessage: LineItem[] = Array.isArray(lineItems) ? lineItems : [];
            safeLineItemsForMessage = safeLineItemsForMessage
                .filter(item => item && typeof item.description === 'string' && typeof item.price === 'number')
                .map(item => ({ description: item.description, price: item.price }));

            const responseMessage = formatQuoteResponseMessage(requestId, quoteData.serviceTitle, quoteData.serviceTitle, safeLineItemsForMessage, total, response);

            const updatePayload = {
                status: 'responded',
                quotePrice: total,
                quoteResponse: response,
                // deliberately omit lineItems here to avoid transaction validation issues
            };

            transaction.update(quoteRef, updatePayload);

            const messagesRef = collection(db, `chats/${chatId}/messages`);
            // build a richer forwarded item payload including event and client details
            const forwardedItem = {
                isForwarded: true,
                isQuoteRequest: false,
                isQuoteResponse: true,
                quoteRequestId: requestId,
                vendorId: vendorId,
                vendorName: vendorProfile?.businessName || vendorId,
                title: `Quote for: ${quoteData.serviceTitle}`,
                lineItems: safeLineItemsForMessage,
                total: total,
                userMessage: response,
                eventDate: quoteData.eventDate,
                guestCount: quoteData.guestCount,
                phone: quoteData.phone,
                clientName: quoteData.clientName,
                serviceId: quoteData.serviceId,
            };

            const newMessage: Omit<ChatMessage, 'id'> = {
                senderId: vendorId,
                text: JSON.stringify(forwardedItem),
                timestamp: new Date()
            };
            transaction.set(doc(messagesRef), newMessage);

            transaction.update(chatRef, {
                lastMessage: responseMessage,
                lastMessageTimestamp: newMessage.timestamp,
                lastMessageSenderId: vendorId,
                [`unreadCount.${clientId}`]: increment(1)
            });
        });
    } catch (txErr) {
        console.warn('Transaction failed, falling back to non-transactional updates:', txErr);

        // Fallback: perform safe non-transactional updates
        try {
            const quoteSnap = await getDoc(quoteRef);
            if (!quoteSnap.exists()) throw new Error('Quote request not found (fallback)');

            const quoteData = quoteSnap.data() as QuoteRequest;
            let safeLineItemsForMessage: LineItem[] = Array.isArray(lineItems) ? lineItems : [];
            safeLineItemsForMessage = safeLineItemsForMessage
                .filter(item => item && typeof item.description === 'string' && typeof item.price === 'number')
                .map(item => ({ description: item.description, price: item.price }));

            const responseMessage = formatQuoteResponseMessage(requestId, quoteData.serviceTitle, quoteData.serviceTitle, safeLineItemsForMessage, total, response);

            // update quote document (without lineItems yet)
            await updateDoc(quoteRef, { status: 'responded', quotePrice: total, quoteResponse: response });

            // add message
            const messagesRef = collection(db, `chats/${chatId}/messages`);
            const newMessage: Omit<ChatMessage, 'id'> = {
                senderId: vendorId,
                text: responseMessage,
                timestamp: new Date()
            };
            await setDoc(doc(messagesRef), newMessage);

            // update chat
            await updateDoc(chatRef, {
                lastMessage: responseMessage,
                lastMessageTimestamp: newMessage.timestamp,
                lastMessageSenderId: vendorId,
            });

        } catch (fallbackErr) {
            console.error('Fallback non-transactional flow failed:', fallbackErr);
            throw fallbackErr;
        }
    }

    // After either transactional or fallback path, persist sanitized lineItems separately
    try {
        let finalLineItems: LineItem[] = Array.isArray(lineItems) ? lineItems : [];
        finalLineItems = finalLineItems
            .filter(item => item && typeof item.description === 'string' && typeof item.price === 'number')
            .map(item => ({ description: item.description, price: item.price }));

        // Always write an array (can be empty) to avoid undefined
        await updateDoc(quoteRef, { lineItems: finalLineItems });
        console.log('Persisted lineItems after primary operations.');
    } catch (persistErr) {
        console.error('Failed to persist lineItems after operations:', persistErr);
    }
}


export async function approveQuote(quoteRequestId: string) {
    const quoteRef = doc(db, 'quoteRequests', quoteRequestId);
    
    await runTransaction(db, async(transaction) => {
        const quoteSnap = await transaction.get(quoteRef);
        if (!quoteSnap.exists()) throw new Error("Quote request not found");

        const quote = quoteSnap.data() as QuoteRequest;
        
        if (quote.status !== 'responded') throw new Error("This quote has already been actioned.");

        transaction.update(quoteRef, { status: 'approved' });

        const service = await getServiceOrOfferById(quote.serviceId);
        if (!service) throw new Error("Original service/offer not found");

        const bookingData: Omit<Booking, 'id'> = {
            title: quote.serviceTitle,
            with: quote.clientName,
            clientId: quote.clientId,
            vendorId: quote.vendorId,
            date: new Date(quote.eventDate),
            time: 'N/A',
            serviceId: quote.serviceId,
            serviceType: service.type,
        };
        const bookingRef = doc(collection(db, 'bookings'));
        transaction.set(bookingRef, bookingData);
    });
}


// Booking Services
export async function createBooking(booking: Omit<Booking, 'id'>) {
    const offer = await getServiceOrOfferById(booking.serviceId);
    if (!offer) throw new Error("Service or offer not found");

    const bookingWithDetails = {
        ...booking,
        serviceId: offer.id,
        serviceType: offer.type,
        category: booking.category ?? 'booking',
    }

    await addDoc(collection(db, 'bookings'), bookingWithDetails);
}

export const getBookingsForUser = async(userId: string) => {
    if (!userId) return [];
    const q = query(collection(db, "bookings"), where("clientId", "==", userId));
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            return {
                id: doc.id,
                ...data,
                date: toDate(data.date),
            } as Booking;
        });
    } catch(e) {
        console.warn("Firebase error getting user bookings:", e);
         if ((e as any).code === 'unavailable') {
            return [];
        }
        throw e;
    }
}
export const getBookingsForVendor = async(vendorId: string) => {
    if (!vendorId) return [];
    const q = query(collection(db, "bookings"), where("vendorId", "==", vendorId));
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            return {
                id: doc.id,
                ...data,
                date: toDate(data.date),
            } as Booking;
        });
    } catch(e) {
        console.warn("Firebase error getting vendor bookings:", e);
         if ((e as any).code === 'unavailable') {
            return [];
        }
        throw e;
    }
}


// Saved Items
export async function getSavedItems(userId: string, countOnly = false): Promise<ServiceOrOffer[] | number> {
    if (!userId) return countOnly ? 0 : [];
    const user = await getUserProfile(userId);
    if (!user || !user.savedItemIds || user.savedItemIds.length === 0) {
        return countOnly ? 0 : [];
    }

    if (countOnly) {
        return user.savedItemIds.length;
    }
    
    const savedIds = user.savedItemIds.slice(0, 30);

    const allItems = await getServicesAndOffers();
    return allItems.filter(item => savedIds.includes(item.id));
}

export async function toggleSavedItem(userId: string, itemId: string) {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    
    try {
        const userProfile = await getDoc(userRef);
    
        if (!userProfile.exists()) {
            await setDoc(userRef, { savedItemIds: [itemId] }, { merge: true });
            return;
        }
        
        const currentSaved = userProfile.data()?.savedItemIds || [];

        if (currentSaved.includes(itemId)) {
            await updateDoc(userRef, { savedItemIds: arrayRemove(itemId) });
        } else {
            await updateDoc(userRef, { savedItemIds: arrayUnion(itemId) });
        }
    } catch (error) {
        console.error("Error toggling saved item, creating user profile as fallback", error);
        await setDoc(userRef, { savedItemIds: [itemId] }, { merge: true });
    }
}

// Review Services
export async function createReview(reviewData: Omit<Review, 'id' | 'createdAt'>) {
    const { vendorId, serviceId, rating } = reviewData;

    const reviewRef = collection(db, 'reviews');
    const vendorRef = doc(db, 'vendors', vendorId);
    
    const serviceDocRef = doc(db, 'services', serviceId);
    const offerDocRef = doc(db, 'offers', serviceId);


    try {
        await runTransaction(db, async (transaction) => {
            const vendorDoc = await transaction.get(vendorRef);
            const serviceDoc = await transaction.get(serviceDocRef);
            const offerDoc = await transaction.get(offerDocRef);

            if (!vendorDoc.exists()) throw new Error("Vendor not found!");
            
            const listingDoc = serviceDoc.exists() ? serviceDoc : offerDoc.exists() ? offerDoc : null;
            if (!listingDoc) throw new Error("Service/Offer not found!");
            
            const vendorData = vendorDoc.data() as VendorProfile;
            const listingData = listingDoc.data() as ServiceOrOffer;

            const newReview = { ...reviewData, createdAt: serverTimestamp() };
            transaction.set(doc(reviewRef), newReview);

            const newVendorReviewCount = (vendorData.reviewCount || 0) + 1;
            const newVendorRating = ((vendorData.rating || 0) * (vendorData.reviewCount || 0) + rating) / newVendorReviewCount;
            transaction.update(vendorRef, { 
                reviewCount: newVendorReviewCount,
                rating: newVendorRating 
            });

            const newListingReviewCount = (listingData.reviewCount || 0) + 1;
            const newListingRating = ((listingData.rating || 0) * (listingData.reviewCount || 0) + rating) / newListingReviewCount;
            transaction.update(listingDoc.ref, { 
                reviewCount: newListingReviewCount, 
                rating: newListingRating 
            });
        });
    } catch (e) {
        console.error("Review creation transaction failed: ", e);
        throw e;
    }
}

export async function getReviewsForVendor(vendorId: string): Promise<Review[]> {
    if (!vendorId) return [];
    
    // Check cache first
    const cacheKey = cacheKeys.reviews(vendorId);
    const cachedReviews = dataCache.get<Review[]>(cacheKey);
    
    if (cachedReviews) {
        return cachedReviews;
    }
    
    const q = query(collection(db, 'reviews'), where('vendorId', '==', vendorId));
    const reviews = await fetchCollection<Review>('reviews', q, (data: DocumentData) => ({
        id: data.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    } as Review));
    
    const sortedReviews = reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Cache reviews for 10 minutes (reviews don't change frequently)
    dataCache.set(cacheKey, sortedReviews, 10 * 60 * 1000);
    
    return sortedReviews;
}

// Optimized function to fetch service/offer with reviews in parallel with caching
export async function getServiceOrOfferWithReviews(id: string): Promise<{ item: ServiceOrOffer | null; reviews: Review[] }> {
    if (!id) return { item: null, reviews: [] };
    
    // Check cache first
    const cacheKey = cacheKeys.serviceOrOfferWithReviews(id);
    const cachedData = dataCache.get<{ item: ServiceOrOffer | null; reviews: Review[] }>(cacheKey);
    
    if (cachedData) {
        return cachedData;
    }
    
    try {
        // First, try to get the item from both collections in parallel
        const [serviceDoc, offerDoc] = await Promise.all([
            getDoc(doc(db, 'services', id)),
            getDoc(doc(db, 'offers', id))
        ]);
        
        let item: ServiceOrOffer | null = null;
        
        if (serviceDoc.exists()) {
            item = { id: serviceDoc.id, ...serviceDoc.data(), type: 'service' } as Service;
        } else if (offerDoc.exists()) {
            item = { id: offerDoc.id, ...offerDoc.data(), type: 'offer' } as Offer;
        }
        
        if (!item) {
            return { item: null, reviews: [] };
        }
        
        // Fetch reviews in parallel with vendor data
        const [reviews, vendorDoc] = await Promise.all([
            getReviewsForVendor(item.vendorId),
            getDoc(doc(db, 'vendors', item.vendorId))
        ]);
        
        // Enhance item with vendor data if available
        if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data();
            item.vendorVerification = vendorData.verification || 'none';
            item.vendorAvatar = vendorData.avatar || item.vendorAvatar;
        }
        
        const result = { item, reviews };
        
        // Cache the result for 3 minutes (shorter cache for dynamic data)
        dataCache.set(cacheKey, result, 3 * 60 * 1000);
        
        return result;
        
    } catch (e) {
        console.warn(`Firebase error getting item with reviews for ID ${id}:`, e);
        if ((e as any).code === 'unavailable') {
            return { item: null, reviews: [] };
        }
        throw e;
    }
}

// Admin Services
export async function generateVendorCode(): Promise<VendorCode> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode: Omit<VendorCode, 'id'> = {
        code,
        isUsed: false,
        createdAt: new Date()
    };
    const docRef = await addDoc(collection(db, 'vendorCodes'), newCode);
    return { id: docRef.id, ...newCode };
}

export async function getVendorCodes(): Promise<VendorCode[]> {
    const q = query(collection(db, 'vendorCodes'), orderBy('createdAt', 'desc'));
    const transform = (data: DocumentData): VendorCode => ({
        id: data.id,
        code: data.code,
        isUsed: data.isUsed,
        usedBy: data.usedBy,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        usedAt: data.usedAt?.toDate ? data.usedAt.toDate() : undefined,
    });
    return await fetchCollection<VendorCode>('vendorCodes', q, transform);
}

export async function deleteVendorCode(codeId: string) {
    if (!codeId) return;
    const docRef = doc(db, 'vendorCodes', codeId);
    await deleteDoc(docRef);
}


export async function getAllUsersAndVendors() {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const vendorsSnapshot = await getDocs(collection(db, "vendors"));

    const vendorsData = new Map(vendorsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data()} as VendorProfile]));
    
        const allUsers = usersSnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        const userData = { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
        } as UserProfile;
        
        const vendorData = vendorsData.get(doc.id);

        return {
            ...userData,
            role: vendorData ? 'vendor' : 'client',
            businessName: vendorData?.businessName,
            accountTier: vendorData?.accountTier,
            status: userData.status,
            rating: vendorData?.rating,
            reviewCount: vendorData?.reviewCount,
            verification: vendorData?.verification,
            provider: userData.provider || 'password'
        }
    });

    return allUsers;
}

export async function updateVendorTier(vendorId: string, tier: VendorProfile['accountTier']) {
    if (!vendorId) return;
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');
    const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
    const { token } = await csrfRes.json();
    const res = await fetch('/api/vendor/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({ idToken, vendorId, tier }),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to update tier');
    }
}

export async function updateVendorVerification(vendorId: string, verification: VendorProfile['verification']) {
    if (!vendorId) return;
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');
    const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
    const { token } = await csrfRes.json();
    const res = await fetch('/api/vendor/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({ idToken, vendorId, verification }),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to update verification');
    }
}

export async function updateUserStatus(userId: string, role: 'client' | 'vendor', status: 'active' | 'disabled') {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');
    const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
    const { token } = await csrfRes.json();
    const res = await fetch('/api/admin/user/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({ idToken, userId, role, status }),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to update user status');
    }
}

export async function deleteUser(userId: string, role: 'client' | 'vendor') {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');
    const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
    const { token } = await csrfRes.json();
    const res = await fetch('/api/admin/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({ idToken, userId, role }),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to delete user');
    }
}


export async function resetAllPasswords() {
    console.log("Simulating password reset for all users.");
    return { success: true, message: "Password reset simulation complete. In a real app, emails would be sent." };
}

export async function createUpgradeRequest(request: Omit<UpgradeRequest, 'id'| 'requestedAt' | 'status'>) {
  const docRef = await addDoc(collection(db, 'upgradeRequests'), {
    ...request,
    requestedAt: serverTimestamp(),
    status: 'pending',
  });
  return docRef.id;
}

export async function getUpgradeRequests(): Promise<UpgradeRequest[]> {
    const q = query(collection(db, 'upgradeRequests'));
    const transform = (data: DocumentData): UpgradeRequest => ({
        id: data.id,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        currentTier: data.currentTier,
        phone: data.phone,
        status: data.status,
        requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : new Date(),
    });
    return await fetchCollection<UpgradeRequest>('upgradeRequests', q, transform);
}

export async function updateUpgradeRequestStatus(requestId: string, status: UpgradeRequest['status']) {
    if (!requestId) return;
    const requestRef = doc(db, 'upgradeRequests', requestId);
    await updateDoc(requestRef, { status });
}

export async function getVendorAnalytics(vendorId: string): Promise<VendorAnalyticsData[]> {
  if (!vendorId) return [];
  
  try {
    const [quotes, bookings] = await Promise.all([
        getVendorQuoteRequests(vendorId),
        getBookingsForVendor(vendorId)
    ]);
    
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

    const quotesInDateRange = quotes.filter(q => {
    const createdAtDate = q.createdAt instanceof Date ? q.createdAt : toDate(q.createdAt);
        return createdAtDate >= sixMonthsAgo;
    });

        const bookingsInDateRange = bookings.filter(b => {
        const bookingDate = b.date instanceof Date ? b.date : toDate((b as any).date);
        return bookingDate >= sixMonthsAgo;
    });
    

    const monthlyData: { [key: string]: { quotes: number; bookings: number } } = {};

    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, 'MMM');
      monthlyData[monthKey] = { quotes: 0, bookings: 0 };
    }

    quotesInDateRange.forEach(q => {
      const createdAtDate = q.createdAt instanceof Date ? q.createdAt : q.createdAt.toDate();
      const monthKey = format(createdAtDate, 'MMM');
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].quotes++;
      }
    });

    bookingsInDateRange.forEach(b => {
    const date = b.date instanceof Date ? b.date : toDate((b as any).date);
      const monthKey = format(date, 'MMM');
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].bookings++;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .reverse();

  } catch (e) {
    console.warn("Firebase error getting vendor analytics:", e);
    if ((e as any).code === 'unavailable') {
      return [];
    }
    throw e;
  }
}


export async function getPlatformAnalytics(timePeriod: 'daily' | 'monthly' = 'monthly'): Promise<PlatformAnalytics> {
    try {
        const [usersSnapshot, vendorsSnapshot, bookingsSnapshot] = await Promise.all([
            getCountFromServer(collection(db, "users")),
            getCountFromServer(collection(db, "vendors")),
            getCountFromServer(collection(db, "bookings")),
        ]);

        let userSignups: { [key: string]: { Clients: number; Vendors: number } } = {};
        let startDate: Date;

        if (timePeriod === 'daily') {
            startDate = startOfDay(subDays(new Date(), 29));
            for (let i = 0; i < 30; i++) {
                const dayDate = addDays(startDate, i);
                const dayKey = format(dayDate, 'MMM d');
                userSignups[dayKey] = { Clients: 0, Vendors: 0 };
            }
        } else {
            startDate = startOfMonth(subMonths(new Date(), 5));
            for (let i = 0; i < 6; i++) {
                const monthDate = addMonths(startDate, i);
                const monthKey = format(monthDate, 'MMM');
                userSignups[monthKey] = { Clients: 0, Vendors: 0 };
            }
        }

        const recentUsersQuery = query(collection(db, "users"), where("createdAt", ">=", startDate));
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        
        const allVendorIds = new Set((await getDocs(collection(db, "vendors"))).docs.map(d => d.id));

        recentUsersSnapshot.forEach(doc => {
            const data = doc.data() as UserProfile;
            if (data.createdAt) {
                const createdAtDate = data.createdAt instanceof Date ? data.createdAt : toDate(data.createdAt);
                const key = timePeriod === 'daily' ? format(createdAtDate, 'MMM d') : format(createdAtDate, 'MMM');
                if (userSignups[key]) {
                    if (allVendorIds.has(doc.id)) {
                        userSignups[key].Vendors++;
                    } else {
                        userSignups[key].Clients++;
                    }
                }
            }
        });

        const formattedSignups = Object.entries(userSignups)
            .map(([period, data]) => ({ period, ...data }));
            
        return {
            totalUsers: usersSnapshot.data().count,
            totalVendors: vendorsSnapshot.data().count,
            totalBookings: bookingsSnapshot.data().count,
            userSignups: formattedSignups,
        };

    } catch (e) {
        console.warn("Firebase error getting platform analytics:", e);
        if ((e as any).code === 'unavailable') {
            return { totalUsers: 0, totalVendors: 0, totalBookings: 0, userSignups: [] };
        }
        throw e;
    }
}


export async function createVendorInquiry(inquiry: Omit<VendorInquiry, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'vendorInquiries'), {
        ...inquiry,
        createdAt: serverTimestamp(),
        status: 'pending',
    });
    return docRef.id;
}

export async function getVendorInquiries(): Promise<VendorInquiry[]> {
    const q = query(collection(db, 'vendorInquiries'), orderBy('createdAt', 'desc'));
    const transform = (data: DocumentData): VendorInquiry => ({
        id: data.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    } as VendorInquiry);
    return await fetchCollection<VendorInquiry>('vendorInquiries', q, transform);
}

export async function updateVendorInquiryStatus(inquiryId: string, status: VendorInquiry['status']) {
    if (!inquiryId) return;
    const inquiryRef = doc(db, 'vendorInquiries', inquiryId);
    await updateDoc(inquiryRef, { status });
}

export async function getPendingMediaForModeration(): Promise<any[]> {
    const allItems: any[] = [];

    const servicesSnapshot = await getDocs(collection(db, 'services'));
    servicesSnapshot.forEach(doc => {
        const service = { id: doc.id, ...doc.data() } as Service;
        service.media?.forEach(media => {
            if (media.status === 'pending') {
                allItems.push({ ...media, context: { ownerId: service.vendorId, ownerName: service.vendorName, listingId: service.id, listingTitle: service.title, listingType: 'service' }});
            }
        });
    });
    
    const offersSnapshot = await getDocs(collection(db, 'offers'));
    offersSnapshot.forEach(doc => {
        const offer = { id: doc.id, ...doc.data() } as Offer;
        offer.media?.forEach(media => {
            if (media.status === 'pending') {
                allItems.push({ ...media, context: { ownerId: offer.vendorId, ownerName: offer.vendorName, listingId: offer.id, listingTitle: offer.title, listingType: 'offer' }});
            }
        });
    });

    // Include vendor profile portfolio items
    const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
    vendorsSnapshot.forEach(doc => {
        const vendor = { id: doc.id, ...doc.data() } as VendorProfile;
        vendor.portfolio?.forEach(media => {
            if (media.status === 'pending') {
                allItems.push({
                    ...media,
                    context: {
                        ownerId: vendor.id,
                        ownerName: vendor.businessName,
                        listingId: vendor.id,
                        listingTitle: 'Profile Portfolio',
                        listingType: 'profile'
                    }
                });
            }
        });
    });

    return allItems;
}


export async function moderateMedia(ownerId: string, listingType: 'service' | 'offer' | 'profile', mediaUrl: string, decision: 'approved' | 'rejected', listingId?: string) {
    
    if (listingType === 'profile') {
        const vendorRef = doc(db, 'vendors', ownerId);
        await runTransaction(db, async (transaction) => {
            const vendorDoc = await transaction.get(vendorRef);
            if (!vendorDoc.exists()) throw new Error("Vendor not found");

            const vendorData = vendorDoc.data() as VendorProfile;
            const portfolio = vendorData.portfolio || [];

            const newPortfolio = portfolio.map(item => {
                if (item.url === mediaUrl) {
                    return { ...item, status: decision };
                }
                return item;
            });

            transaction.update(vendorRef, { portfolio: newPortfolio });
        });

    } else {
        if (!listingId) throw new Error("Listing ID is required for service/offer media moderation.");
        const collectionName = listingType === 'service' ? 'services' : 'offers';
        const listingRef = doc(db, collectionName, listingId);
        
        await runTransaction(db, async (transaction) => {
            const listingDoc = await transaction.get(listingRef);
            if (!listingDoc.exists()) throw new Error("Listing not found");

            const listingData = listingDoc.data() as ServiceOrOffer;
            const mediaItems = listingData.media || [];

            const newMediaItems = mediaItems.map(item => {
                if (item.url === mediaUrl) {
                    return { ...item, status: decision };
                }
                return item;
            });
            
            transaction.update(listingRef, { media: newMediaItems });
        });
    }
}


// --- Real-time Messaging Services ---

export function getChatsForUser(userId: string | undefined, callback: (chats: Chat[]) => void): () => void {
    let q;
    q = query(collection(db, 'chats'), orderBy('lastMessageTimestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let chats = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const lastMessageTimestamp = data.lastMessageTimestamp ? toDate(data.lastMessageTimestamp) : (data.createdAt ? toDate(data.createdAt) : new Date());
            const participantsRaw = Array.isArray(data.participants) ? data.participants : [];
            return {
                id: doc.id,
                ...data,
                lastMessageTimestamp,
                participants: participantsRaw.map((p: any) => ({ ...p, verification: p.verification || 'none' })),
            } as Chat;
        });

        if (userId) {
            chats = chats.filter(c =>
                (Array.isArray((c as any).participantIds) && (c as any).participantIds.includes(userId)) ||
                (Array.isArray(c.participants) && c.participants.some(p => p?.id === userId))
            );
        }
        chats.sort((a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());

        callback(chats);
    }, () => {
        callback([]);
    });

    return unsubscribe;
}

export function getMessagesForChat(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp.toDate(),
            } as ChatMessage;
        });
        callback(messages);
    });

    return unsubscribe;
}

// --- Chat Moderation & Blocking ---
export function subscribeToBlockStatus(
    userId: string,
    otherId: string,
    callback: (status: { youBlockedOther: boolean; blockedByOther: boolean }) => void,
): () => void {
    const youBlockRef = doc(db, 'blocks', `${userId}_${otherId}`);
    const otherBlocksYouRef = doc(db, 'blocks', `${otherId}_${userId}`);

    let youBlockedOther = false;
    let blockedByOther = false;

    const unsubA = onSnapshot(youBlockRef, (snap) => {
        youBlockedOther = snap.exists();
        callback({ youBlockedOther, blockedByOther });
    });
    const unsubB = onSnapshot(otherBlocksYouRef, (snap) => {
        blockedByOther = snap.exists();
        callback({ youBlockedOther, blockedByOther });
    });

    return () => {
        try { unsubA(); } catch {}
        try { unsubB(); } catch {}
    };
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
    const ref = doc(db, 'blocks', `${blockerId}_${blockedId}`);
    await setDoc(ref, {
        blockerId,
        blockedId,
        createdAt: serverTimestamp(),
    });
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const ref = doc(db, 'blocks', `${blockerId}_${blockedId}`);
    await deleteDoc(ref);
}

export async function reportUser(
    reporterId: string,
    reportedUserId: string,
    chatId: string,
    comment?: string,
): Promise<string> {
    const ref = doc(collection(db, 'reports'));
    await setDoc(ref, {
        reporterId,
        reportedUserId,
        chatId,
        comment: (comment ?? '').trim() || null,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export function subscribeToReports(callback: (reports: Report[]) => void): () => void {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const reports: Report[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as any;
            return {
                id: docSnap.id,
                reporterId: data.reporterId,
                reportedUserId: data.reportedUserId,
                chatId: data.chatId,
                comment: data.comment ?? null,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            } as Report;
        });
        callback(reports);
    });
    return unsubscribe;
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
    if (!text.trim()) return;

    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    
    const newMessage: Omit<ChatMessage, 'id'> = {
        senderId,
        text,
        timestamp: new Date()
    };
    
    try {
        await runTransaction(db, async (transaction) => {
            const chatSnap = await transaction.get(chatRef);
            if (!chatSnap.exists()) {
                throw new Error("Chat does not exist!");
            }
            const chatData = chatSnap.data() as Chat;
            const otherParticipantId = chatData.participantIds.find(id => id !== senderId);

            if (!otherParticipantId) {
                throw new Error("Could not find other participant in chat");
            }

            // Guard: prevent sending if recipient has blocked the sender
            const recipientBlocksSenderRef = doc(db, 'blocks', `${otherParticipantId}_${senderId}`);
            const blockSnap = await transaction.get(recipientBlocksSenderRef);
            if (blockSnap.exists()) {
                // Use a specific error code string to allow UI to handle gracefully
                throw new Error('blocked_by_recipient');
            }

            const isForwarded = parseForwardedMessage(text);
            let lastMessageText = text;

            if (isForwarded?.isQuoteRequest) {
                 lastMessageText = "You sent a quote request."
            } else if (isForwarded) {
                 lastMessageText = "You forwarded an item."
            }

            transaction.set(doc(messagesRef), newMessage);

            transaction.update(chatRef, {
                lastMessage: lastMessageText,
                lastMessageTimestamp: newMessage.timestamp,
                lastMessageSenderId: senderId,
                [`unreadCount.${otherParticipantId}`]: increment(1)
            });
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
}

// Meeting Scheduling Services
export async function createMeetingProposal(data: {
    chatId: string;
    proposerId: string;
    recipientId: string;
    type: MeetingType;
    dateTime: string; // ISO string
    agenda?: string;
    previousProposalId?: string;
}): Promise<string> {
    const chatRef = doc(db, 'chats', data.chatId);
    const proposalsRef = collection(db, 'meetingProposals');
    const messagesRef = collection(db, `chats/${data.chatId}/messages`);

    return await runTransaction(db, async (transaction) => {
        // READS FIRST (Firestore requires all reads before any writes)
        let round = 1;
        if (data.previousProposalId) {
            const prevSnap = await transaction.get(doc(db, 'meetingProposals', data.previousProposalId));
            if (prevSnap.exists()) {
                const prevData = prevSnap.data() as MeetingProposal;
                round = (prevData.round || 1) + 1;
            }
        }

        const chatSnap = await transaction.get(chatRef);
        if (!chatSnap.exists()) {
            throw new Error('Chat does not exist');
        }

        // Create proposal
        const proposalRef = doc(proposalsRef);
        const proposalBase: Omit<MeetingProposal, 'id'> = {
            chatId: data.chatId,
            proposerId: data.proposerId,
            recipientId: data.recipientId,
            type: data.type,
            dateTime: data.dateTime,
            status: 'pending',
            round,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        // Only include optional fields if defined (Firestore disallows undefined)
        const proposal: Omit<MeetingProposal, 'id'> = {
            ...proposalBase,
            ...(data.agenda ? { agenda: data.agenda } : {}),
            ...(data.previousProposalId ? { previousProposalId: data.previousProposalId } : {}),
        };
        transaction.set(proposalRef, proposal);

        // Add message to chat
        const message: Omit<ChatMessage, 'id'> = {
            senderId: data.proposerId,
            text: formatMeetingProposalMessage({ id: proposalRef.id, ...proposal } as MeetingProposal),
            timestamp: new Date(),
        };
        transaction.set(doc(messagesRef), message);

        // Update chat last message and unread count
        transaction.update(chatRef, {
            lastMessage: '📅 Meeting proposal',
            lastMessageTimestamp: message.timestamp,
            lastMessageSenderId: data.proposerId,
            [`unreadCount.${data.recipientId}`]: increment(1),
        });

        return proposalRef.id;
    });
}

export async function respondToMeetingProposal(proposalId: string, responderId: string, status: MeetingProposalStatus, reason?: string): Promise<void> {
    const proposalRef = doc(db, 'meetingProposals', proposalId);

    // Pre-compute booking details when accepted
    let bookingData: Omit<Booking, 'id'> | null = null;
    if (status === 'accepted') {
        const proposalSnap = await getDoc(proposalRef);
        if (!proposalSnap.exists()) throw new Error('Proposal not found');
        const proposal = proposalSnap.data() as MeetingProposal;

        const chatRefOutside = doc(db, 'chats', proposal.chatId);
        const chatSnap = await getDoc(chatRefOutside);
        if (!chatSnap.exists()) throw new Error('Chat does not exist');
        const chatData = chatSnap.data() as any;

        const participantIds: string[] = Array.isArray(chatData.participantIds) && chatData.participantIds.length > 0
            ? chatData.participantIds
            : (Array.isArray(chatData.participants) ? chatData.participants.map((p: any) => p.id) : []);

        // Determine vendor and client by checking vendor profiles
        let vendorId: string | null = null;
        let clientId: string | null = null;
        for (const pid of participantIds) {
            const vSnap = await getDoc(doc(db, 'vendors', pid));
            if (vSnap.exists()) {
                vendorId = pid;
            }
        }
        // Fallbacks if vendorId not determined
        if (!vendorId) {
            const vSnapResponder = await getDoc(doc(db, 'vendors', responderId));
            if (vSnapResponder.exists()) vendorId = responderId;
        }
        const proposedOtherId = responderId === proposal.proposerId ? proposal.recipientId : proposal.proposerId;
        clientId = proposedOtherId === vendorId ? responderId : proposedOtherId;
        if (!clientId) clientId = proposedOtherId; // final fallback

        // Compute "with" name as the client name (consistent with existing bookings)
        let withName = 'Client';
        if (Array.isArray(chatData.participants)) {
            const clientParticipant = (chatData.participants as any[]).find(p => p.id === clientId);
            if (clientParticipant?.name) withName = clientParticipant.name;
        }

        // Choose a service/offer to attach booking to (first listing for vendor if any)
        let serviceId = vendorId || '__meeting__';
        let serviceType: 'service' | 'offer' = 'service';
        try {
            if (vendorId) {
                const listings = await getServicesAndOffers(vendorId);
                if (listings && listings.length > 0) {
                    serviceId = listings[0].id;
                    serviceType = listings[0].type;
                } else {
                    serviceId = vendorId; // fallback placeholder to keep filtering consistent
                    serviceType = 'service';
                }
            }
        } catch (e) {
            // Keep fallback values
        }

        bookingData = {
            title: proposal.agenda ? `Meeting: ${proposal.agenda}` : (proposal.type === 'call' ? 'Call' : 'In-person Meeting'),
            with: withName,
            clientId: clientId!,
            vendorId: vendorId || proposedOtherId,
            date: new Date(proposal.dateTime),
            time: format(new Date(proposal.dateTime), 'p'),
            serviceId,
            serviceType,
            category: 'appointment',
        };
    }

    await runTransaction(db, async (transaction) => {
        // READ: get latest proposal inside transaction
        const snap = await transaction.get(proposalRef);
        if (!snap.exists()) throw new Error('Proposal not found');
        const proposal = snap.data() as MeetingProposal;

        // Guard: only allow a single response while pending
        if (proposal.status !== 'pending') {
            throw new Error('Proposal already responded');
        }

        const chatRef = doc(db, 'chats', proposal.chatId);
        const messagesRef = collection(db, `chats/${proposal.chatId}/messages`);
        const otherParticipantId = responderId === proposal.proposerId ? proposal.recipientId : proposal.proposerId;

        // Update proposal status and mark who responded
        transaction.update(proposalRef, { status, updatedAt: serverTimestamp(), respondedBy: responderId });

        // Add status message
        const statusText = formatMeetingStatusMessage(proposalId, status, reason);
        const msg: Omit<ChatMessage, 'id'> = {
            senderId: responderId,
            text: statusText,
            timestamp: new Date(),
        };
        transaction.set(doc(messagesRef), msg);

        // Update chat last message
        const lastText = status === 'accepted' ? '✅ Meeting accepted' : status === 'declined' ? '❌ Meeting declined' : '📅 Meeting pending';
        transaction.update(chatRef, {
            lastMessage: lastText,
            lastMessageTimestamp: msg.timestamp,
            lastMessageSenderId: responderId,
            [`unreadCount.${otherParticipantId}`]: increment(1),
        });

        // Create booking when accepted
        if (status === 'accepted' && bookingData) {
            const bookingRef = doc(collection(db, 'bookings'));
            transaction.set(bookingRef, bookingData);
        }
    });
}

export async function counterProposeMeeting(originalProposalId: string, proposerId: string, newData: { type?: MeetingType; dateTime: string; agenda?: string }): Promise<string> {
    const originalRef = doc(db, 'meetingProposals', originalProposalId);
    const originalSnap = await getDoc(originalRef);
    if (!originalSnap.exists()) throw new Error('Original proposal not found');
    const original = originalSnap.data() as MeetingProposal;

    const recipientId = proposerId === original.proposerId ? original.recipientId : original.proposerId;
    const newProposalId = await createMeetingProposal({
        chatId: original.chatId,
        proposerId,
        recipientId,
        type: newData.type || original.type,
        dateTime: newData.dateTime,
        agenda: newData.agenda ?? original.agenda,
        previousProposalId: originalProposalId,
    });
    // Mark original as responded by this user to prevent repeated actions
    await updateDoc(originalRef, { respondedBy: proposerId, updatedAt: serverTimestamp() });
    return newProposalId;
}


export async function markChatAsRead(chatId: string, userId: string) {
    if (!chatId || !userId) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0
    });
}

// --- Email Verification and Password Reset ---

export async function sendPasswordResetEmail(email: string) {
    await firebaseSendPasswordResetEmail(auth, email);
}

// Custom email verification with styled template
export async function sendCustomVerificationEmail(user: FirebaseUser, firstName: string) {
    try {
        // Prefer custom styled email via server route; fallback to Firebase default if not configured
        const res = await fetch('/api/email/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, firstName })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
            // Fallback to default Firebase email verification
            const actionCodeSettings = {
                url: `${window.location.origin}/verify-email`,
                handleCodeInApp: true,
            };
            await sendEmailVerification(user, actionCodeSettings);
        }
    } catch (error) {
        console.error('Error sending custom verification email:', error);
        throw error;
    }
}

// Get pending accounts awaiting email verification
export async function getPendingVerificationAccounts(): Promise<Array<{id: string, email: string, firstName: string, lastName: string, createdAt: Date, accountType: 'client' | 'vendor'}>> {
    try {
        const pendingClientsSnap = await getDocs(collection(db, 'pendingClients'));
        const pendingVendorsSnap = await getDocs(collection(db, 'pendingVendors'));
        const unverifiedUsersSnap = await getDocs(query(collection(db, 'users'), where('emailVerified', '==', false)));

        const accounts: Array<{id: string, email: string, firstName: string, lastName: string, createdAt: Date, accountType: 'client' | 'vendor'}> = [];
        const seen = new Set<string>();

        // Include pending clients awaiting email verification
        pendingClientsSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            // Show clients awaiting verification; treat missing flag as pending (backward compatibility)
            if (data.isPendingVerification !== false) {
                accounts.push({
                    id: docSnap.id,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    createdAt: toDate(data.createdAt || new Date()),
                    accountType: 'client'
                });
                seen.add(docSnap.id);
            }
        });

        // Include pending vendors (shown for admin visibility; vendors don't require email verification)
        pendingVendorsSnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            accounts.push({
                id: docSnap.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                createdAt: toDate(data.createdAt || new Date()),
                accountType: 'vendor'
            });
            seen.add(docSnap.id);
        });

        // Include existing unverified accounts from users collection (clients and vendors)
        for (const docSnap of unverifiedUsersSnap.docs) {
            const data = docSnap.data();
            const id = docSnap.id;
            if (seen.has(id)) continue; // avoid duplicates
            const vendorDoc = await getDoc(doc(db, 'vendors', id));
            const accountType: 'client' | 'vendor' = vendorDoc.exists() ? 'vendor' : 'client';
            accounts.push({
                id,
                email: data.email,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                createdAt: toDate(data.createdAt || new Date()),
                accountType,
            });
            seen.add(id);
        }

        return accounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error('Error fetching pending verification accounts:', error);
        return [];
    }
}

// Admin verification moved to server action in /app/admin/actions.ts

// Get/Set email verification requirement setting
export async function getEmailVerificationSetting(): Promise<boolean> {
    try {
        const settingsRef = doc(db, 'adminSettings', 'emailVerification');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
            return settingsSnap.data().required ?? true; // Default to true
        }
        return true;
    } catch (error) {
        console.error('Error fetching email verification setting:', error);
        return true;
    }
}

export async function updateEmailVerificationSetting(required: boolean): Promise<void> {
    try {
        const settingsRef = doc(db, 'adminSettings', 'emailVerification');
        await setDoc(settingsRef, {
            required: required,
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        // If verification is being disabled, activate all pending clients
        if (!required) {
            const pendingClientsSnapshot = await getDocs(collection(db, 'pendingClients'));
            const batch = writeBatch(db);
            
            pendingClientsSnapshot.docs.forEach(pendingDoc => {
                const clientData = pendingDoc.data();
                const userProfile: Omit<UserProfile, 'id'> = {
                    firstName: clientData.firstName,
                    lastName: clientData.lastName,
                    email: clientData.email,
                    phone: clientData.phone || '',
                    createdAt: new Date(),
                    savedItemIds: [],
                    status: 'active',
                    avatar: clientData.avatar || '',
                    emailVerified: true, // Skip verification since it's disabled
                    provider: 'password',
                };
                
                batch.set(doc(db, 'users', pendingDoc.id), userProfile);
                batch.delete(doc(db, 'pendingClients', pendingDoc.id));
            });
            
            if (pendingClientsSnapshot.docs.length > 0) {
                await batch.commit();
                console.log(`Activated ${pendingClientsSnapshot.docs.length} pending clients after disabling email verification`);
            }
        }
    } catch (error) {
        console.error('Error updating email verification setting:', error);
        throw error;
    }
}

// Complete email verification by moving user from pending to active
export async function completeEmailVerification(userId: string): Promise<void> {
    try {
        // Check if user is in pending clients
        const pendingClientDoc = await getDoc(doc(db, 'pendingClients', userId));
        
        if (pendingClientDoc.exists()) {
            const clientData = pendingClientDoc.data();
            
            // Create user profile
            const userProfile: Omit<UserProfile, 'id'> = {
                firstName: clientData.firstName,
                lastName: clientData.lastName,
                email: clientData.email,
                phone: clientData.phone || '',
                createdAt: new Date(),
                savedItemIds: [],
                status: 'active',
                avatar: clientData.avatar || '',
                emailVerified: true,
                provider: 'password',
            };
            
            // Use batch to ensure atomicity
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', userId), userProfile);
            batch.delete(doc(db, 'pendingClients', userId));
            await batch.commit();
            
            console.log('Successfully completed email verification for client:', userId);
        } else {
            // Check if user already exists (might have been manually verified)
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                // Update emailVerified status if not already set
                if (!userDoc.data().emailVerified) {
                    await updateDoc(doc(db, 'users', userId), {
                        emailVerified: true
                    });
                }
            } else {
                console.warn('No pending client or existing user found for verification:', userId);
            }
        }
    } catch (error) {
        console.error('Error completing email verification:', error);
        throw error;
    }
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    await confirmPasswordReset(auth, token, newPassword);
}

// Resend verification email for existing user
export async function resendVerificationEmail(
    email: string,
    options?: { allowFirebaseFallback?: boolean }
): Promise<{ success: boolean; message: string }> {
    const allowFirebaseFallback = options?.allowFirebaseFallback !== false;
    try {
        // Attempt to send via server route (styled email using Admin SDK link)
        const res = await fetch('/api/email/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, firstName: 'there', companyName: 'TradeCraft' })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.success) {
            return { success: true, message: `Verification email resent to ${email}.` };
        }

        // Optional fallback: send Firebase default verification to current user (when email matches)
        const currentUser = auth.currentUser;
        if (allowFirebaseFallback && currentUser?.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
            try {
                const actionCodeSettings = {
                    url: `${window.location.origin}/verify-email`,
                    handleCodeInApp: true,
                } as const;
                await sendEmailVerification(currentUser, actionCodeSettings);
                return { success: true, message: `Verification email resent to your account (${email}).` };
            } catch (err: any) {
                if (err?.code === 'auth/too-many-requests') {
                    return { success: false, message: 'Too many requests. Please wait a few minutes before trying again.' };
                }
                console.warn('Fallback Firebase verification send failed:', err);
                return { success: false, message: err?.message || 'Failed to send default verification email.' };
            }
        }

        const message = data?.message || 'Unable to resend verification email via server.';
        return { success: false, message };
    } catch (error: any) {
        // Gracefully handle known Firebase rate-limit code
        if (error?.code === 'auth/too-many-requests') {
            return { success: false, message: 'Too many requests. Please wait a few minutes before trying again.' };
        }
        console.warn('Error resending verification email:', error);
        return { success: false, message: error?.message || 'Failed to resend verification email.' };
    }
}


// --- Vendor Analytics ---
export async function logPhoneNumberReveal(vendorId: string, clientId?: string) {
    if (!vendorId) return;
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');
    const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' });
    const { token } = await csrfRes.json();
    const res = await fetch('/api/vendor/phone-reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({ idToken, vendorId }),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to log phone reveal');
    }
}


export async function getPhoneNumberReveals(vendorId: string, timePeriod: 'all' | '30days'): Promise<number> {
    if (!vendorId) return 0;
    
    if (timePeriod === 'all') {
        const vendor = await getVendorProfile(vendorId);
        return vendor?.totalPhoneReveals || 0;
    } else {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const revealsRef = collection(db, `vendors/${vendorId}/phoneReveals`);
        const q = query(revealsRef, where('revealedAt', '>=', thirtyDaysAgo));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    }
}

// --- Notification Services ---

export async function createNotification(data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    const { userId, ...rest } = data;
    const notificationRef = collection(db, `users/${userId}/notifications`);
    await addDoc(notificationRef, {
        ...rest,
        userId: userId,
        read: false,
        createdAt: serverTimestamp(),
    });
    
    // Also set a flag on the user profile to show the red dot indicator
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { hasUnreadNotifications: true });
}

export function getNotifications(userId: string, callback: (notifications: AppNotification[]) => void): () => void {
    const q = query(collection(db, `users/${userId}/notifications`), orderBy('createdAt', 'desc'), limit(30));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate(),
            } as AppNotification;
        });
        callback(notifications);
    });

    return unsubscribe;
}

export async function markNotificationsAsRead(userId: string) {
    if (!userId) return;
    
    try {
        // Get all unread notifications for the user
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        const unreadQuery = query(notificationsRef, where('read', '==', false));
        const unreadSnapshot = await getDocs(unreadQuery);
        
        // Mark all unread notifications as read
        const batch = writeBatch(db);
        unreadSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        
        // Also update the user profile to remove the unread flag
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, { hasUnreadNotifications: false });
        
        await batch.commit();
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
}
    
export async function getPendingListings(): Promise<ServiceOrOffer[]> {
    const servicesQuery = query(collection(db, 'services'), where('status', '==', 'pending'));
    const offersQuery = query(collection(db, 'offers'), where('status', '==', 'pending'));

    const [servicesSnapshot, offersSnapshot] = await Promise.all([
        getDocs(servicesQuery),
        getDocs(offersQuery)
    ]);

    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'service' } as Service));
    const offers = offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'offer' } as Offer));
    
    return [...services, ...offers];
}

export async function updateListingStatus(listingId: string, type: 'service' | 'offer', status: 'approved' | 'rejected', rejectionReason?: string) {
    const collectionName = type === 'service' ? 'services' : 'offers';
    const docRef = doc(db, collectionName, listingId);
    
    const batch = writeBatch(db);

    const updateData: { status: 'approved' | 'rejected', rejectionReason?: any } = { status: status };
    
    if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
    } else {
        updateData.rejectionReason = deleteField();
    }
    
    batch.update(docRef, updateData);

    if (status === 'approved') {
        const listingDoc = await getDoc(docRef);
        if (listingDoc.exists()) {
            const listingData = listingDoc.data() as ServiceOrOffer;
            const media = listingData.media || [];
            const updatedMedia = media.map(m => ({ ...m, status: 'approved' }));
            batch.update(docRef, { media: updatedMedia });
        }
    }

    await batch.commit();
}

// New function to schedule listing approval
export async function scheduleListingApproval(listingId: string, type: 'service' | 'offer', decision: 'approved' | 'rejected', delayHours: number, reason?: string) {
    const scheduledDate = new Date(Date.now() + (delayHours * 60 * 60 * 1000));
    
    const scheduledAction = {
        listingId,
        type,
        decision,
        reason,
        scheduledFor: scheduledDate,
        createdAt: new Date(),
        status: 'pending'
    };
    
    await addDoc(collection(db, 'scheduledActions'), scheduledAction);
}

// Schedule approval for vendor profile media (portfolio item)
export async function scheduleProfileMediaApproval(vendorId: string, mediaUrl: string, decision: 'approved' | 'rejected', delayHours: number, reason?: string) {
    const scheduledDate = new Date(Date.now() + (delayHours * 60 * 60 * 1000));
    const scheduledAction = {
        vendorId,
        mediaUrl,
        type: 'profile',
        decision,
        reason,
        scheduledFor: scheduledDate,
        createdAt: new Date(),
        status: 'pending'
    };
    await addDoc(collection(db, 'scheduledActions'), scheduledAction);
}

// Process due scheduled actions (listings and profile media)
export async function processScheduledActions(): Promise<number> {
    try {
        const now = new Date();
        const q = query(
            collection(db, 'scheduledActions'),
            where('status', '==', 'pending'),
            where('scheduledFor', '<=', now),
            orderBy('scheduledFor', 'asc')
        );

        const snapshot = await getDocs(q);
        let processed = 0;
        for (const docSnap of snapshot.docs) {
            const action = docSnap.data() as any;
            try {
                if (action.type === 'service' || action.type === 'offer') {
                    await updateListingStatus(action.listingId, action.type, action.decision, action.reason);
                } else if (action.type === 'profile') {
                    const ownerId = action.vendorId || action.ownerId; // support both fields
                    await moderateMedia(ownerId, 'profile', action.mediaUrl, action.decision);
                }
                await updateDoc(doc(db, 'scheduledActions', docSnap.id), { status: 'completed', processedAt: new Date() });
                processed++;
            } catch (err) {
                await updateDoc(doc(db, 'scheduledActions', docSnap.id), { status: 'failed', error: String(err), processedAt: new Date() });
            }
        }
        return processed;
    } catch (error) {
        console.error('Failed to process scheduled actions', error);
        return 0;
    }
}

// New function to update auto-approval setting
export async function updateAutoApprovalSetting(enabled: boolean, options?: { mode?: 'instant' | 'scheduled'; hours?: number }) {
    const settingsRef = doc(db, 'adminSettings', 'moderation');
    await setDoc(settingsRef, {
        autoApprovalEnabled: enabled,
        autoApprovalMode: options?.mode ?? 'scheduled',
        autoApprovalHours: typeof options?.hours === 'number' ? options.hours : 12,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

// New function to get auto-approval setting
export async function getAutoApprovalSetting(): Promise<boolean> {
    try {
        const settingsRef = doc(db, 'adminSettings', 'moderation');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
            return settingsSnap.data().autoApprovalEnabled || false;
        }
        return false;
    } catch (error) {
        console.error('Error fetching auto-approval setting:', error);
        return false;
    }
}

export async function getAutoApprovalConfig(): Promise<{ enabled: boolean; mode: 'instant' | 'scheduled'; hours: number }> {
    try {
        const settingsRef = doc(db, 'adminSettings', 'moderation');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            const enabled = !!data.autoApprovalEnabled;
            const mode: 'instant' | 'scheduled' = data.autoApprovalMode === 'instant' ? 'instant' : 'scheduled';
            const hours = typeof data.autoApprovalHours === 'number' ? data.autoApprovalHours : 12;
            return { enabled, mode, hours };
        }
    } catch (error) {
        console.error('Error fetching auto-approval config:', error);
    }
    return { enabled: false, mode: 'scheduled', hours: 12 };
}

// Login button toggle functions
export async function updateLoginButtonSettings(clientLoginEnabled: boolean, vendorLoginEnabled: boolean) {
    const settingsRef = doc(db, 'adminSettings', 'loginButtons');
    await setDoc(settingsRef, {
        clientLoginEnabled: clientLoginEnabled,
        vendorLoginEnabled: vendorLoginEnabled,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function getLoginButtonSettings(): Promise<{ clientLoginEnabled: boolean; vendorLoginEnabled: boolean }> {
    try {
        const settingsRef = doc(db, 'adminSettings', 'loginButtons');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            return {
                clientLoginEnabled: data.clientLoginEnabled ?? true,
                vendorLoginEnabled: data.vendorLoginEnabled ?? true
            };
        }
        return { clientLoginEnabled: true, vendorLoginEnabled: true };
    } catch (error) {
        console.error('Error fetching login button settings:', error);
        return { clientLoginEnabled: true, vendorLoginEnabled: true };
    }
}

// Mobile Intro Settings Management
export async function updateMobileIntroSetting(enabled: boolean) {
    try {
        const settingsRef = doc(db, 'adminSettings', 'mobileIntro');
        await setDoc(settingsRef, { enabled }, { merge: true });
    } catch (error) {
        console.error('Error updating mobile intro setting:', error);
        throw error;
    }
}

export async function getMobileIntroSetting(): Promise<boolean> {
    try {
        const settingsRef = doc(db, 'adminSettings', 'mobileIntro');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            return data.enabled ?? true;
        }
        
        return true; // Default to enabled
    } catch (error) {
        console.error('Error fetching mobile intro setting:', error);
        return true; // Default to enabled on error
    }
}

// User Settings Management
export async function updateUserSettings(userId: string, settings: Partial<UserProfile['settings']>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            settings: settings
        });
    } catch (error) {
        console.error('Error updating user settings:', error);
        throw error;
    }
}

export async function getUserSettings(userId: string): Promise<UserProfile['settings'] | null> {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            return userData.settings || { autoScrollImages: true };
        }
        return null;
    } catch (error) {
        console.error('Error getting user settings:', error);
        return null;
    }
}

export async function toggleAutoScrollImages(userId: string): Promise<boolean> {
    try {
        const currentSettings = await getUserSettings(userId);
        const newAutoScrollValue = !(currentSettings?.autoScrollImages ?? true);
        
        await updateUserSettings(userId, {
            ...currentSettings,
            autoScrollImages: newAutoScrollValue
        });
        
        return newAutoScrollValue;
    } catch (error) {
        console.error('Error toggling auto-scroll images:', error);
        throw error;
    }
}

// Question Template Functions

export async function createQuestionTemplate(template: Omit<QuestionTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<string> {
    const templateData = {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        usageCount: 0,
    };
    
    const docRef = await addDoc(collection(db, 'questionTemplates'), templateData);
    return docRef.id;
}

export async function getQuestionTemplates(vendorId: string): Promise<QuestionTemplate[]> {
    const q = query(
        collection(db, 'questionTemplates'),
        where('vendorId', '==', vendorId),
        orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toDate(doc.data().createdAt),
        updatedAt: toDate(doc.data().updatedAt),
    })) as QuestionTemplate[];
}

export async function updateQuestionTemplate(templateId: string, updates: Partial<Omit<QuestionTemplate, 'id' | 'createdAt' | 'vendorId' | 'usageCount'>>): Promise<void> {
    const templateRef = doc(db, 'questionTemplates', templateId);
    await updateDoc(templateRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteQuestionTemplate(templateId: string): Promise<void> {
    await deleteDoc(doc(db, 'questionTemplates', templateId));
}

export async function duplicateQuestionTemplate(templateId: string, newTitle: string): Promise<string> {
    const templateDoc = await getDoc(doc(db, 'questionTemplates', templateId));
    if (!templateDoc.exists()) {
        throw new Error('Template not found');
    }
    
    const templateData = templateDoc.data() as QuestionTemplate;
    const duplicatedTemplate = {
        ...templateData,
        title: newTitle,
        isActive: false, // New duplicated templates start as inactive
    };
    
    // Remove fields that shouldn't be copied
    delete (duplicatedTemplate as any).id;
    delete (duplicatedTemplate as any).createdAt;
    delete (duplicatedTemplate as any).updatedAt;
    delete (duplicatedTemplate as any).usageCount;
    
    return await createQuestionTemplate(duplicatedTemplate);
}

export async function sendQuestionTemplate(templateId: string, chatId: string, vendorId: string, clientId: string): Promise<void> {
    const templateDoc = await getDoc(doc(db, 'questionTemplates', templateId));
    if (!templateDoc.exists()) {
        throw new Error('Template not found');
    }
    
    const template = { id: templateId, ...templateDoc.data() } as QuestionTemplate;
    
    // Get vendor profile for name
    const vendorProfile = await getVendorProfile(vendorId);
    if (!vendorProfile) {
        throw new Error('Vendor not found');
    }
    
    const templateMessage: QuestionTemplateMessage = {
        type: 'question_template',
        templateId: templateId,
        templateTitle: template.title,
        vendorId: vendorId,
        vendorName: vendorProfile.businessName || `${vendorProfile.firstName} ${vendorProfile.lastName}`,
        questions: template.questions,
        sentAt: new Date(),
        isQuestionTemplate: true, // Add this flag for proper parsing
    };
    
    await runTransaction(db, async (transaction) => {
        const chatRef = doc(db, 'chats', chatId);
        const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
        const templateRef = doc(db, 'questionTemplates', templateId);
        
        // Add message to chat
        transaction.set(messageRef, {
            senderId: vendorId,
            text: JSON.stringify(templateMessage),
            timestamp: serverTimestamp(),
        });
        
        // Update chat last message
        transaction.update(chatRef, {
            lastMessage: `📋 Question Template: ${template.title}`,
            lastMessageSenderId: vendorId,
            lastMessageTimestamp: serverTimestamp(),
            [`unreadCount.${clientId}`]: increment(1),
        });
        
        // Increment template usage count
        transaction.update(templateRef, {
            usageCount: increment(1),
        });
    });
}

export async function submitTemplateResponse(responseData: {
    templateId: string;
    chatId: string;
    clientId: string;
    vendorId: string;
    responses: Array<{ questionId: string; answer: any }>;
}): Promise<void> {
    const { templateId, chatId, clientId, vendorId, responses } = responseData;
    
    // Get template and client profile for response message
    const [templateDoc, clientProfile] = await Promise.all([
        getDoc(doc(db, 'questionTemplates', templateId)),
        getUserProfile(clientId),
    ]);
    
    if (!templateDoc.exists()) {
        throw new Error('Template not found');
    }
    if (!clientProfile) {
        throw new Error('Client not found');
    }
    
    const template = { id: templateId, ...templateDoc.data() } as QuestionTemplate;
    
    const templateResponse: TemplateResponse = {
        templateId,
        templateTitle: template.title,
        clientId,
        clientName: `${clientProfile.firstName} ${clientProfile.lastName}`,
        vendorId,
        responses,
        submittedAt: new Date(),
    };
    
    await runTransaction(db, async (transaction) => {
        const chatRef = doc(db, 'chats', chatId);
        const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
        const responseRef = doc(collection(db, 'templateResponses'));
        
        // Store the response
        transaction.set(responseRef, {
            ...templateResponse,
            submittedAt: serverTimestamp(),
        });
        
        // Add response message to chat
        transaction.set(messageRef, {
            senderId: clientId,
            text: JSON.stringify({
                type: 'template_response',
                responseId: responseRef.id,
                templateTitle: template.title,
                clientName: `${clientProfile.firstName} ${clientProfile.lastName}`,
                responseCount: responses.length,
                submittedAt: new Date(),
                questions: template.questions,
                responses: responses,
                isTemplateResponse: true, // Add this flag for proper parsing
            }),
            timestamp: serverTimestamp(),
        });
        
        // Update chat last message
        transaction.update(chatRef, {
            lastMessage: `✅ Completed: ${template.title}`,
            lastMessageSenderId: clientId,
            lastMessageTimestamp: serverTimestamp(),
            [`unreadCount.${vendorId}`]: increment(1),
        });
    });
}

export async function getTemplateResponses(vendorId: string): Promise<TemplateResponse[]> {
    const q = query(
        collection(db, 'templateResponses'),
        where('vendorId', '==', vendorId),
        orderBy('submittedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: toDate(doc.data().submittedAt),
    })) as TemplateResponse[];
}

export async function getTemplateResponse(responseId: string): Promise<TemplateResponse | null> {
    const responseDoc = await getDoc(doc(db, 'templateResponses', responseId));
    if (!responseDoc.exists()) {
        return null;
    }
    
    return {
        id: responseDoc.id,
        ...responseDoc.data(),
        submittedAt: toDate(responseDoc.data().submittedAt),
    } as TemplateResponse;
}

// Vendor Availability Management Functions

// Ensure vendor availability doc exists before any updateDoc calls
async function ensureVendorAvailabilityDoc(vendorId: string) {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    const snapshot = await getDoc(availabilityRef);
    if (!snapshot.exists()) {
        // Create minimal skeleton so nested update paths can be created
        await setDoc(availabilityRef, {
            id: vendorId,
            vendorId,
            services: {},
            updatedAt: serverTimestamp(),
        }, { merge: true });
    }
}

export async function getVendorAvailability(vendorId: string): Promise<VendorAvailability | null> {
    const availabilityDoc = await getDoc(doc(db, 'vendorAvailability', vendorId));
    if (!availabilityDoc.exists()) {
        return null;
    }
    
    const data = availabilityDoc.data();
    return {
        id: availabilityDoc.id,
        vendorId: data.vendorId,
        services: data.services || {},
        updatedAt: toDate(data.updatedAt),
    } as VendorAvailability;
}

export async function updateVendorAvailability(vendorId: string, availability: Partial<VendorAvailability>): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await setDoc(availabilityRef, {
        ...availability,
        vendorId,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

export async function updateServiceAvailability(vendorId: string, serviceId: string, availability: ServiceAvailability): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}`]: availability,
        updatedAt: serverTimestamp(),
    });
}

export async function toggleServiceVisibility(vendorId: string, serviceId: string, visible: boolean): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.visible`]: visible,
        updatedAt: serverTimestamp(),
    });
}

export async function setDayAvailability(vendorId: string, serviceId: string, date: string, dayAvailability: DayAvailability): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}`]: dayAvailability,
        updatedAt: serverTimestamp(),
    });
}

// Set the mode for a specific day: 'slots' or 'normal'
export async function setDayMode(vendorId: string, serviceId: string, date: string, mode: 'slots' | 'normal'): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.mode`]: mode,
        updatedAt: serverTimestamp(),
    });
}

export async function addTimeSlot(vendorId: string, serviceId: string, date: string, timeSlot: TimeSlot): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.timeSlots`]: arrayUnion(timeSlot),
        updatedAt: serverTimestamp(),
    });
}

export async function removeTimeSlot(vendorId: string, serviceId: string, date: string, timeSlot: TimeSlot): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.timeSlots`]: arrayRemove(timeSlot),
        updatedAt: serverTimestamp(),
    });
}

// Toggle vendor-marked taken/unavailable for a specific slot
export async function toggleTimeSlotTaken(vendorId: string, serviceId: string, date: string, timeSlot: TimeSlot): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    // Remove old slot object, then add updated one with toggled 'taken'
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.timeSlots`]: arrayRemove(timeSlot),
        updatedAt: serverTimestamp(),
    });
    const updatedSlot: TimeSlot = { ...timeSlot, taken: !timeSlot.taken };
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.timeSlots`]: arrayUnion(updatedSlot),
        updatedAt: serverTimestamp(),
    });
}

// Add/remove normal free/busy ranges for a day
export async function addFreeTime(vendorId: string, serviceId: string, date: string, range: { startTime: string; endTime: string }): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.freeTimes`]: arrayUnion(range),
        updatedAt: serverTimestamp(),
    });
}

export async function removeFreeTime(vendorId: string, serviceId: string, date: string, range: { startTime: string; endTime: string }): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.freeTimes`]: arrayRemove(range),
        updatedAt: serverTimestamp(),
    });
}

export async function addBusyTime(vendorId: string, serviceId: string, date: string, range: { startTime: string; endTime: string }): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.busyTimes`]: arrayUnion(range),
        updatedAt: serverTimestamp(),
    });
}

export async function removeBusyTime(vendorId: string, serviceId: string, date: string, range: { startTime: string; endTime: string }): Promise<void> {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    await ensureVendorAvailabilityDoc(vendorId);
    await updateDoc(availabilityRef, {
        [`services.${serviceId}.dates.${date}.busyTimes`]: arrayRemove(range),
        updatedAt: serverTimestamp(),
    });
}

export async function getAvailableSlots(vendorId: string, serviceId: string, date: string): Promise<AvailabilitySlot[]> {
    const availability = await getVendorAvailability(vendorId);
    if (!availability || !availability.services[serviceId]) {
        return [];
    }

    const serviceAvailability = availability.services[serviceId];
    if (!serviceAvailability.visible) {
        return [];
    }

    const dayAvailability = serviceAvailability.dates[date];
    if (!dayAvailability || dayAvailability.fullyBooked) {
        return [];
    }

    // Get existing bookings for this date and service
    const bookingsQuery = query(
        collection(db, 'bookings'),
        where('vendorId', '==', vendorId),
        where('serviceId', '==', serviceId),
        where('date', '==', date)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookedTimes = bookingsSnapshot.docs.map(doc => doc.data().time);

    // Filter out booked or vendor-taken time slots
    const availableSlots: AvailabilitySlot[] = (dayAvailability.timeSlots || [])
        .filter(slot => !!slot.startTime && !bookedTimes.includes(slot.startTime) && !slot.taken)
        .map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            available: true,
            price: slot.price,
        }));

    return availableSlots;
}

export async function bookTimeSlot(vendorId: string, serviceId: string, date: string, time: string, userId: string): Promise<boolean> {
    try {
        // Check if slot is still available
        const availableSlots = await getAvailableSlots(vendorId, serviceId, date);
        const slotAvailable = availableSlots.some(slot => slot.startTime === time);
        
        if (!slotAvailable) {
            return false;
        }

        // Create the booking
        await createBooking({
            userId,
            vendorId,
            serviceId,
            date,
            time,
            status: 'confirmed',
            title: 'Service Booking',
            description: 'Booking confirmed',
        });

        return true;
    } catch (error) {
        console.error('Error booking time slot:', error);
        return false;
    }
}

export function subscribeToVendorAvailability(vendorId: string, callback: (availability: VendorAvailability | null) => void): () => void {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    
    return onSnapshot(availabilityRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            callback({
                id: doc.id,
                vendorId: data.vendorId,
                services: data.services || {},
                updatedAt: toDate(data.updatedAt),
            } as VendorAvailability);
        } else {
            callback(null);
        }
    });
}

export function subscribeToServiceAvailability(vendorId: string, serviceId: string, callback: (slots: AvailabilitySlot[]) => void): () => void {
    const availabilityRef = doc(db, 'vendorAvailability', vendorId);
    
    return onSnapshot(availabilityRef, async (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const serviceAvailability = data.services?.[serviceId];
            
            if (serviceAvailability && serviceAvailability.visible) {
                // Get current date's availability
                const today = format(new Date(), 'yyyy-MM-dd');
                const slots = await getAvailableSlots(vendorId, serviceId, today);
                callback(slots);
            } else {
                callback([]);
            }
        } else {
            callback([]);
        }
    });
}
