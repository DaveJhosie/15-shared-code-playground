INSERT INTO users (id, name, email, password_hash) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Alice',
    'alice@example.com',
    crypt('Password123!', gen_salt('bf', 10))
),
(
    '22222222-2222-2222-2222-222222222222',
    'Bob',
    'bob@example.com',
    crypt('Password123!', gen_salt('bf', 10))
),
(
    '33333333-3333-3333-3333-333333333333',
    'Carol',
    'carol@example.com',
    crypt('Password123!', gen_salt('bf', 10))
);


INSERT INTO projects (id, name, description, owner_id) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Welcome Project',
    'Sample project for the demo',
    '11111111-1111-1111-1111-111111111111'
);


INSERT INTO project_members (project_id, user_id, role) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'owner'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'editor'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'viewer'
);


INSERT INTO files (id, project_id, name, language, content) VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'hello.js',
    'javascript',
    E'console.log("Hello from the playground");\n'
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'hello.py',
    'python',
    E'print("Hello from the playground")\n'
);


INSERT INTO file_versions (
    file_id,
    version_number,
    label,
    content,
    created_by
) VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    1,
    'Initial version',
    E'console.log("Hello from the playground");\n',
    '11111111-1111-1111-1111-111111111111'
);
