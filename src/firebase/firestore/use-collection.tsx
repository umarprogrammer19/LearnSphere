'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Directly use memoizedTargetRefOrQuery as it's assumed to be the final query
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      // --- inside your onSnapshot error callback, replace with this ---
      (error: FirestoreError) => {
        // best-effort path extraction without assuming exact query shape
        let path = '<unknown>';
        try {
          const target = memoizedTargetRefOrQuery as any;
          if (!target) {
            path = '<null>';
          } else if (typeof target.path === 'string') {
            // CollectionReference: .path is a string
            path = target.path;
          } else if (target._query && typeof target._query.path?.canonicalString === 'function') {
            // InternalQuery shape
            path = target._query.path.canonicalString();
          } else if (target._query && typeof target._query.path?.toString === 'function') {
            path = target._query.path.toString();
          } else if (target.query && typeof target.query.path === 'string') {
            path = target.query.path;
          } else {
            path = String(target.constructor?.name || '<unknown-target>');
          }
        } catch (e) {
          // ignore extraction errors, keep path as '<unknown>'
          // but log to console for debugging
          console.warn('Failed to extract path from query/ref', e);
        }

        // include the original Firestore error as the cause
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
          message: `Permission denied while listing ${path}: ${error?.message ?? 'unknown'}`,
          cause: error,
        });

        // keep local state useful
        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // emit for global handling + log original for debugging
        errorEmitter.emit('permission-error', contextualError);
        console.error('Firestore list permission/error:', { path, originalError: error });
      }

    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]); // Re-run if the target query/reference changes.
  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}