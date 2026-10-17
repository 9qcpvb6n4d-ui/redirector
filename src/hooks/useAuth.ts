import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            // Initialize new user profile
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              theme: 'dark',
              defaultView: 'grid',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
            });
            setProfile(newProfile);

            // Pre-load user-confirmed starter workspaces
            const workspacesRef = collection(db, 'workspaces');
            const starterWorkspaces = [
              {
                id: `${currentUser.uid}_ws_study`,
                name: 'Personal Study',
                description: 'Research papers, courses, documentation, and study guides.',
                icon: 'BookOpen',
                color: '#8B5CF6',
                projectNotes: '### Personal Study Workspace\n- Track learning paths, academic papers, and reference docs here.\n- Pin high-priority tutorials for rapid daily access.',
                pinnedResourceIds: [],
              },
              {
                id: `${currentUser.uid}_ws_bookmarks`,
                name: 'Bookmarks',
                description: 'Everyday quick references, favorite reads, and essential tools.',
                icon: 'Bookmark',
                color: '#38BDF8',
                projectNotes: '### Daily Bookmarks Hub\n- Your primary catalog for everyday utility apps, dashboards, and bookmarks.',
                pinnedResourceIds: [],
              },
              {
                id: `${currentUser.uid}_ws_media`,
                name: 'Media',
                description: 'Videos, podcasts, tutorials, design showcases, and articles.',
                icon: 'Film',
                color: '#EC4899',
                projectNotes: '### Media & Creative Inspiration\n- Watchlists, tutorials, podcasts, and articles saved for later viewing.',
                pinnedResourceIds: [],
              },
            ];

            for (const ws of starterWorkspaces) {
              await setDoc(doc(workspacesRef, ws.id), {
                ...ws,
                ownerId: currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }

            // Also seed starter collections
            const collectionsRef = collection(db, 'collections');
            const starterCollections = [
              {
                id: `${currentUser.uid}_col_ai`,
                name: 'AI & Machine Learning',
                description: 'Foundational models, agents, prompt libraries, and AI developer tools.',
                icon: 'Sparkles',
                color: '#8B5CF6',
              },
              {
                id: `${currentUser.uid}_col_dev`,
                name: 'Developer Tools',
                description: 'CLI tools, cloud hosting, APIs, and GitHub repositories.',
                icon: 'Code',
                color: '#6366F1',
              },
              {
                id: `${currentUser.uid}_col_docs`,
                name: 'Documentation',
                description: 'Official API documentation, RFCs, and cheat sheets.',
                icon: 'FileText',
                color: '#06B6D4',
              },
            ];

            for (const col of starterCollections) {
              await setDoc(doc(collectionsRef, col.id), {
                ...col,
                ownerId: currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } else {
            const data = userSnap.data();
            setProfile({
              uid: currentUser.uid,
              email: data.email || currentUser.email || '',
              displayName: data.displayName || currentUser.displayName || 'User',
              theme: data.theme || 'dark',
              defaultView: data.defaultView || 'grid',
              createdAt: data.createdAt ? new Date().toISOString() : new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Error initializing user profile or workspaces:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      setAuthError(msg);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setAuthError(msg);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      return await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Account creation failed';
      setAuthError(msg);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      setAuthError(msg);
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      setAuthError(msg);
      throw err;
    }
  };

  return {
    user,
    profile,
    loading,
    authError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
  };
}
