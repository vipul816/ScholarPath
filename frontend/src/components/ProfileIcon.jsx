import React from 'react';
import { Link } from 'react-router-dom';
import { User, Edit3 } from 'lucide-react';

const ProfileIcon = ({ user }) => {
    return (
        <div className="relative group">
            <Link to="/profile" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600">
                {user?.avatar ? (
                    <img src={`http://localhost:3000${user.avatar}`} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-primary-500 transition-colors" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-transparent group-hover:border-primary-500 transition-colors">
                        <User className="w-6 h-6 text-gray-500" />
                    </div>
                )}
                <span className="font-medium hidden md:block">{user?.name}</span>
            </Link>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                </Link>
                <Link to="/profile/edit" className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                </Link>
            </div>
        </div>
    );
};

export default ProfileIcon;
