import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Edit3, MapPin, Briefcase, Code, Award, BookOpen } from 'lucide-react';
import { authAPI } from '../services/api';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authAPI.getProfile();
                // backend may return { success: true, user: {...} } or the user object directly
                const user = res?.user || res;
                if (user) setProfile(user);
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
         return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center mt-10 text-gray-600">Failed to load profile.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-primary-500 to-accent-500 relative">
                    <div className="absolute -bottom-16 left-8">
                        {profile.avatar ? (
                            <img src={`http://localhost:3000${profile.avatar}`} alt={profile.name} className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md bg-white"/>
                        ) : (
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center shadow-md">
                                <User className="w-16 h-16 text-gray-400" />
                            </div>
                        )}
                    </div>
                    <div className="absolute top-4 right-4">
                        <Link to="/profile/edit" className="btn btn-secondary flex items-center space-x-2 bg-white/90 hover:bg-white text-gray-800">
                            <Edit3 className="w-4 h-4" />
                            <span>Edit Profile</span>
                        </Link>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="pt-20 px-8 pb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                    <p className="text-gray-500 capitalize font-medium">{profile.role}</p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Content Area */}
                        <div className="md:col-span-2 space-y-8">
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                    <User className="w-5 h-5 text-primary-500" />
                                    <span>Bio</span>
                                </h2>
                                <p className="text-gray-700 whitespace-pre-wrap">{profile.bio || 'No bio added yet.'}</p>
                            </section>

                            {profile.role === 'student' && (
                                <>
                                    <section>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                            <BookOpen className="w-5 h-5 text-primary-500" />
                                            <span>Education Details</span>
                                        </h2>
                                        <p className="text-gray-700 whitespace-pre-wrap">{profile.educationDetails || 'No education details added yet.'}</p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                            <Briefcase className="w-5 h-5 text-primary-500" />
                                            <span>Institutional Details</span>
                                        </h2>
                                        <p className="text-gray-700 whitespace-pre-wrap">{profile.institutionalDetails || 'No institutional details added yet.'}</p>
                                    </section>
                                </>
                            )}

                            {profile.role === 'instructor' && (
                                <>
                                    <section>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                            <Briefcase className="w-5 h-5 text-primary-500" />
                                            <span>Professional Details</span>
                                        </h2>
                                        <p className="text-gray-700 whitespace-pre-wrap">{profile.profession || 'No profession specified.'}</p>
                                        <p className="text-gray-700 whitespace-pre-wrap mt-2">Qualification: {profile.qualification || 'Not specified'}</p>
                                        <p className="text-gray-700 whitespace-pre-wrap mt-2">Experience: {profile.experience || 'Not specified'}</p>
                                        <p className="text-gray-700 whitespace-pre-wrap mt-2">Instructor Summary: {profile.instructorSummary || 'No summary added.'}</p>
                                    </section>
                                </>
                            )}
                        </div>

                        {/* Sidebar Area */}
                        <div className="space-y-8">
                            <section className="bg-gray-50 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                    <Code className="w-5 h-5 text-accent-500" />
                                    <span>Area of Interest</span>
                                </h2>
                                <div className="text-gray-700">
                                    {profile.areaOfInterest ? (
                                        <span className="inline-block bg-white px-3 py-1 rounded-full border border-gray-200 text-sm">{profile.areaOfInterest}</span>
                                    ) : (
                                        <span className="text-sm text-gray-500">Not specified</span>
                                    )}
                                </div>
                            </section>

                            <section className="bg-gray-50 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                    <Award className="w-5 h-5 text-accent-500" />
                                    <span>Certificates</span>
                                </h2>
                                {profile.certificatesEarned && profile.certificatesEarned.length > 0 ? (
                                    <ul className="space-y-2">
                                        {profile.certificatesEarned.map((cert, index) => (
                                            <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>
                                                <span>{cert}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No certificates added.</p>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;