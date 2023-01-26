
# VFS

Virtual Filesystem adapter.

## Concepts

### Append only

History is guaranteed excepted under [cleanup](#Cleaning-up) conditions. Every file save (typ. PUT requests) creates a new entry in the database

basic getters will return the most appropriate file version for the request.

A **document** with no data or a **file** with a *NULL* *hash* is considered deleted. 


### Types

 - **scenes**: {virtual} Everything is relative to a scene's ID. A scene can have text metadata (eg. it's name) that may change over time.
 - **documents**: {text} the root data node of a scene. Scenes are versioned for each document save.
 - **files**: {blob} everything else, stored as an on-disk object named after the file's SHA256SUM.

This could be mapped to a filesystem representation (as exported by the webDAV routes):

```
scenes/
|-- {name}/
|   |-- document.svx.json
|   |-- models/
|   |   |-- {model}.glb
|   |   `-- [...]
|   |-- images/
|   |   |-- {image}.jpg
|   |   `-- [...]
|   |-- articles/
|   |   |-- {article}.html
|   |   `-- [...]
```

This default representation does not allow the representation of a scene's version history.


### Version management

A "new version" is created with each save of any **file** or **document**.
It should be possible to time-travel through entries using a filter on the `ctime` property.

Restauration of a previous version is done by creating a new entry pointing to the desired hash-object or data-string.

This system is similar to what can be found in [google Docs](https://support.google.com/docs/answer/190843).



### Compression

Data deduplication is done at the **file** level : Any duplicate file hash is discarded.

Most of the data handled (esp. models, images and videos) is already compressed so on-disk compression is not considered useful

**documents** data could be minified (see [improvements](#Improvements))


### Cleaning up

Cleanup should be performed regularly. The cleanup strategy is flexible and proper operations should not depend on any cleanup to be performed
This document is only a guide as to how it may be structured.

- Duplicate **document** saves (same file data, no dependencies modification) SHOULD always be merged to the latest timestamp
- Repeated **document** saves by the same person in a short timespan MAY be merged together, keeping only the last version
- Old versions of a **document** MAY be removed after a configured delay or above a defined number of versions
- Old versions of a **file** that are no longer referenced by any **document** SHOULD be deleted
- Empty **scene** SHOULD be deleted after a time
- on-disk **Blobs** should be deleted if no **file** refers to them


## Improvements

### Documents Compression

Documents could be compressed at rest. storing only diffs would probably yield storage gains especially for documents that are saved often.

### Full text search

full text search could be applied to documents and text files to search through larger collections/histories

### Three Point Merges

The client has the ability to make his request conditional using a `If-Match` header.

Server-side, there is no effort to reconcile multiple changes that might happen in parallel.


## Known bugs and limitations

#### Files creation

files that are created back after being "deleted" are currently not properly reported as "created".