import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, ArrowRight } from 'lucide-react';

const ClassCard = ({ classSession, isInstructor = false }) => {
    const isLive = classSession.status === 'ongoing';
    const scheduledDate = new Date(classSession.scheduledAt);

    return (
        <div className="bg-white rounded-google border border-gray-200 p-5 hover:shadow-google transition-all duration-200 flex justify-between items-start">
            <div className="space-y-3 flex-grow">
                <div className="flex items-center space-x-3">
                    {isLive && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-error-500"></span>
                        </span>
                    )}
                    <h3 className="font-semibold text-primary-700 text-base">
                        {classSession.title}
                    </h3>
                </div>

                <p className="text-sm text-primary-500">
                    {classSession.course?.title}
                </p>

                <div className="flex items-center space-x-4 text-xs text-primary-400">
                    <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{scheduledDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end space-x-3 gap-2 ml-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-google-sm ${classSession.status === 'ongoing' ? 'bg-error-100 text-error-700' :
                        classSession.status === 'completed' ? 'bg-success-100 text-success-700' :
                            'bg-accent-100 text-accent-700'
                    }`}>
                    {classSession.status === 'ongoing' ? '🔴 Live Now' :
                        classSession.status === 'completed' ? '✓ Completed' :
                            `Will be live on ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>

                {(isLive || isInstructor) && (
                    <Link
                        to={`/class/${classSession.id}`}
                        className="px-4 py-2 rounded-google bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium shadow-google-sm hover:shadow-google transition-all duration-200 flex items-center space-x-1 whitespace-nowrap"
                    >
                        <Video className="w-4 h-4" />
                        <span>{isInstructor ? 'Host' : 'Join'}</span>
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                )}
            </div>
        </div>
    );
};

export default ClassCard;
