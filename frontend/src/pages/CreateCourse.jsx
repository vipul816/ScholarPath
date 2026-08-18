import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { BookOpen, ArrowLeft, AlertCircle } from 'lucide-react';

const CreateCourse = () => {
    const navigate = useNavigate();
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
        'Other'
    ];

    const levels = ['Beginner', 'Intermediate', 'Advanced'];

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
            const response = await courseAPI.create(formData);

            if (response.success) {
                // Redirect to instructor dashboard
                navigate('/instructor');
            } else {
                setError(response.message || 'Failed to create course');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while creating the course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/instructor')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
                        <p className="text-gray-600 mt-1">Fill in the details to create your course</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Course Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Course Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        className="input"
                        placeholder="e.g., Introduction to Web Development"
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>

                {/* Course Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Course Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        required
                        rows="5"
                        className="input"
                        placeholder="Describe what students will learn in this course..."
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                {/* Category and Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <select
                            id="category"
                            name="category"
                            required
                            className="input"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                            Difficulty Level *
                        </label>
                        <select
                            id="level"
                            name="level"
                            className="input"
                            value={formData.level}
                            onChange={handleChange}
                        >
                            {levels.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Duration and Thumbnail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (in hours)
                        </label>
                        <input
                            type="number"
                            id="duration"
                            name="duration"
                            min="1"
                            className="input"
                            placeholder="e.g., 40"
                            value={formData.duration}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">Estimated total course duration</p>
                    </div>

                    <div>
                        <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
                            Thumbnail URL
                        </label>
                        <input
                            type="url"
                            id="thumbnail"
                            name="thumbnail"
                            className="input"
                            placeholder="https://example.com/image.jpg"
                            value={formData.thumbnail}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional: Link to course thumbnail image</p>
                    </div>
                </div>

                {/* Preview Section */}
                {formData.title && (
                    <div className="border-t pt-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-gray-900">{formData.title}</h4>
                            {formData.category && (
                                <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded mt-2">
                                    {formData.category}
                                </span>
                            )}
                            {formData.level && (
                                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded mt-2 ml-2">
                                    {formData.level}
                                </span>
                            )}
                            {formData.description && (
                                <p className="text-sm text-gray-600 mt-3">{formData.description}</p>
                            )}
                            {formData.duration && (
                                <p className="text-xs text-gray-500 mt-2">Duration: {formData.duration} hours</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/instructor')}
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
                        {loading ? 'Creating...' : 'Create Course'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCourse;
