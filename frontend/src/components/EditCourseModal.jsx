import { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import { X, BookOpen, AlertCircle } from 'lucide-react';

const EditCourseModal = ({ course, onClose, onCourseUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        duration: '',
        level: 'Beginner',
        thumbnail: ''
    });

    const categories = [
        'Web Development',
        'Mobile Development',
        'Data Science',
        'Machine Learning',
        'Programming',
        'Database',
        'DevOps',
        'UI/UX Design',
        'Business',
        'Marketing',
        'Language',
        'STEM',
        'Arts',
        'Health & Fitness',
        'Personal Development',
        'Music',
        'Other'
    ];

    const levels = ['Beginner', 'Intermediate', 'Advanced'];

    // Initialize form with course data
    useEffect(() => {
        if (course) {
            setFormData({
                title: course.title || '',
                description: course.description || '',
                category: course.category || '',
                duration: course.duration || '',
                level: course.level || 'Beginner',
                thumbnail: course.thumbnail || ''
            });
        }
    }, [course]);

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
            const response = await courseAPI.update(course.id, formData);

            if (response.success) {
                console.log('✅ Course updated successfully!', response.course);
                onCourseUpdated(response.course);
            } else {
                setError(response.message || 'Failed to update course');
            }
        } catch (err) {
            console.error('❌ Update course error:', err);
            setError(err.message || 'An error occurred while updating the course');
        } finally {
            setLoading(false);
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
                                <BookOpen className="w-5 h-5 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Edit Course</h3>
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

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Course Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="input"
                                placeholder="e.g., React for Beginners"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="input"
                                placeholder="Describe your course..."
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Category *
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="input"
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Duration */}
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Duration (hours)
                            </label>
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className="input"
                                placeholder="e.g., 20"
                                min="0"
                            />
                        </div>

                        {/* Level */}
                        <div>
                            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Level *
                            </label>
                            <select
                                id="level"
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                required
                                className="input"
                            >
                                {levels.map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Thumbnail URL
                            </label>
                            <input
                                type="url"
                                id="thumbnail"
                                name="thumbnail"
                                value={formData.thumbnail}
                                onChange={handleChange}
                                className="input"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn btn-primary"
                            >
                                {loading ? 'Updating...' : 'Update Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditCourseModal;
