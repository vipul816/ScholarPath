import { useState } from 'react';
import { classAPI } from '../services/api';
import { X, Calendar, Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';

const ScheduleClassModal = ({ courseId, onClose, onClassCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        meetingLink: ''
    });

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
            const response = await classAPI.create({
                courseId: parseInt(courseId),
                ...formData,
                duration: parseInt(formData.duration)
            });

            if (response.success) {
                onClassCreated(response.class);
            } else {
                setError(response.message || 'Failed to schedule class');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date/time (now)
    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
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
                                <Calendar className="w-5 h-5 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Schedule New Class</h3>
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
                                Class Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="input"
                                placeholder="e.g., Introduction to Variables"
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
                                rows="3"
                                className="input"
                                placeholder="Brief description of what will be covered..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Date/Time and Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    <span className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1.5" />
                                        Date & Time *
                                    </span>
                                </label>
                                <input
                                    type="datetime-local"
                                    id="scheduledAt"
                                    name="scheduledAt"
                                    required
                                    min={getMinDateTime()}
                                    className="input"
                                    value={formData.scheduledAt}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    <span className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1.5" />
                                        Duration (mins) *
                                    </span>
                                </label>
                                <select
                                    id="duration"
                                    name="duration"
                                    className="input"
                                    value={formData.duration}
                                    onChange={handleChange}
                                >
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="90">1.5 hours</option>
                                    <option value="120">2 hours</option>
                                </select>
                            </div>
                        </div>

                        {/* Meeting Link */}
                        <div>
                            <label htmlFor="meetingLink" className="block text-sm font-medium text-gray-700 mb-1.5">
                                <span className="flex items-center">
                                    <LinkIcon className="w-4 h-4 mr-1.5" />
                                    Meeting Link (optional)
                                </span>
                            </label>
                            <input
                                type="url"
                                id="meetingLink"
                                name="meetingLink"
                                className="input"
                                placeholder="https://zoom.us/j/..."
                                value={formData.meetingLink}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Leave empty to use the built-in live class feature
                            </p>
                        </div>

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
                                        <span>Scheduling...</span>
                                    </span>
                                ) : (
                                    'Schedule Class'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ScheduleClassModal;
