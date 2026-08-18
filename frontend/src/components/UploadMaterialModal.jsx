import { useState } from 'react';
import { materialAPI } from '../services/api';
import { X, Upload, FileText, Video, File, Link as LinkIcon, AlertCircle } from 'lucide-react';

const UploadMaterialModal = ({ courseId, onClose, onMaterialUploaded }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'video',
        fileUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const materialTypes = [
        { value: 'video', label: 'Video', icon: Video, color: 'text-red-500 bg-red-100' },
        { value: 'pdf', label: 'PDF', icon: FileText, color: 'text-orange-500 bg-orange-100' },
        { value: 'document', label: 'Document', icon: File, color: 'text-blue-500 bg-blue-100' },
        { value: 'link', label: 'Link', icon: LinkIcon, color: 'text-green-500 bg-green-100' },
        { value: 'other', label: 'Other', icon: File, color: 'text-gray-500 bg-gray-100' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // If it's a file upload (video), send as FormData
            let response;
            if (selectedFile && formData.type === 'video') {
                console.log('📤 Video Upload - Starting upload');
                console.log('File details:', {
                    name: selectedFile.name,
                    size: selectedFile.size,
                    type: selectedFile.type
                });
                console.log('Course ID:', courseId);

                const formDataObj = new FormData();
                formDataObj.append('courseId', courseId);
                formDataObj.append('title', formData.title);
                formDataObj.append('description', formData.description);
                formDataObj.append('type', formData.type);
                formDataObj.append('file', selectedFile);

                console.log('📤 Sending FormData to API...');
                response = await materialAPI.create(formDataObj);
                console.log('📥 Response from API:', response);
            } else {
                console.log('📤 Non-video or URL upload');
                response = await materialAPI.create({
                    courseId: parseInt(courseId),
                    ...formData
                });
            }

            if (response.success) {
                console.log('✅ Upload successful!', response.material);
                onMaterialUploaded(response.material);
            } else {
                const errorMsg = response.message || response.error || 'Failed to upload material';
                console.error('❌ Upload failed:', errorMsg);
                setError(errorMsg);
            }
        } catch (err) {
            console.error('❌ Upload error caught:', {
                message: err.message,
                status: err.status,
                response: err.response,
                stack: err.stack
            });
            
            let errorMessage = err.message || 'An error occurred during upload';
            
            // Try to extract more specific error info
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getPlaceholderUrl = () => {
        switch (formData.type) {
            case 'video':
                return 'https://youtube.com/watch?v=... or https://vimeo.com/...';
            case 'pdf':
                return 'https://drive.google.com/... or direct PDF link';
            case 'document':
                return 'https://docs.google.com/... or document link';
            case 'link':
                return 'https://example.com/resource';
            default:
                return 'https://...';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Upload className="w-5 h-5 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Upload Material</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Material Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Material Type *
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {materialTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type.value })}
                                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${formData.type === type.value
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.color}`}>
                                            <type.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs mt-1.5 font-medium text-gray-600">
                                            {type.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="input"
                                placeholder="e.g., Lecture 1: Getting Started"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows="2"
                                className="input"
                                placeholder="Brief description of this material..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* File URL or File Upload conditionally based on type, for video we can use file upload */}
                        {formData.type === 'video' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Upload Video File *
                                </label>
                                <input
                                    type="file"
                                    name="file"
                                    accept="video/*"
                                    required
                                    className="input py-2"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Video will be processed into HLS format for streaming.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Resource URL *
                                </label>
                                <input
                                    type="url"
                                    id="fileUrl"
                                    name="fileUrl"
                                    required
                                    className="input"
                                    placeholder={getPlaceholderUrl()}
                                    value={formData.fileUrl}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-outline"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Uploading...</span>
                                    </span>
                                ) : (
                                    'Upload Material'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UploadMaterialModal;
