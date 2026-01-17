import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface ImageInfo {
    fileName: string;
    filePath: string;
    size: number;
    sizeFormatted: string;
    createdAt: string;
}

interface ImageGalleryProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ImageGallery({ isOpen, onClose }: ImageGalleryProps) {
    const [images, setImages] = useState<ImageInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);

    // Load images from assets folder
    const loadImages = useCallback(async () => {
        setIsLoading(true);
        try {
            // @ts-ignore
            const result = await window.ipcRenderer?.invoke('list-workspace-images');
            if (result?.success) {
                setImages(result.images || []);
            }
        } catch (error) {
            console.error('Failed to load images:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadImages();
        }
    }, [isOpen, loadImages]);

    const handleDeleteImage = useCallback(async (image: ImageInfo) => {
        if (!confirm(`Delete "${image.fileName}"?`)) return;

        try {
            // @ts-ignore
            const result = await window.ipcRenderer?.invoke('delete-workspace-image', image.filePath);
            if (result?.success) {
                setImages(prev => prev.filter(img => img.filePath !== image.filePath));
                if (selectedImage?.filePath === image.filePath) {
                    setSelectedImage(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete image:', error);
        }
    }, [selectedImage]);

    const handleOpenInExplorer = useCallback(async (filePath: string) => {
        try {
            // @ts-ignore
            await window.ipcRenderer?.invoke('show-item-in-folder', filePath);
        } catch (error) {
            console.error('Failed to open in explorer:', error);
        }
    }, []);

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
                        "relative w-[90vw] h-[85vh] rounded-2xl overflow-hidden",
                        "bg-gray-50 dark:bg-gray-900",
                        "border border-gray-200 dark:border-gray-700",
                        "shadow-2xl flex flex-col"
                    )}
                >
                    {/* Header */}
                    <div className={clsx(
                        "flex items-center justify-between px-6 py-4",
                        "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                    )}>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Image Gallery
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {images.length} image{images.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex">
                        {/* Grid View */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-gray-500 dark:text-gray-400">Loading images...</div>
                                </div>
                            ) : images.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                                    <p>No images yet</p>
                                    <p className="text-sm mt-2">Paste images in markdown cells to add them here</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {images.map((image) => (
                                        <motion.div
                                            key={image.filePath}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={clsx(
                                                "group relative rounded-lg overflow-hidden cursor-pointer",
                                                "bg-white dark:bg-gray-800 border-2 transition-all",
                                                selectedImage?.filePath === image.filePath
                                                    ? "border-blue-500 shadow-lg"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            )}
                                            onClick={() => setSelectedImage(image)}
                                        >
                                            {/* Image */}
                                            <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={`file://${image.filePath.replace(/\\/g, '/')}`}
                                                    alt={image.fileName}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>

                                            {/* Info Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    <p className="text-white text-xs font-medium truncate">{image.fileName}</p>
                                                    <p className="text-white/70 text-xs">{image.sizeFormatted}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenInExplorer(image.filePath);
                                                    }}
                                                    className="p-1.5 rounded bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                                    title="Show in folder"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteImage(image);
                                                    }}
                                                    className="p-1.5 rounded bg-red-500/90 hover:bg-red-500 text-white"
                                                    title="Delete image"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Detail Panel */}
                        {selectedImage && (
                            <motion.div
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 300, opacity: 0 }}
                                className={clsx(
                                    "w-80 border-l border-gray-200 dark:border-gray-700",
                                    "bg-white dark:bg-gray-800 p-6 overflow-y-auto"
                                )}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Details</h3>
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Preview */}
                                <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                                    <img
                                        src={`file://${selectedImage.filePath.replace(/\\/g, '/')}`}
                                        alt={selectedImage.fileName}
                                        className="w-full"
                                    />
                                </div>

                                {/* Info */}
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400 mb-1">File Name</div>
                                        <div className="text-gray-900 dark:text-white font-mono text-xs break-all">
                                            {selectedImage.fileName}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400 mb-1">Size</div>
                                        <div className="text-gray-900 dark:text-white">{selectedImage.sizeFormatted}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400 mb-1">Created</div>
                                        <div className="text-gray-900 dark:text-white">
                                            {new Date(selectedImage.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400 mb-1">Path</div>
                                        <div className="text-gray-900 dark:text-white font-mono text-xs break-all">
                                            {selectedImage.filePath}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 space-y-2">
                                    <button
                                        onClick={() => handleOpenInExplorer(selectedImage.filePath)}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Show in Folder
                                    </button>
                                    <button
                                        onClick={() => handleDeleteImage(selectedImage)}
                                        className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Image
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
