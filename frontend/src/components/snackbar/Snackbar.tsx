import { createContext, useContext, useState, type ReactNode } from 'react';

type SnackbarType = 'success' | 'error' | 'info' | 'warning';

type Snackbar = {
  message: string;
  type: SnackbarType;
};

type SnackbarContextType = {
  showSnackbar: (message: string, type?: SnackbarType) => void;
};

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within SnackbarProvider');
  return context;
};

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [snackbar, setSnackbar] = useState<Snackbar | null>(null);

  const showSnackbar = (message: string, type: SnackbarType = 'info') => {
    setSnackbar({ message, type });

    // Auto-hide after 3s unless manually closed
    const timeout = setTimeout(() => {
      setSnackbar(null);
    }, 3000);

    // Cancel timeout if user manually closes early
    return () => clearTimeout(timeout);
  };


  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <div
          className={`fixed top-8 right-8 min-w-[240px] max-w-xs px-4 py-2.5 rounded-xl shadow-2xl z-50 flex items-center border-l-4
            transition-all duration-300 ease-out transform animate-[slide-in_0.4s_cubic-bezier(0.4,0,0.2,1)]
            ${snackbar.type === 'success' && 'bg-white border-blue-600 text-blue-800'}
            ${snackbar.type === 'error' && 'bg-white border-red-600 text-red-800'}
            ${snackbar.type === 'info' && 'bg-white border-blue-400 text-blue-700'}
            ${snackbar.type === 'warning' && 'bg-white border-yellow-500 text-yellow-800'}
          `}
          style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}
        >
          {/* Message */}
          <span className="flex-1 font-medium text-base break-words">{snackbar.message}</span>
          {/* Icon */}
          <span className="flex items-center justify-center gap-1 h-8 w-8 rounded-full bg-opacity-10">
            {snackbar.type === 'success' && (
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            )}
            {snackbar.type === 'error' && (
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
            {snackbar.type === 'info' && (
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
            )}
            {snackbar.type === 'warning' && (
              <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
            )}
          </span>
          {/* Close Button */}
          {/* <button
            onClick={handleClose}
            className="ml-2 text-gray-400 hover:text-gray-700 text-xl font-bold leading-none focus:outline-none transition-colors"
            aria-label="Close Snackbar"
          >
            &times;
          </button> */}
        </div>
      )}
    </SnackbarContext.Provider>
  );
};
