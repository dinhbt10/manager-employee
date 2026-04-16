-- Bổ sung cột khi DB PostgreSQL đã có bảng features từ phiên bản cũ (trước khi có trường active).
-- Chạy sau Hibernate (spring.jpa.defer-datasource-initialization=true), chỉ profile docker.
ALTER TABLE features ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
