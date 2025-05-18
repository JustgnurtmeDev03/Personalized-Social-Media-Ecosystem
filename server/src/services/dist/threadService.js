"use strict";
exports.__esModule = true;
exports.processPostContent = void 0;
exports.processPostContent = function (content) {
    var words = content.split(" ");
    var hashtags = [];
    var contentWords = [];
    words.forEach(function (word) {
        if (word.startsWith("#") && word.length > 1) {
            hashtags.push(word);
        }
        else {
            contentWords.push(word);
        }
    });
    var textContent = contentWords.join(" ");
    return { textContent: textContent, hashtags: hashtags };
};
