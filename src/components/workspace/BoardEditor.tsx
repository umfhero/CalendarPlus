import { useEffect, useState } from 'react';
import { BoardPage } from '../../pages/Board';

interface BoardEditorProps {
    /** The content ID that references the board in storage */
    contentId: string;
    /** The file path for file-based storage (optional, for new file-based system) */
    filePath?: string;
    /** Callback when board name changes */
    onNameChange?: (name: string) => void;
}

/**
 * BoardEditor component - A wrapper that renders the full Board page for workspace.
 * Uses the original Board page functionality to ensure all features work correctly.
 * If filePath is provided, uses file-based storage instead of legacy JSON storage.
 * 
 * Requirements: 8.2
 */
export function BoardEditor({ contentId, filePath, onNameChange }: BoardEditorProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Set the pending board navigation so Board page loads the correct board
    useEffect(() => {
        if (contentId) {
            localStorage.setItem('pendingBoardNavigation', contentId);
            // Also store filePath for file-based loading
            if (filePath) {
                localStorage.setItem('pendingBoardFilePath', filePath);
            } else {
                localStorage.removeItem('pendingBoardFilePath');
            }
            // Trigger a refresh to load the board
            setRefreshTrigger(prev => prev + 1);
        }

        return () => {
            // Clean up on unmount
            localStorage.removeItem('pendingBoardNavigation');
            localStorage.removeItem('pendingBoardFilePath');
        };
    }, [contentId, filePath]);

    if (!contentId) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">Board not found</div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <BoardPage
                refreshTrigger={refreshTrigger}
                embeddedMode={true}
                embeddedBoardId={contentId}
                onBoardNameChange={onNameChange}
            />
        </div>
    );
}

export default BoardEditor;
