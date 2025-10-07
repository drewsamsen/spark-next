/**
 * Central export for all UI components
 * 
 * This file makes it easier to import UI components from a single location
 */

// Form components
export * from './button';
export { Input, type InputProps } from './input';
export { Textarea, type TextareaProps } from './textarea';
export * from './dropdown-menu';
export * from './badge';
export * from './tooltip';
export { Skeleton } from './skeleton';

// Table components
export * from './Table';
export * from './Pagination';

// Form components
export * from './FormComponents';

// Notification components
export * from './Toast';
export * from './Modal';

// Loading components
export {
  Spinner,
  LoadingPlaceholder,
  Skeleton as LoadingSkeleton,
  CardSkeleton,
  TableSkeleton
} from './Loading';
export { LoadingSpinner } from './LoadingSpinner';
export {
  BookHighlightsSkeleton,
  NotesListSkeleton,
  NoteDetailSkeleton,
  CategoryTagSkeleton,
  AutomationsSkeleton
} from './ContentSkeleton';

// Error components
export * from './ErrorState';

// Card components
export * from './card';

// Scrolling components
export * from './scroll-area'; 