import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Resource, Collection, Workspace } from '../types';

export function useData(userId: string | undefined) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // 1. Subscribe to Resources
  useEffect(() => {
    if (!userId) {
      setResources([]);
      setCollections([]);
      setWorkspaces([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    const resQuery = query(collection(db, 'resources'), where('ownerId', '==', userId));
    const unsubResources = onSnapshot(
      resQuery,
      (snapshot) => {
        const items: Resource[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            ownerId: data.ownerId,
            url: data.url || '',
            title: data.title || '',
            description: data.description || '',
            domain: data.domain || '',
            faviconUrl: data.faviconUrl || '',
            resourceType: data.resourceType || 'website',
            collectionId: data.collectionId || null,
            workspaceIds: data.workspaceIds || [],
            tags: data.tags || [],
            notes: data.notes || '',
            isFavorite: !!data.isFavorite,
            isPinned: !!data.isPinned,
            isArchived: !!data.isArchived,
            githubData: data.githubData || null,
            clickCount: data.clickCount || 0,
            lastOpenedAt: data.lastOpenedAt?.toDate ? data.lastOpenedAt.toDate().toISOString() : data.lastOpenedAt,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          });
        });
        // Sort by createdAt descending
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setResources(items);
        setDataLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'resources');
      }
    );

    // 2. Subscribe to Collections
    const colQuery = query(collection(db, 'collections'), where('ownerId', '==', userId));
    const unsubCollections = onSnapshot(
      colQuery,
      (snapshot) => {
        const items: Collection[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            ownerId: data.ownerId,
            name: data.name || '',
            description: data.description || '',
            icon: data.icon || 'Folder',
            color: data.color || '#8B5CF6',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          });
        });
        setCollections(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'collections');
      }
    );

    // 3. Subscribe to Workspaces
    const wsQuery = query(collection(db, 'workspaces'), where('ownerId', '==', userId));
    const unsubWorkspaces = onSnapshot(
      wsQuery,
      (snapshot) => {
        const items: Workspace[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            ownerId: data.ownerId,
            name: data.name || '',
            description: data.description || '',
            icon: data.icon || 'Layout',
            color: data.color || '#6366F1',
            projectNotes: data.projectNotes || '',
            pinnedResourceIds: data.pinnedResourceIds || [],
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          });
        });
        setWorkspaces(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'workspaces');
      }
    );

    return () => {
      unsubResources();
      unsubCollections();
      unsubWorkspaces();
    };
  }, [userId]);

  // Operations
  const addResource = async (resourceData: Omit<Resource, 'id' | 'ownerId' | 'clickCount' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;
    const newDocRef = doc(collection(db, 'resources'));
    try {
      await setDoc(newDocRef, {
        ...resourceData,
        ownerId: userId,
        clickCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newDocRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'resources');
    }
  };

  const updateResource = async (id: string, updates: Partial<Resource>) => {
    if (!userId) return;
    try {
      const docRef = doc(db, 'resources', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `resources/${id}`);
    }
  };

  const deleteResource = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `resources/${id}`);
    }
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    return updateResource(id, { isFavorite: !current });
  };

  const togglePinned = async (id: string, current: boolean) => {
    return updateResource(id, { isPinned: !current });
  };

  const toggleArchived = async (id: string, current: boolean) => {
    return updateResource(id, { isArchived: !current });
  };

  const recordClick = async (id: string, targetUrl: string) => {
    // Open immediately in new tab for zero latency
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!userId) return;
    try {
      const docRef = doc(db, 'resources', id);
      await updateDoc(docRef, {
        clickCount: increment(1),
        lastOpenedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not record click count:', err);
    }
  };

  const createCollection = async (data: { name: string; description?: string; icon?: string; color?: string }) => {
    if (!userId) return null;
    const newDocRef = doc(collection(db, 'collections'));
    try {
      await setDoc(newDocRef, {
        name: data.name,
        description: data.description || '',
        icon: data.icon || 'Folder',
        color: data.color || '#8B5CF6',
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newDocRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'collections');
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'collections', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `collections/${id}`);
    }
  };

  const deleteCollection = async (id: string) => {
    if (!userId) return;
    try {
      // Unlink resources rather than deleting them
      const batch = writeBatch(db);
      const affected = resources.filter((r) => r.collectionId === id);
      for (const r of affected) {
        batch.update(doc(db, 'resources', r.id), { collectionId: null, updatedAt: serverTimestamp() });
      }
      batch.delete(doc(db, 'collections', id));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `collections/${id}`);
    }
  };

  const createWorkspace = async (data: { name: string; description?: string; icon?: string; color?: string }) => {
    if (!userId) return null;
    const newDocRef = doc(collection(db, 'workspaces'));
    try {
      await setDoc(newDocRef, {
        name: data.name,
        description: data.description || '',
        icon: data.icon || 'Layout',
        color: data.color || '#6366F1',
        projectNotes: '',
        pinnedResourceIds: [],
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newDocRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'workspaces');
    }
  };

  const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'workspaces', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workspaces/${id}`);
    }
  };

  const deleteWorkspace = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'workspaces', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workspaces/${id}`);
    }
  };

  const checkDuplicateUrl = (url: string): Resource | undefined => {
    const clean = url.trim().toLowerCase().replace(/\/$/, '');
    return resources.find((r) => r.url.trim().toLowerCase().replace(/\/$/, '') === clean);
  };

  const batchImportResources = async (
    items: Array<{
      url: string;
      title: string;
      description?: string;
      collectionName?: string;
      tags?: string[];
      notes?: string;
    }>
  ) => {
    if (!userId || items.length === 0) return { imported: 0, skipped: 0 };
    let imported = 0;
    let skipped = 0;

    // Map collection names to IDs or create on the fly
    const colMap = new Map<string, string>();
    for (const c of collections) {
      colMap.set(c.name.toLowerCase(), c.id);
    }

    const batch = writeBatch(db);
    let batchCount = 0;

    for (const item of items) {
      // Duplicate detection
      if (checkDuplicateUrl(item.url)) {
        skipped++;
        continue;
      }

      let collectionId: string | null = null;
      if (item.collectionName) {
        const key = item.collectionName.toLowerCase();
        if (colMap.has(key)) {
          collectionId = colMap.get(key)!;
        } else {
          const newColDoc = doc(collection(db, 'collections'));
          batch.set(newColDoc, {
            name: item.collectionName,
            description: `Imported collection from browser bookmarks`,
            icon: 'Bookmark',
            color: '#8B5CF6',
            ownerId: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          colMap.set(key, newColDoc.id);
          collectionId = newColDoc.id;
          batchCount++;
        }
      }

      let domain = '';
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, '');
      } catch {
        domain = 'link';
      }

      const resDoc = doc(collection(db, 'resources'));
      batch.set(resDoc, {
        url: item.url,
        title: item.title || domain,
        description: item.description || `Imported bookmark from ${domain}`,
        domain,
        faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        resourceType: item.url.includes('github.com/') ? 'github' : 'website',
        collectionId,
        workspaceIds: [],
        tags: item.tags || [],
        notes: item.notes || '',
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        clickCount: 0,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batchCount++;
      imported++;

      if (batchCount >= 400) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return { imported, skipped };
  };

  return {
    resources,
    collections,
    workspaces,
    dataLoading,
    addResource,
    updateResource,
    deleteResource,
    toggleFavorite,
    togglePinned,
    toggleArchived,
    recordClick,
    createCollection,
    updateCollection,
    deleteCollection,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    checkDuplicateUrl,
    batchImportResources,
  };
}
