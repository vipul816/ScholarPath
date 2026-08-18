import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, X } from 'lucide-react';
import { authAPI } from '../services/api';

const EditProfile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [certInput, setCertInput] = useState('');
    const [userRole, setUserRole] = useState('student');
    
    const [formData, setFormData] = useState({
        bio: '',
        educationDetails: '',
        institutionalDetails: '',
        areaOfInterest: '',
        certificatesEarned: [],
        avatar: null,
        // instructor-specific
        qualification: '',
        experience: '',
        profession: '',
        instructorSummary: '',
        resumePath: null,
        resumeFile: null
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authAPI.getProfile();
                const data = res?.user || res;
                if (data) {
                    setFormData({
                        bio: data.bio || '',
                        educationDetails: data.educationDetails || '',
                        institutionalDetails: data.institutionalDetails || '',
                        areaOfInterest: data.areaOfInterest || '',
                        certificatesEarned: data.certificatesEarned || [],
                        avatar: null,
                        qualification: data.qualification || '',
                        experience: data.experience || '',
                        profession: data.profession || '',
                        instructorSummary: data.instructorSummary || '',
                        resumePath: data.resumePath || null,
                        resumeFile: null
                    });
                    setUserRole(data.role || 'student');
                    if (data.avatar) {
                        setAvatarPreview(`http://localhost:3000${data.avatar}`);
                    }
                }
            } catch (err) {
                console.error("Failed to load profile", err);
                setError("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, avatar: file }));
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResumeChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, resumeFile: file }));
        }
    };

    const handleAddCert = () => {
        if (certInput.trim()) {
            setFormData(prev => ({
                ...prev,
                certificatesEarned: [...prev.certificatesEarned, certInput.trim()]
            }));
            setCertInput('');
        }
    };

    const handleRemoveCert = (index) => {
        setFormData(prev => ({
            ...prev,
            certificatesEarned: prev.certificatesEarned.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const submitData = new FormData();
            submitData.append('bio', formData.bio);
            submitData.append('educationDetails', formData.educationDetails);
            submitData.append('institutionalDetails', formData.institutionalDetails);
            submitData.append('areaOfInterest', formData.areaOfInterest);
            submitData.append('certificatesEarned', JSON.stringify(formData.certificatesEarned));
            submitData.append('qualification', formData.qualification);
            submitData.append('experience', formData.experience);
            submitData.append('profession', formData.profession);
            submitData.append('instructorSummary', formData.instructorSummary);

            if (formData.avatar) {
                submitData.append('avatar', formData.avatar);
            }
            if (formData.resumeFile) {
                submitData.append('resume', formData.resumeFile);
            }

            const res = await authAPI.updateProfile(submitData);
            if (res.success) {
                // Update local storage user if needed
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...currentUser, ...res.user }));
                navigate('/profile');
            } else {
                setError(res.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('An error occurred while saving profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                    <button onClick={() => navigate('/profile')} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Profile Photo */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-50">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Camera className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div className="pt-2 text-center sm:text-left">
                                <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
                                <p className="text-sm text-gray-500 mt-1 mb-3">JPG, JPEG or PNG. Max size 2MB.</p>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary text-sm">
                                    Change Photo
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                <textarea
                                    name="bio"
                                    rows="3"
                                    className="input"
                                    placeholder="Tell us a little about yourself..."
                                    value={formData.bio}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Education & Institutional Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Education Details</label>
                                    <textarea
                                        name="educationDetails"
                                        rows="3"
                                        className="input"
                                        placeholder="E.g., B.Tech in Computer Science..."
                                        value={formData.educationDetails}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Institutional Details</label>
                                    <textarea
                                        name="institutionalDetails"
                                        rows="3"
                                        className="input"
                                        placeholder="E.g., Current university or company..."
                                        value={formData.institutionalDetails}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Area of Interest */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Area of Interest</label>
                                <input
                                    type="text"
                                    name="areaOfInterest"
                                    className="input"
                                    placeholder="E.g., Web Development, Machine Learning..."
                                    value={formData.areaOfInterest}
                                    onChange={handleChange}
                                />
                            </div>

                            {userRole === 'instructor' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                                        <input
                                            type="text"
                                            name="profession"
                                            className="input"
                                            placeholder="E.g., Assistant Professor, Software Engineer..."
                                            value={formData.profession}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                                            <input type="text" name="qualification" className="input" value={formData.qualification} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                                            <input type="text" name="experience" className="input" value={formData.experience} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Instructor Summary</label>
                                        <textarea name="instructorSummary" rows="3" className="input" value={formData.instructorSummary} onChange={handleChange} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Resume (optional)</label>
                                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
                                        {formData.resumePath && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                Current resume: <a href={`http://localhost:3000${formData.resumePath}`} target="_blank" rel="noreferrer" className="text-primary-600">View</a>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Certificates Earned */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Certificates Earned</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        className="input flex-1"
                                        placeholder="Add a certificate title..."
                                        value={certInput}
                                        onChange={(e) => setCertInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCert())}
                                    />
                                    <button type="button" onClick={handleAddCert} className="btn btn-secondary whitespace-nowrap">
                                        Add
                                    </button>
                                </div>
                                {formData.certificatesEarned.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {formData.certificatesEarned.map((cert, index) => (
                                            <div key={index} className="inline-flex items-center space-x-1 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                                                <span>{cert}</span>
                                                <button type="button" onClick={() => handleRemoveCert(index)} className="hover:text-primary-900 focus:outline-none">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => navigate('/profile')} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="btn btn-primary flex items-center space-x-2 disabled:opacity-50">
                                {saving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Save Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;