/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */


const _triggerDownload = function(dataURL: string, fileName: string)
{
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default {
    /**
     * Prompts the user to download the provided text content as a file.
     * @param text text string to include.
     * @param fileName name of the downloadable file.
     */
    text: function(text: string, fileName: string) {

        const dataURL = window.URL.createObjectURL(new Blob([text], { type: "text/plain" }));
        _triggerDownload(dataURL, fileName);
    },

    /**
     * Prompts the user to download the provided JSON content as a file.
     * @param json JSON data to include.
     * @param fileName name of the downloadable file.
     */
    json: function(json: object | string, fileName: string) {

        if (typeof json === "object") {
            json = JSON.stringify(json);
        }

        const dataURL = window.URL.createObjectURL(new Blob([json], { type: "text/json" }));
        _triggerDownload(dataURL, fileName);
    },

    /**
     * Prompts the user to download the content from the given URL.
     * @param url URL of the content to be downloaded.
     * @param fileName name of the downloadable file.
     */
    url: function(url: string, fileName: string) {
        _triggerDownload(url, fileName);
    }
}

