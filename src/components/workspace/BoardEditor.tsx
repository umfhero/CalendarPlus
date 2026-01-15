import { useEffect, useState } from 'react';
import { BoardPage } from '../../pages/Board';

interface BoardEditorProps {
    /** The content ID that references the board in storage */
    contentId: string;
    /** Callback when board name changes */
    onNameChange?: (name: string) => void;
}

/**
 * BoardEditor component - A wrapper that renders the full Board page for workspace.
 * Uses the original Board page functionality to ensure all features work correctly.
 * 
 * Requirements: 8.2
 */
export function BoardEditor({ contentId, onNameChange }: BoardEditorProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Set the pending board navigation so Board page loads the correct board
    useEffect(() => {
        if (contentId) {
            localStorage.setItem('pendingBoardNavigation', contentId);
            // Trigger a refresh to load the board
            setRefreshTrigger(prev => prev + 1);
        }

        return () => {
            // Clean up on unmount
            localStorage.removeItem('pendingBoardNavigation');
        };
    }, [contentId]);

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
