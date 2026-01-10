import { Palette } from 'lucide-react';
import { CustomThemeColors } from '../contexts/ThemeContext';

interface CustomThemeEditorProps {
    colors: CustomThemeColors;
    onChange: (colors: Partial<CustomThemeColors>) => void;
}

interface ColorPickerRowProps {
    label: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
}

function ColorPickerRow({ label, description, value, onChange }: ColorPickerRowProps) {
    return (
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
            <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-800 dark:text-gray-200 block text-sm truncate">
                    {label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                    {description}
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 hidden sm:block">
                    {value.toUpperCase()}
                </span>
                <div className="relative group">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer opacity-0 absolute inset-0 z-10"
                    />
                    <div
                        className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: value }}
                    />
                </div>
            </div>
        </div>
    );
}

export function CustomThemeEditor({ colors, onChange }: CustomThemeEditorProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Theme Colors
                </span>
            </div>

            <ColorPickerRow
                label="Background"
                description="Main app background"
                value={colors.backgroundColor}
                onChange={(value) => onChange({ backgroundColor: value })}
            />

            <ColorPickerRow
                label="Text"
                description="Primary text color"
                value={colors.textColor}
                onChange={(value) => onChange({ textColor: value })}
            />

            <ColorPickerRow
                label="Sidebar"
                description="Sidebar background"
                value={colors.sidebarBackground}
                onChange={(value) => onChange({ sidebarBackground: value })}
            />

            <ColorPickerRow
                label="Border"
                description="Border and divider color"
                value={colors.borderColor}
                onChange={(value) => onChange({ borderColor: value })}
            />

            <ColorPickerRow
                label="Card"
                description="Card and panel background"
                value={colors.cardBackground}
                onChange={(value) => onChange({ cardBackground: value })}
            />
        </div>
    );
}
