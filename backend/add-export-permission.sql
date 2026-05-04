-- Script để thêm quyền EMP_EXPORT cho user admin nếu chưa có

-- Thêm feature EMP_EXPORT nếu chưa có
INSERT INTO features (code, name, active)
SELECT 'EMP_EXPORT', 'Xuất Excel nhân viên', true
WHERE NOT EXISTS (SELECT 1 FROM features WHERE code = 'EMP_EXPORT');

-- Gán quyền EMP_EXPORT cho tất cả admin
INSERT INTO user_features (user_id, feature_id)
SELECT u.id, f.id
FROM users u
CROSS JOIN features f
WHERE u.role = 'ADMIN'
  AND f.code = 'EMP_EXPORT'
  AND NOT EXISTS (
    SELECT 1 FROM user_features uf
    WHERE uf.user_id = u.id AND uf.feature_id = f.id
  );
