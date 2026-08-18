import User from './User.js';
import Course from './Course.js';
import Class from './Class.js';
import ClassNotes from './ClassNotes.js';
import Material from './Material.js';
import Enrollment from './Enrollment.js';
import Attendance from './Attendance.js';
import Announcement from './Announcement.js';
import Discussion from './Discussion.js';
import Assignment from './Assignment.js';
import Submission from './Submission.js';
import Quiz from './Quiz.js';
import QuizQuestion from './QuizQuestion.js';
import DiscussionBoard from './DiscussionBoard.js';
import ForumPost from './ForumPost.js';
import ForumReply from './ForumReply.js';
import Certificate from './Certificate.js';
import Payment from './Payment.js';
import CourseReview from './CourseReview.js';
import VideoMetadata from './VideoMetadata.js';
import Subtitle from './Subtitle.js';
import OAuthToken from './OAuthToken.js';
import Institute from './Institute.js';
import Program from './Program.js';
import InstructorInstitute from './InstructorInstitute.js';
import ProgramEnrollment from './ProgramEnrollment.js';

// Define relationships

// User-Course relationships
User.hasMany(Course, {
    foreignKey: 'instructorId',
    as: 'courses'
});
Course.belongsTo(User, {
    foreignKey: 'instructorId',
    as: 'instructor'
});

// Course-Class relationships
Course.hasMany(Class, {
    foreignKey: 'courseId',
    as: 'classes',
    onDelete: 'CASCADE'
});
Class.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

// Course-Material relationships
Course.hasMany(Material, {
    foreignKey: 'courseId',
    as: 'materials',
    onDelete: 'CASCADE'
});
Material.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

// User-Enrollment-Course relationships (many-to-many)
User.hasMany(Enrollment, {
    foreignKey: 'studentId',
    as: 'enrollments'
});
Enrollment.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'student'
});

Course.hasMany(Enrollment, {
    foreignKey: 'courseId',
    as: 'enrollments',
    onDelete: 'CASCADE'
});
Enrollment.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

// Class-Attendance-User relationships
Class.hasMany(Attendance, {
    foreignKey: 'classId',
    as: 'attendances',
    onDelete: 'CASCADE'
});
Attendance.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class'
});

User.hasMany(Attendance, {
    foreignKey: 'studentId',
    as: 'attendances'
});
Attendance.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'student'
});

// Class-ClassNotes relationships
Class.hasOne(ClassNotes, {
    foreignKey: 'classId',
    as: 'notes',
    onDelete: 'CASCADE'
});
ClassNotes.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class'
});

User.hasMany(ClassNotes, {
    foreignKey: 'instructorId',
    as: 'classNotes'
});
ClassNotes.belongsTo(User, {
    foreignKey: 'instructorId',
    as: 'instructor'
});

// Course-Announcement relationships
Course.hasMany(Announcement, {
    foreignKey: 'courseId',
    as: 'announcements',
    onDelete: 'CASCADE'
});
Announcement.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});
User.hasMany(Announcement, {
    foreignKey: 'instructorId',
    as: 'announcements'
});
Announcement.belongsTo(User, {
    foreignKey: 'instructorId',
    as: 'instructor'
});

// Course-Discussion relationships
Course.hasMany(Discussion, {
    foreignKey: 'courseId',
    as: 'discussions',
    onDelete: 'CASCADE'
});
Discussion.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});
User.hasMany(Discussion, {
    foreignKey: 'userId',
    as: 'discussions'
});
Discussion.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Course-Assignment relationships
Course.hasMany(Assignment, {
    foreignKey: 'courseId',
    as: 'assignments',
    onDelete: 'CASCADE'
});
Assignment.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

// Assignment-Submission relationships
Assignment.hasMany(Submission, {
    foreignKey: 'assignmentId',
    as: 'submissions',
    onDelete: 'CASCADE'
});
Submission.belongsTo(Assignment, {
    foreignKey: 'assignmentId',
    as: 'assignment'
});

// User-Submission relationships
User.hasMany(Submission, {
    foreignKey: 'studentId',
    as: 'submissions'
});
Submission.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'student'
});

// Quiz relationships
Course.hasMany(Quiz, {
    foreignKey: 'courseId',
    as: 'quizzes',
    onDelete: 'CASCADE'
});
Quiz.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

Quiz.hasMany(QuizQuestion, {
    foreignKey: 'quizId',
    as: 'questions',
    onDelete: 'CASCADE'
});
QuizQuestion.belongsTo(Quiz, {
    foreignKey: 'quizId',
    as: 'quiz'
});

// Discussion Board relationships
Course.hasMany(DiscussionBoard, {
    foreignKey: 'courseId',
    as: 'discussionBoards',
    onDelete: 'CASCADE'
});
DiscussionBoard.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

DiscussionBoard.hasMany(ForumPost, {
    foreignKey: 'boardId',
    as: 'posts',
    onDelete: 'CASCADE'
});
ForumPost.belongsTo(DiscussionBoard, {
    foreignKey: 'boardId',
    as: 'board'
});

User.hasMany(ForumPost, {
    foreignKey: 'authorId',
    as: 'forumPosts'
});
ForumPost.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
});

ForumPost.hasMany(ForumReply, {
    foreignKey: 'postId',
    as: 'replies',
    onDelete: 'CASCADE'
});
ForumReply.belongsTo(ForumPost, {
    foreignKey: 'postId',
    as: 'post'
});

User.hasMany(ForumReply, {
    foreignKey: 'authorId',
    as: 'forumReplies'
});
ForumReply.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
});

// Certificate relationships
User.hasMany(Certificate, {
    foreignKey: 'userId',
    as: 'certificates'
});
Certificate.belongsTo(User, {
    foreignKey: 'userId',
    as: 'student'
});

Course.hasMany(Certificate, {
    foreignKey: 'courseId',
    as: 'certificates'
});
Certificate.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

// Payment relationships
User.hasMany(Payment, {
    foreignKey: 'userId',
    as: 'payments'
});
Payment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

Course.hasMany(Payment, {
    foreignKey: 'courseId',
    as: 'payments'
});
Payment.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

// Course Review relationships
Course.hasMany(CourseReview, {
    foreignKey: 'courseId',
    as: 'reviews'
});
CourseReview.belongsTo(Course, {
    foreignKey: 'courseId',
    as: 'course'
});

User.hasMany(CourseReview, {
    foreignKey: 'studentId',
    as: 'reviews'
});
CourseReview.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'student'
});

// Video Metadata relationships
Material.hasOne(VideoMetadata, {
    foreignKey: 'videoId',
    as: 'metadata'
});
VideoMetadata.belongsTo(Material, {
    foreignKey: 'videoId',
    as: 'video'
});

// Subtitle relationships
Material.hasMany(Subtitle, {
    foreignKey: 'videoId',
    as: 'subtitles'
});
Subtitle.belongsTo(Material, {
    foreignKey: 'videoId',
    as: 'video'
});

User.hasMany(Subtitle, {
    foreignKey: 'uploadedBy',
    as: 'uploadedSubtitles'
});
Subtitle.belongsTo(User, {
    foreignKey: 'uploadedBy',
    as: 'uploader'
});

// OAuth Token relationships
User.hasMany(OAuthToken, {
    foreignKey: 'userId',
    as: 'oauthTokens'
});
OAuthToken.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Institute relationships
Institute.hasMany(Program, {
    foreignKey: 'instituteId',
    as: 'programs',
    onDelete: 'CASCADE'
});
Program.belongsTo(Institute, {
    foreignKey: 'instituteId',
    as: 'institute'
});

// Instructor-Institute many-to-many relationships
User.hasMany(InstructorInstitute, {
    foreignKey: 'instructorId',
    as: 'instituteMemberships'
});
InstructorInstitute.belongsTo(User, {
    foreignKey: 'instructorId',
    as: 'instructor'
});

Institute.hasMany(InstructorInstitute, {
    foreignKey: 'instituteId',
    as: 'instructors',
    onDelete: 'CASCADE'
});
InstructorInstitute.belongsTo(Institute, {
    foreignKey: 'instituteId',
    as: 'institute'
});

// Program-Enrollment relationships (students enrolling in programs)
Program.hasMany(ProgramEnrollment, {
    foreignKey: 'programId',
    as: 'enrollments',
    onDelete: 'CASCADE'
});
ProgramEnrollment.belongsTo(Program, {
    foreignKey: 'programId',
    as: 'program'
});

User.hasMany(ProgramEnrollment, {
    foreignKey: 'studentId',
    as: 'programEnrollments'
});
ProgramEnrollment.belongsTo(User, {
    foreignKey: 'studentId',
    as: 'student'
});

export {
    User,
    Course,
    Class,
    ClassNotes,
    Material,
    Enrollment,
    Attendance,
    Announcement,
    Discussion,
    Assignment,
    Submission,
    Quiz,
    QuizQuestion,
    DiscussionBoard,
    ForumPost,
    ForumReply,
    Certificate,
    Payment,
    CourseReview,
    VideoMetadata,
    Subtitle,
    OAuthToken,
    Institute,
    Program,
    InstructorInstitute,
    ProgramEnrollment
};

