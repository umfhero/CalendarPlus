import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import type { Tour } from 'shepherd.js';
import '../styles/shepherd-theme.css';
import { Page } from '../types';

interface TutorialManagerProps {
    activeTutorialId: string | null;
    onComplete: () => void;
    onNavigate: (page: Page) => void;
}

export function TutorialManager({ activeTutorialId, onComplete, onNavigate }: TutorialManagerProps) {
    const tourRef = useRef<Tour | null>(null);

    useEffect(() => {
        if (!activeTutorialId) {
            // Clean up any existing tour
            if (tourRef.current) {
                tourRef.current.complete();
                tourRef.current = null;
            }
            return;
        }

        // Clean up any existing tour before creating a new one
        if (tourRef.current) {
            tourRef.current.complete();
            tourRef.current = null;
        }

        // Create new tour
        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                cancelIcon: {
                    enabled: true
                },
                classes: 'shepherd-theme-custom',
                scrollTo: { behavior: 'smooth', block: 'center' }
            }
        });

        tourRef.current = tour;

        // Handle tour completion
        tour.on('complete', () => {
            // Mark as completed
            const completed = JSON.parse(localStorage.getItem('completed-tutorials') || '[]');
            if (!completed.includes(activeTutorialId)) {
                completed.push(activeTutorialId);
                localStorage.setItem('completed-tutorials', JSON.stringify(completed));
            }
            onComplete();
        });

        // Handle tour cancellation
        tour.on('cancel', () => {
            onComplete();
        });

        // Load tutorial steps based on ID
        loadTutorialSteps(tour, activeTutorialId, onNavigate);

        // Start the tour
        tour.start();

        return () => {
            if (tour) {
                tour.complete();
            }
        };
    }, [activeTutorialId, onComplete, onNavigate]);

    return null; // This component doesn't render anything
}

function loadTutorialSteps(tour: Tour, tutorialId: string, onNavigate: (page: Page) => void) {
    switch (tutorialId) {
        case 'workspace':
            addWorkspaceTutorial(tour, onNavigate);
            break;
        case 'calendar':
            addCalendarTutorial(tour, onNavigate);
            break;
        case 'timer':
            addTimerTutorial(tour, onNavigate);
            break;
        case 'board':
            addBoardTutorial(tour, onNavigate);
            break;
        case 'nerdbook':
            addNerdbookTutorial(tour, onNavigate);
            break;
        default:
            // Generic tutorial
            tour.addStep({
                id: 'intro',
                title: '🎓 Tutorial',
                text: 'This tutorial is coming soon!',
                buttons: [
                    {
                        text: 'Close',
                        action: tour.complete
                    }
                ]
            });
    }
}

function addWorkspaceTutorial(tour: Tour, onNavigate: (page: Page) => void) {
    tour.addStep({
        id: 'workspace-intro',
        title: '📁 Welcome to Workspace',
        text: 'Workspace is your file explorer for thoughts. All your notes, boards, and nerdbooks live here. Let\'s explore how it works!',
        buttons: [
            {
                text: 'Skip',
                classes: 'shepherd-button-secondary',
                action: tour.cancel
            },
            {
                text: 'Start Tour',
                classes: 'shepherd-button-primary',
                action: () => {
                    onNavigate('workspace');
                    setTimeout(() => tour.next(), 800);
                }
            }
        ]
    });

    tour.addStep({
        id: 'workspace-sidebar',
        title: '🗂️ File Explorer',
        text: 'This is your file tree. Navigate folders and files here. Click any file to open it in the editor on the right.',
        attachTo: {
            element: '[data-tutorial="workspace-sidebar"]',
            on: 'right'
        },
        when: {
            show() {
                const element = document.querySelector('[data-tutorial="workspace-sidebar"]');
                if (!element) {
                    console.warn('Workspace sidebar element not found');
                }
            }
        },
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'workspace-quick-notes',
        title: '⚡ Quick Notes Folder',
        text: 'Press <kbd>Ctrl+Shift+N</kbd> anywhere to instantly capture a thought. It\'s saved here in the Quick Notes folder. Perfect for rapid note-taking!',
        attachTo: {
            element: '[data-tutorial="quick-notes-folder"]',
            on: 'right'
        },
        when: {
            show() {
                const element = document.querySelector('[data-tutorial="quick-notes-folder"]');
                if (!element) {
                    console.warn('Quick notes folder element not found');
                }
            }
        },
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'workspace-create',
        title: '➕ Create Note Structures',
        text: 'Click "New File" to create different types of notes:<br><br>• <strong>.nt</strong> - Plain text notes for writing<br>• <strong>.exec</strong> - Nerdbooks with executable code (Python/JS)<br>• <strong>.brd</strong> - Visual boards with sticky notes<br><br>Each type serves a different purpose!',
        attachTo: {
            element: '[data-tutorial="create-note-btn"]',
            on: 'bottom'
        },
        when: {
            show() {
                const element = document.querySelector('[data-tutorial="create-note-btn"]');
                if (!element) {
                    console.warn('Create note button element not found');
                }
            }
        },
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'workspace-linking',
        title: '🔗 Link Notes Together',
        text: 'Type <kbd>@</kbd> in any note to link to other notes. This creates connections you can visualize in the graph view. Build your own knowledge network!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Finish',
                classes: 'shepherd-button-primary',
                action: tour.complete
            }
        ]
    });
}

function addCalendarTutorial(tour: Tour, onNavigate: (page: Page) => void) {
    tour.addStep({
        id: 'calendar-intro',
        title: '📅 Smart Calendar',
        text: 'ThoughtsPlus has a built-in calendar with natural language processing. No plugins needed! Let\'s explore its features.',
        buttons: [
            {
                text: 'Skip',
                classes: 'shepherd-button-secondary',
                action: tour.cancel
            },
            {
                text: 'Start Tour',
                classes: 'shepherd-button-primary',
                action: () => {
                    onNavigate('calendar');
                    setTimeout(() => tour.next(), 800);
                }
            }
        ]
    });

    tour.addStep({
        id: 'calendar-view',
        title: '📆 Calendar View',
        text: 'This is your calendar. Click any day to add events, or use the month/week/day views to see your schedule at different scales.',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'calendar-quick-add',
        title: '⚡ Quick Add with NLP',
        text: 'Press <kbd>Ctrl+M</kbd> anywhere to open Quick Add. Type naturally like:<br><br>"meeting with John next Tuesday at 3pm"<br>"dentist appointment tomorrow at 2"<br><br>It automatically parses the date, time, and title!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'calendar-recurring',
        title: '🔄 Recurring Events',
        text: 'Create recurring events by typing:<br><br>"team standup every Monday at 10am"<br>"gym daily at 6pm"<br>"review every Friday"<br><br>The calendar handles all the repetition automatically.',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'calendar-tracking',
        title: '📊 Late Tracking',
        text: 'The calendar tracks when you complete tasks late and shows patterns. Perfect for improving time management and understanding your productivity!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Finish',
                classes: 'shepherd-button-primary',
                action: tour.complete
            }
        ]
    });
}

function addTimerTutorial(tour: Tour, onNavigate: (page: Page) => void) {
    tour.addStep({
        id: 'timer-intro',
        title: '⏱️ Focus Timer',
        text: 'The timer helps you stay focused with Pomodoro-style work sessions. It tracks your productivity over time. Let\'s see how it works!',
        buttons: [
            {
                text: 'Skip',
                classes: 'shepherd-button-secondary',
                action: tour.cancel
            },
            {
                text: 'Start Tour',
                classes: 'shepherd-button-primary',
                action: () => {
                    onNavigate('timer');
                    setTimeout(() => tour.next(), 800);
                }
            }
        ]
    });

    tour.addStep({
        id: 'timer-input',
        title: '🔢 Microwave-Style Input',
        text: 'Type numbers like a microwave - super intuitive:<br><br>• "25" = 25 minutes<br>• "130" = 1 hour 30 minutes<br>• "2" = 2 minutes<br><br>No colons or complicated formatting needed!',
        attachTo: {
            element: '[data-tutorial="timer-input"]',
            on: 'bottom'
        },
        when: {
            show() {
                const element = document.querySelector('[data-tutorial="timer-input"]');
                if (!element) {
                    console.warn('Timer input element not found');
                }
            }
        },
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'timer-background',
        title: '🎯 Background Timer',
        text: 'The timer runs in the background even when you minimize the app. You\'ll get a notification when it completes. Perfect for staying focused!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'timer-quick',
        title: '⚡ Quick Timer Shortcut',
        text: 'Press <kbd>Ctrl+Shift+T</kbd> from anywhere to start a timer without opening this page. Type duration and press Enter!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Finish',
                classes: 'shepherd-button-primary',
                action: tour.complete
            }
        ]
    });
}

function addBoardTutorial(tour: Tour, onNavigate: (page: Page) => void) {
    tour.addStep({
        id: 'board-intro',
        title: '🎨 Visual Boards',
        text: 'Boards are infinite canvases for visual thinking. Create sticky notes, draw diagrams, and organize ideas spatially. Let\'s explore!',
        buttons: [
            {
                text: 'Skip',
                classes: 'shepherd-button-secondary',
                action: tour.cancel
            },
            {
                text: 'Start Tour',
                classes: 'shepherd-button-primary',
                action: () => {
                    onNavigate('drawing');
                    setTimeout(() => tour.next(), 800);
                }
            }
        ]
    });

    tour.addStep({
        id: 'board-create',
        title: '📋 Creating Boards',
        text: 'You can create boards in two ways:<br><br>1. Use this Board page<br>2. Create a <strong>.nbm</strong> file in Workspace<br><br>Each board is saved as a file you can organize!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'board-notes',
        title: '📝 Add Sticky Notes',
        text: 'Click the "Add Note" button or use the toolbar to create sticky notes. Drag them around to organize your thoughts visually. Change colors to categorize ideas!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'board-drawing',
        title: '✏️ Drawing Tools',
        text: 'Use the drawing tools to sketch diagrams, connect ideas with arrows, or add visual elements. Perfect for brainstorming and mind mapping!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'board-use-cases',
        title: '💡 Use Cases',
        text: 'Boards are great for:<br><br>• Brainstorming sessions<br>• Project planning<br>• Mind mapping<br>• Visual note-taking<br>• Organizing research<br><br>Get creative!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Finish',
                classes: 'shepherd-button-primary',
                action: tour.complete
            }
        ]
    });
}

function addNerdbookTutorial(tour: Tour, onNavigate: (page: Page) => void) {
    tour.addStep({
        id: 'nerdbook-intro',
        title: '🧪 Nerdbooks',
        text: 'Nerdbooks let you write and execute Python or JavaScript code directly in your notes - like Jupyter notebooks! Perfect for experiments, tutorials, and data analysis.',
        buttons: [
            {
                text: 'Skip',
                classes: 'shepherd-button-secondary',
                action: tour.cancel
            },
            {
                text: 'Start Tour',
                classes: 'shepherd-button-primary',
                action: () => {
                    onNavigate('workspace');
                    setTimeout(() => tour.next(), 800);
                }
            }
        ]
    });

    tour.addStep({
        id: 'nerdbook-create',
        title: '📝 Creating Nerdbooks',
        text: 'In Workspace, create a new file with the <strong>.exec</strong> extension. This creates a nerdbook where you can mix code and notes!',
        attachTo: {
            element: '[data-tutorial="create-note-btn"]',
            on: 'bottom'
        },
        when: {
            show() {
                const element = document.querySelector('[data-tutorial="create-note-btn"]');
                if (!element) {
                    console.warn('Create note button element not found');
                }
            }
        },
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'nerdbook-cells',
        title: '🔢 Code Cells',
        text: 'Add code cells to write Python or JavaScript. Click "Run" or press <kbd>Ctrl+Enter</kbd> to execute. Results appear below the cell instantly!',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-primary',
                action: tour.next
            }
        ]
    });

    tour.addStep({
        id: 'nerdbook-markdown',
        title: '📄 Mix Code and Notes',
        text: 'Add markdown cells between code cells to document your work. Perfect for:<br><br>• Learning tutorials<br>• Data analysis<br>• Code experiments<br>• Technical documentation',
        buttons: [
            {
                text: 'Back',
                classes: 'shepherd-button-secondary',
                action: tour.back
            },
            {
                text: 'Finish',
                classes: 'shepherd-button-primary',
                action: tour.complete
            }
        ]
    });
}
