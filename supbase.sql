-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL, -- 'admin', 'moderator', 'learner'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create progress table
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    room_id UUID NOT NULL,
    current_phase INTEGER NOT NULL,
    completed_lessons INTEGER NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Create feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    room_id UUID NOT NULL,
    feedback_text TEXT NOT NULL,
    feedback_type VARCHAR(50) NOT NULL, -- e.g., 'general', 'technical', 'content'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Create admin_approvals table
CREATE TABLE admin_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    room_id UUID NOT NULL,
    approval_status VARCHAR(50) NOT NULL, -- e.g., 'pending', 'approved', 'rejected'
    approval_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Create roles
CREATE ROLE admin WITH LOGIN;
CREATE ROLE moderator WITH LOGIN;
CREATE ROLE learner WITH LOGIN;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;

GRANT SELECT, INSERT, UPDATE ON TABLE users TO moderator;
GRANT SELECT, INSERT, UPDATE ON TABLE rooms TO moderator;
GRANT SELECT, INSERT, UPDATE ON TABLE progress TO moderator;
GRANT SELECT, INSERT, UPDATE ON TABLE feedback TO moderator;
GRANT SELECT, INSERT, UPDATE ON TABLE admin_approvals TO moderator;

GRANT SELECT, INSERT, UPDATE ON TABLE progress TO learner;
GRANT SELECT, INSERT, UPDATE ON TABLE feedback TO learner;
GRANT SELECT, INSERT, UPDATE ON TABLE admin_approvals TO learner;

-- Add RLS policies
ALTER TABLE users
    ADD POLICY read_users FOR SELECT
    TO learner, moderator
    USING (user_type = (SELECT user_type FROM users WHERE id = auth.uid()));

ALTER TABLE users
    ADD POLICY write_users FOR INSERT, UPDATE
    TO admin
    USING (auth.role() = 'admin');

ALTER TABLE rooms
    ADD POLICY read_rooms FOR SELECT
    TO public
    USING (true);

ALTER TABLE rooms
    ADD POLICY write_rooms FOR INSERT, UPDATE
    TO admin
    USING (true);

ALTER TABLE progress
    ADD POLICY read_progress FOR SELECT
    TO learner, moderator
    USING (user_id = auth.uid());

ALTER TABLE progress
    ADD POLICY write_progress FOR INSERT, UPDATE
    TO learner, moderator
    USING (user_id = auth.uid());

ALTER TABLE feedback
    ADD POLICY read_feedback FOR SELECT
    TO learner, moderator
    USING (user_id = auth.uid());

ALTER TABLE feedback
    ADD POLICY write_feedback FOR INSERT, UPDATE
    TO learner, moderator
    USING (user_id = auth.uid());

ALTER TABLE admin_approvals
    ADD POLICY read_admin_approvals FOR SELECT
    TO admin, moderator
    USING (true);

ALTER TABLE admin_approvals
    ADD POLICY write_admin_approvals FOR INSERT, UPDATE
    TO admin
    USING (true);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_room_id ON progress(room_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_room_id ON feedback(room_id);
CREATE INDEX idx_admin_approvals_user_id ON admin_approvals(user_id);
CREATE INDEX idx_admin_approvals_room_id ON admin_approvals(room_id);

-- Insert sample data
INSERT INTO users (id, email, password_hash, user_type) VALUES
('08c55c8e-8f0a-4a4e-960d-3a9762d5a5c1', 'admin@example.com', '$2b$10$...', 'admin'),
('another-user-id...', 'learner@example.com', '$2b$10$...', 'learner');

INSERT INTO rooms (id, room_code, name, description) VALUES
('room-id-1', 'ROOM123', 'Introduction to Programming', 'Basic programming concepts for beginners');

INSERT INTO progress (id, user_id, room_id, current_phase, completed_lessons) VALUES
('progress-id-1', 'another-user-id...', 'room-id-1', 1, 2);

INSERT INTO feedback (id, user_id, room_id, feedback_text, feedback_type) VALUES
('feedback-id-1', 'another-user-id...', 'room-id-1', 'Great content!', 'general');

INSERT INTO admin_approvals (id, user_id, room_id, approval_status) VALUES
('approval-id-1', 'another-user-id...', 'room-id-1', 'pending');