import { expect } from "chai";

import WebDAVProvider from "@ff/scene/assets/WebDAVProvider";


const origin = "http://localhost:8000";

/** A PROPFIND response entry, as webdav-server sends it: absolute, percent-encoded href */
function response(path: string, folder: boolean)
{
    const name = decodeURI(path.split("/").filter(part => !!part).pop());
    return `<D:response><D:href>${origin}/${path}</D:href><D:propstat><D:status>HTTP/1.1 200 OK</D:status><D:prop>`
        + `<D:getlastmodified>Wed, 21 Oct 2026 14:43:22 GMT</D:getlastmodified>`
        + `<D:creationdate>2026-10-21T14:43:22-02:00</D:creationdate>`
        + `<D:displayname>${name}</D:displayname>`
        + (folder ? `<D:resourcetype><D:collection/></D:resourcetype>`
            : `<D:resourcetype/><D:getcontentlength>1404</D:getcontentlength><D:getcontenttype>text/html</D:getcontenttype>`)
        + `</D:prop></D:propstat></D:response>`;
}

/** Recursive listing of a folder holding one article */
function listing(folder: string)
{
    const root = encodeURI(folder) + "/";
    return `<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">`
        + response(root, true)
        + response(root + "articles/", true)
        + response(root + "articles/new-article-FR.html", false)
        + `</D:multistatus>`;
}

// plain, with a non-ASCII character, with a space: URL encoding changes the last two
const folders = [ "scene", "scène", "my scene" ];

describe("WebDAVProvider", function(){
  describe("parseListing()", function(){
    folders.forEach(folder => {
      it(`returns paths relative to root folder '${folder}'`, function(){
        const provider = new WebDAVProvider(`${origin}/${encodeURI(folder)}/`);

        const paths = provider.parseListing(listing(folder)).map(info => info.path);

        expect(paths).to.have.members([ "", "articles/", "articles/new-article-FR.html" ]);
      });
    });
  });
});
