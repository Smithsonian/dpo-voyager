--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
PRAGMA encoding = 'UTF-8';
PRAGMA foreign_keys = OFF;

-- performance tuning
PRAGMA mmap_size = 268435456; -- 2Gb

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK(3 <= length(username)),
  email TEXT UNIQUE,
  password TEXT,
  isAdministrator INTEGER NOT NULL DEFAULT 0
);

--set authors to "default" where it was this user
CREATE TRIGGER delete_user AFTER DELETE ON users
BEGIN
  UPDATE files SET fk_author_id = 0 WHERE fk_author_id = OLD.user_id;
  UPDATE documents SET fk_author_id = 0 WHERE fk_author_id = OLD.user_id;
  UPDATE scenes SET access = json_remove(access, '$.' || OLD.user_id) WHERE json_extract(access,'$.' || OLD.user_id) NOT NULL;
END;

CREATE INDEX usernames ON users(username);

CREATE TABLE scenes (
  scene_id INTEGER PRIMARY KEY,
  scene_name TEXT NOT NULL UNIQUE,
  ctime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  access TEXT DEFAULT '{"0":"read"}' CHECK(json_valid(access))
);

--remove all files and documents referencing this scene
CREATE TRIGGER delete_scene AFTER DELETE ON scenes
BEGIN
  DELETE FROM files WHERE fk_scene_id = OLD.scene_id;
  DELETE FROM documents WHERE fk_scene_id = OLD.scene_id;
END;

CREATE INDEX scenenames ON scenes(scene_name);

-- documents are serialized to DB and versioned append-only
CREATE TABLE documents (
  doc_id INTEGER PRIMARY KEY,
  data TEXT,
  ctime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generation INTEGER DEFAULT 1,
  fk_author_id INTEGER NOT NULL,
  fk_scene_id INTEGER NOT NULL,
  FOREIGN KEY(fk_scene_id) REFERENCES scenes(scene_id),
  FOREIGN KEY(fk_author_id) REFERENCES users(user_id)
);

-- files are dumped to disk (typ. > 100ko)
CREATE TABLE files (
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

CREATE TABLE keys (
  key_id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_data BLOB NOT NULL 
);

CREATE TABLE config (
  name TEXT PRIMARY KEY,
  value BLOB
);

--128 bits of data is the default best for sha1
INSERT INTO keys (key_data) VALUES (randomblob(16));

--we rely strongly on default id always being 0 and "any" being 1
INSERT INTO users (user_id, username) VALUES(0, "default");
INSERT INTO users (user_id, username) VALUES(1, "any");

PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
PRAGMA foreign_keys = OFF;

DROP TRIGGER delete_user;
DROP TRIGGER delete_scene;

DROP INDEX usernames;
DROP INDEX scenenames;

DROP TABLE users;
DROP TABLE scenes;
DROP TABLE documents;
DROP TABLE files;

DROP TABLE keys;
DROP TABLE config;
