import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crop, Maximize2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

interface ImageEditorProps {
    isOpen: boolean;
    imageUrl: string;
    currentWidth?: number;
    currentHeight?: number;
    currentCrop?: boolean;
    onClose: () => void;
    onSave: (width: number | undefined, height: number | undefined, crop: boolean) => void;
}

export function ImageEditor({
    isOpen,
    imageUrl,
    currentWidth,
    currentHeight,
    currentCrop = false,
    onClose,
    onSave,
}: ImageEditorProps) {
    const { accentColor } = useTheme();
    const [width, setWidth] = useState<number | undefined>(currentWidth);
    const [height, setHeight] = useState<number | undefined>(currentHeight);
    const [crop, setCrop] = useState(currentCrop);
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
    const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);

    // Load original image dimensions
    useEffect(() => {
        if (isOpen && imageUrl) {
            const img = new Image();
            img.onload = () => {
                setOriginalDimensions({ width: img.width, height: img.height });
                // If no dimensions set, use original
                if (!width && !height) {
                    setWidth(img.width);
                    setHeight(img.height);
                }
            };
            img.src = imageUrl;
        }
    }, [isOpen, imageUrl]);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setWidth(currentWidth);
            setHeight(currentHeight);
            setCrop(currentCrop);
        }
    }, [isOpen, currentWidth, currentHeight, currentCrop]);

    const handleWidthChange = (newWidth: number) => {
        setWidth(newWidth);
        if (maintainAspectRatio && originalDimensions && height) {
            const aspectRatio = originalDimensions.width / originalDimensions.height;
            setHeight(Math.round(newWidth / aspectRatio));
        }
    };

    const handleHeightChange = (newHeight: number) => {
        setHeight(newHeight);
        if (maintainAspectRatio && originalDimensions && width) {
            const aspectRatio = originalDimensions.width / originalDimensions.height;
            setWidth(Math.round(newHeight * aspectRatio));
        }
    };

    const handleReset = () => {
        if (originalDimensions) {
            setWidth(originalDimensions.width);
            setHeight(originalDimensions.height);
            setCrop(false);
        }
    };

    const handleSave = () => {
        onSave(width, height, crop);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={clsx(
                        "relative w-[600px] max-h-[80vh] rounded-2xl overflow-hidden",
                        "bg-white dark:bg-gray-800",
                        "border border-gray-200 dark:border-gray-700",
                        "shadow-2xl flex flex-col"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Resize & Crop Image
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Preview */}
                        <div className="flex items-center justify-center min-h-[200px]">
                            <img
                                src={imageUrl}
                                alt="Preview"
                                style={{
                                    width: width ? `${width}px` : 'auto',
                                    height: height ? `${height}px` : 'auto',
                                    objectFit: crop ? 'cover' : 'contain',
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                }}
                                className="rounded"
                            />
                        </div>

                        {/* Original Dimensions */}
                        {originalDimensions && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                Original: {originalDimensions.width} × {originalDimensions.height}px
                            </div>
                        )}

                        {/* Dimensions Controls */}
                        <div className="space-y-4">
                            <div className="flex items-end gap-3">
                                {/* Width */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Width (px)
                                    </label>
                                    <input
                                        type="number"
                                        value={width || ''}
                                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                                        placeholder="Auto"
                                        className={clsx(
                                            "w-full px-3 py-2 rounded-lg border",
                                            "bg-white dark:bg-gray-900",
                                            "border-gray-300 dark:border-gray-600",
                                            "text-gray-900 dark:text-white",
                                            "focus:outline-none focus:ring-2",
                                            "placeholder-gray-400"
                                        )}
                                        style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                                    />
                                </div>

                                {/* Height */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Height (px)
                                    </label>
                                    <input
                                        type="number"
                                        value={height || ''}
                                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                                        placeholder="Auto"
                                        className={clsx(
                                            "w-full px-3 py-2 rounded-lg border",
                                            "bg-white dark:bg-gray-900",
                                            "border-gray-300 dark:border-gray-600",
                                            "text-gray-900 dark:text-white",
                                            "focus:outline-none focus:ring-2",
                                            "placeholder-gray-400"
                                        )}
                                        style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                                    />
                                </div>
                            </div>

                            {/* Aspect Ratio Lock */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={maintainAspectRatio}
                                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                    className="rounded"
                                    style={{ accentColor }}
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Maintain aspect ratio
                                </span>
                            </label>

                            {/* Crop Toggle */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={crop}
                                        onChange={(e) => setCrop(e.target.checked)}
                                        className="rounded"
                                        style={{ accentColor }}
                                    />
                                    <Crop className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Crop to fill (object-fit: cover)
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                                    When enabled, image will fill the dimensions and crop overflow
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Maximize2 className="w-4 h-4" />
                            Reset to Original
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                                style={{ backgroundColor: accentColor }}
                            >
                                <Check className="w-4 h-4" />
                                Apply
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
