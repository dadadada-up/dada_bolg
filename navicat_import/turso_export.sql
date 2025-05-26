CREATE TABLE IF NOT EXISTS posts (
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined
);

INSERT INTO posts (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17) VALUES (1, 'hello-world', 'Hello World', 'This is a test post', NULL, NULL, NULL, 1, 1, 1, 0, 1, NULL, NULL, NULL, '2025-05-26 07:06:20', '2025-05-26 07:06:20', NULL);

CREATE TABLE IF NOT EXISTS categories (
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined
);

INSERT INTO categories (0, 1, 2, 3, 4, 5, 6, 7) VALUES (1, '编程', 'programming', '编程相关文章', NULL, 0, '2025-05-26T07:05:51.372Z', '2025-05-26T07:05:51.372Z');
INSERT INTO categories (0, 1, 2, 3, 4, 5, 6, 7) VALUES (2, '技术', 'tech', '技术相关文章', NULL, 0, '2025-05-26T07:05:51.372Z', '2025-05-26T07:05:51.372Z');
INSERT INTO categories (0, 1, 2, 3, 4, 5, 6, 7) VALUES (3, '生活', 'life', '生活随笔', NULL, 0, '2025-05-26T07:05:51.372Z', '2025-05-26T07:05:51.372Z');

CREATE TABLE IF NOT EXISTS tags (
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined
);

INSERT INTO tags (0, 1, 2, 3, 4, 5) VALUES (1, '测试', 'test', 0, '2025-05-26 07:06:57', '2025-05-26 07:06:57');

CREATE TABLE IF NOT EXISTS post_categories (
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined
);

INSERT INTO post_categories (0, 1, 2) VALUES (1, 2, '2025-05-26 07:06:50');

CREATE TABLE IF NOT EXISTS post_tags (
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined
);

INSERT INTO post_tags (0, 1, 2) VALUES (1, 1, '2025-05-26 07:07:05');

CREATE TABLE IF NOT EXISTS slug_mapping (
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined
);


CREATE TABLE IF NOT EXISTS sync_status (
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined,
  undefined undefined DEFAULT undefined
);


