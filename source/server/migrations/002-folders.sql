--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
PRAGMA encoding = 'UTF-8';
PRAGMA foreign_keys = ON;

DROP TRIGGER delete_user;
DROP TRIGGER delete_scene;

CREATE TABLE _files (
  file_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT "application/octet-stream",
  generation INTEGER DEFAULT 1,
  hash BLOB,
  ctime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  size INTEGER NOT NULL DEFAULT 0,
  fk_author_id INTEGER NOT NULL,
  fk_scene_id INTEGER NOT NULL,
  FOREIGN KEY(fk_scene_id) REFERENCES scenes(scene_id),
  FOREIGN KEY(fk_author_id) REFERENCES users(user_id),
  UNIQUE(fk_scene_id, name, generation)
);

INSERT INTO _files (
  file_id,
  name,
  mime,
  generation,
  hash,
  ctime,
  size,
  fk_author_id,
  fk_scene_id
) SELECT
  file_id,
  CASE type
    WHEN "articles" THEN "articles/" || name
    WHEN "models" THEN "models/" || name
    ELSE name
  END AS name,
  CASE type
    WHEN "articles" THEN "text/html"
    WHEN "images" THEN "image/jpeg"
    WHEN "models" THEN "model/gltf-binary"
    ELSE "application/octet-stream"
  END AS mime,
  generation,
  hash,
  ctime,
  size,
  fk_author_id,
  fk_scene_id
FROM files;

INSERT INTO _files (name, generation, mime, hash, size, fk_author_id, fk_scene_id) SELECT 
  "articles" AS name,
  "1" AS generation,
  "text/directory" AS mime,
  "directory" AS hash,
  0 AS size,
  0 AS fk_author_id,
  scene_id AS fk_scene_id
FROM scenes
WHERE true
ON CONFLICT (fk_scene_id, name, generation) DO UPDATE SET mime = "text/directory";

INSERT INTO _files (name, generation, mime, hash, size, fk_author_id, fk_scene_id) SELECT 
  "models" AS name,
  "1" AS generation,
  "text/directory" AS mime,
  "directory" AS hash,
  0 AS size,
  0 AS fk_author_id,
  scene_id AS fk_scene_id
FROM scenes
WHERE true
ON CONFLICT (fk_scene_id, name, generation) DO UPDATE SET mime = "text/directory";


DROP TABLE files;
ALTER TABLE _files RENAME TO files;

CREATE TRIGGER delete_user AFTER DELETE ON users
BEGIN
  UPDATE files SET fk_author_id = 0 WHERE fk_author_id = OLD.user_id;
  UPDATE documents SET fk_author_id = 0 WHERE fk_author_id = OLD.user_id;
  UPDATE scenes SET access = json_remove(access, '$.' || OLD.user_id) WHERE json_extract(access,'$.' || OLD.user_id) NOT NULL;
END;

CREATE TRIGGER delete_scene AFTER DELETE ON scenes
BEGIN
  DELETE FROM files WHERE fk_scene_id = OLD.scene_id;
  DELETE FROM documents WHERE fk_scene_id = OLD.scene_id;
END;

CREATE TRIGGER default_folders AFTER INSERT ON scenes
BEGIN
  INSERT INTO files (
    name,
    mime,
    generation,
    hash,
    size,
    fk_author_id,
    fk_scene_id
  ) VALUES
  ("articles", "text/directory", 1, "directory", 0 , 0, NEW.scene_id),
  ("models", "text/directory", 1, "directory", 0 , 0, NEW.scene_id);
END;

--- runs on files that are nested in a folder but no such folder exist
CREATE TRIGGER has_folder BEFORE INSERT ON files
WHEN NEW.name LIKE '%_/_%' AND NOT EXISTS (SELECT name FROM files WHERE files.mime = 'text/directory' AND NEW.name LIKE files.name || '/%')
BEGIN
  SELECT RAISE(ROLLBACK, "ENOENT: no such directory");
END;


CREATE TRIGGER delete_folder AFTER INSERT ON files
WHEN NEW.mime = "text/directory" AND NEW.hash IS NULL
BEGIN
  INSERT INTO files (
    name,
    mime,
    generation,
    hash,
    size,
    fk_author_id,
    fk_scene_id
  ) SELECT
    name,
    "application/octet-stream" AS mime,
    generation + 1 AS generation,
    NULL AS hash,
    '0' AS size,
    NEW.fk_author_id AS fk_author_id,
    files.fk_scene_id AS fk_scene_id
  FROM files
  WHERE fk_scene_id = NEW.fk_scene_id AND name LIKE NEW.name || '/%';
END;


--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
PRAGMA foreign_keys = OFF;
DROP TRIGGER default_folders;
DROP TRIGGER has_folder;
DROP TRIGGER delete_folder;
DROP TRIGGER delete_user;
DROP TRIGGER delete_scene;



CREATE TABLE _files (
  file_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  generation INTEGER DEFAULT 1,
  hash BLOB,
  ctime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  size INTEGER NOT NULL DEFAULT 0,
  fk_author_id INTEGER NOT NULL,
  fk_scene_id INTEGER NOT NULL,
  pathref TEXT GENERATED ALWAYS AS (printf("%x/%s/%s", fk_scene_id, type, name)) VIRTUAL,
  FOREIGN KEY(fk_scene_id) REFERENCES scenes(scene_id),
  FOREIGN KEY(fk_author_id) REFERENCES users(user_id),
  UNIQUE(fk_scene_id, type, name, generation)
);

INSERT INTO _files (
  file_id,
  name,
  type,
  generation,
  hash,
  ctime,
  size,
  fk_author_id,
  fk_scene_id
) SELECT
  file_id,
  SUBSTR(name, INSTR(name, "/") +1) AS name,
  CASE mime
    WHEN "text/html" THEN "articles"
    WHEN "image/jpeg" THEN "images"
    WHEN "model/gltf-binary" THEN "models"
  END AS type,
  generation,
  hash,
  ctime,
  size,
  fk_author_id,
  fk_scene_id
FROM files
WHERE mime IS NOT "text/directory";

DROP TABLE files;
ALTER TABLE _files RENAME TO files;

CREATE TRIGGER delete_user AFTER DELETE ON users
BEGIN
  UPDATE files SET fk_author_id = 0 WHERE fk_author_id = OLD.user_id;
  UPDATE documents SET fk_author_id = 0 WHERE fk_author_id = OLD.user_id;
  UPDATE scenes SET access = json_remove(access, '$.' || OLD.user_id) WHERE json_extract(access,'$.' || OLD.user_id) NOT NULL;
END;

CREATE TRIGGER delete_scene AFTER DELETE ON scenes
BEGIN
  DELETE FROM files WHERE fk_scene_id = OLD.scene_id;
  DELETE FROM documents WHERE fk_scene_id = OLD.scene_id;
END;
