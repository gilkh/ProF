
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, DocumentData, deleteDoc, addDoc, serverTimestamp, orderBy, onSnapshot, limit, increment, writeBatch, runTransaction, arrayUnion, arrayRemove, getCountFromServer, deleteField } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { UserProfile, VendorProfile, Service, Offer, QuoteRequest, Booking, SavedTimeline, ServiceOrOffer, VendorCode, Chat, ChatMessage, UpgradeRequest, VendorAnalyticsData, PlatformAnalytics, Review, LineItem, VendorInquiry, AppNotification } from './types';
import { formatItemForMessage, formatQuoteResponseMessage, parseForwardedMessage } from './utils';
import { dataCache, cacheKeys } from './cache';
import { subMonths, format, startOfMonth, addDays, addMonths, startOfDay, subDays } from 'date-fns';
import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, sendPasswordResetEmail as firebaseSendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';

// Helper to safely convert Firestore Timestamp / Date-like values to JS Date
function toDate(value: any): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
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
    
    // Step 2: Send verification email ONLY for clients
    if (accountType === 'client') {
        await sendEmailVerification(firebaseUser);
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
        const tempClientData = {
             ...data,
            id: firebaseUser.uid,
            isPendingVerification: true,
        };
        await setDoc(doc(db, 'pendingClients', firebaseUser.uid), tempClientData);
    }
    
    return { success: true, userId: firebaseUser.uid, role: accountType, verificationSent: accountType === 'client' };
}


export async function signInUser(email: string, password?: string): Promise<{ success: boolean, role?: 'client' | 'vendor' | 'admin'; userId?: string; message?: string }> {
    
    if (email.toLowerCase() === 'admin@tradecraft.com') {
        if (password === 'admin@tradecraft.com') {
            return { success: true, role: 'admin', userId: 'admin-user' };
        } else {
            return { success: false, message: "Invalid admin credentials." };
        }
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password!);
        const user = userCredential.user;

        // Check if user is a vendor before checking email verification
        const pendingVendorSnap = await getDoc(doc(db, 'pendingVendors', user.uid));
        const vendorProfileSnap = await getDoc(doc(db, 'vendors', user.uid));
        const isVendor = pendingVendorSnap.exists() || vendorProfileSnap.exists();
        
        // Only enforce email verification for clients
        if (!isVendor && !user.emailVerified) {
            return { success: false, message: 'Please verify your email before logging in. Check your inbox for a verification link.'};
        }
        
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
                    emailVerified: true, // Vendors don't need verification
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
            return { success: true, role: 'vendor', userId: user.uid };
        }
        
        return { success: true, role: 'client', userId: user.uid };

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

async function handleSocialSignIn(firebaseUser: FirebaseUser): Promise<{ success: boolean; userId: string; role: 'client' | 'vendor' }> {
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
    return { success: true, userId: firebaseUser.uid, role };
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
    return { success: true, userId: firebaseUser.uid, role: 'client' };
    }
}

export async function signInWithGoogle(): Promise<{ success: boolean; role?: 'client' | 'vendor' | 'admin'; userId?: string; message?: string; }> {
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
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
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
     const docRef = doc(db, 'vendors', vendorId);
    await setDoc(docRef, { ...data, lastModified: serverTimestamp() }, { merge: true });
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

        const vendorsData = new Map(vendorsSnapshot.docs.map(doc => [doc.id, doc.data() as Omit<VendorProfile, 'id'>]));

        const services = servicesSnapshot.docs.map(doc => {
            const data = doc.data() as DocumentData as Omit<Service, 'id'>;
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
            const data = doc.data() as DocumentData as Omit<Offer, 'id'>;
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
            item = { id: serviceDoc.id, ...serviceDoc.data(), type: 'service' } as Service;
        } else if (offerDoc.exists()) {
            item = { id: offerDoc.id, ...offerDoc.data(), type: 'offer' } as Offer;
        }
        
        if (!item) {
            return null;
        }
        
        // Fetch vendor data in parallel
        const vendorDoc = await getDoc(doc(db, 'vendors', item.vendorId));
        
        // Enhance item with vendor data if available
        if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data();
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
    await addDoc(collection(db, collectionName), {
        ...item,
        rating: 0,
        reviewCount: 0,
        status: 'pending',
    });
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
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, { accountTier: tier });
}

export async function updateVendorVerification(vendorId: string, verification: VendorProfile['verification']) {
    if (!vendorId) return;
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, { verification: verification });
}

export async function updateUserStatus(userId: string, role: 'client' | 'vendor', status: 'active' | 'disabled') {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { status });

    if (role === 'vendor') {
        const vendorRef = doc(db, 'vendors', userId);
        batch.update(vendorRef, { status });
    }
    await batch.commit();
}

export async function deleteUser(userId: string, role: 'client' | 'vendor') {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);
    batch.delete(userRef);

    if (role === 'vendor') {
        const vendorRef = doc(db, 'vendors', userId);
        batch.delete(vendorRef);
    }
    await batch.commit();
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

    return allItems;
}


export async function moderateMedia(ownerId: string, listingType: 'service' | 'offer' | 'profile', mediaUrl: string, decision: 'approved' | 'rejected', listingId?: string) {
    
    if (listingType === 'profile') {
        const vendorRef = doc(db, 'vendors', ownerId);
        console.log(`Moderating profile picture for ${ownerId} - ${decision}`);

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
    if (userId) {
        q = query(collection(db, 'chats'), where('participantIds', 'array-contains', userId));
    } else {
        q = query(collection(db, 'chats'), orderBy('lastMessageTimestamp', 'desc'));
    }
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let chats = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const lastMessageTimestamp = data.lastMessageTimestamp ? toDate(data.lastMessageTimestamp) : (data.createdAt ? toDate(data.createdAt) : new Date());
            return {
                id: doc.id,
                ...data,
                lastMessageTimestamp,
                participants: data.participants.map((p: any) => ({ ...p, verification: p.verification || 'none' })),
            } as Chat;
        });

        chats.sort((a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());

        callback(chats);
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

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
   await confirmPasswordReset(auth, token, newPassword);
}


// --- Vendor Analytics ---
export async function logPhoneNumberReveal(vendorId: string, clientId?: string) {
    if (!vendorId) return;
    const vendorRef = doc(db, 'vendors', vendorId);
    const revealRef = collection(db, `vendors/${vendorId}/phoneReveals`);

    const batch = writeBatch(db);
    batch.update(vendorRef, { totalPhoneReveals: increment(1) });
    batch.set(doc(revealRef), { revealedAt: serverTimestamp(), clientId: clientId || 'anonymous' });

    await batch.commit();
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

// New function to update auto-approval setting
export async function updateAutoApprovalSetting(enabled: boolean) {
    const settingsRef = doc(db, 'adminSettings', 'moderation');
    await setDoc(settingsRef, {
        autoApprovalEnabled: enabled,
        autoApprovalHours: 12,
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
