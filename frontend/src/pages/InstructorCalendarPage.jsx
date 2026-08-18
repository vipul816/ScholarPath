import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Plus, BookOpen, ListTodo, BellRing } from 'lucide-react';
import { classAPI } from '../services/api';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const InstructorCalendarPage = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const response = await classAPI.getCalendar({
                    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                    to: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString()
                });
                if (response.success) {
                    setClasses(response.events || []);
                }
            } catch (error) {
                console.error('Failed to load instructor calendar data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCalendar();
    }, []);

    const monthStart = useMemo(() => {
        const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const offset = start.getDay();
        return new Date(start.getFullYear(), start.getMonth(), 1 - offset);
    }, [selectedDate]);

    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 42; i += 1) {
            const day = new Date(monthStart);
            day.setDate(monthStart.getDate() + i);
            days.push(day);
        }
        return days;
    }, [monthStart]);

    const eventsByDay = useMemo(() => {
        const map = {};
        classes.forEach((singleClass) => {
            const key = formatDateKey(singleClass.start || singleClass.scheduledAt);
            if (!map[key]) map[key] = [];
            map[key].push(singleClass);
        });
        return map;
    }, [classes]);

    const selectedDayKey = formatDateKey(selectedDate);
    const dailyEvents = eventsByDay[selectedDayKey] || [];

    const currentMonthLabel = selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const upcomingTasks = useMemo(() => {
        return classes.slice(0, 5).map((singleClass) => ({
            id: singleClass.id,
            title: singleClass.title,
            due: new Date(singleClass.start || singleClass.scheduledAt),
            type: 'Class',
            courseTitle: singleClass.courseTitle || singleClass.course?.title || 'Course'
        }));
    }, [classes]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 card p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Planner</p>
                            <h1 className="text-3xl font-bold text-gray-900 mt-1">Instructor Calendar</h1>
                        </div>
                        <button className="btn btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Event
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <button
                            className="btn btn-outline px-3 py-2 text-sm"
                            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                        >
                            Previous
                        </button>
                        <h2 className="text-xl font-semibold text-gray-900">{currentMonthLabel}</h2>
                        <button
                            className="btn btn-outline px-3 py-2 text-sm"
                            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                        >
                            Next
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500 mb-2">
                        {WEEKDAY_LABELS.map((day) => (
                            <div key={day} className="py-2">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day) => {
                            const dayKey = formatDateKey(day);
                            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                            const isSelected = dayKey === selectedDayKey;
                            const dayClassList = eventsByDay[dayKey] || [];

                            return (
                                <button
                                    key={dayKey}
                                    onClick={() => setSelectedDate(day)}
                                    className={`min-h-[110px] rounded-xl border p-2 text-left transition ${
                                        isSelected
                                            ? 'border-primary-600 bg-primary-50 shadow-sm'
                                            : 'border-gray-200 bg-white hover:border-primary-200'
                                    } ${!isCurrentMonth ? 'opacity-45' : ''}`}
                                >
                                    <div className={`text-sm font-semibold mb-2 ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                                        {day.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {dayClassList.slice(0, 2).map((singleClass) => (
                                            <div
                                                key={singleClass.id}
                                                className="truncate rounded-md bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700"
                                            >
                                                {singleClass.title || 'Untitled event'}
                                            </div>
                                        ))}
                                        {dayClassList.length > 2 && (
                                            <div className="text-[10px] font-medium text-gray-500">+{dayClassList.length - 2} more</div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="w-full lg:w-[360px] space-y-6">
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarDays className="w-5 h-5 text-primary-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Selected Day</h3>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>

                        {dailyEvents.length > 0 ? (
                            <div className="space-y-3">
                                {dailyEvents.map((singleClass) => (
                                    <div key={singleClass.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-medium text-gray-900">{singleClass.title}</div>
                                            <span className="badge badge-primary">{singleClass.type || 'Class'}</span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                                            <Clock3 className="w-4 h-4" />
                                            {new Date(singleClass.start || singleClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" />
                                            {singleClass.courseTitle || singleClass.course?.title || 'Course'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                                No classes scheduled for this day.
                            </div>
                        )}
                    </div>

                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <ListTodo className="w-5 h-5 text-primary-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
                        </div>

                        <div className="space-y-3">
                            {upcomingTasks.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-200 p-3">
                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{task.title}</div>
                                        <div className="text-sm text-gray-500 mt-1">{task.courseTitle}</div>
                                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                            <Clock3 className="w-3 h-3" />
                                            {task.due.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BellRing className="w-5 h-5 text-primary-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Reminders</h3>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800">
                                Review all class recordings before the next live session.
                            </div>
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">
                                Follow up with students who have not completed assignments.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorCalendarPage;
