export const processPostContent = (content: string) => {
  const words = content.split(" ");

  const hashtags: string[] = [];
  const contentWords: string[] = [];

  words.forEach((word) => {
    if (word.startsWith("#") && word.length > 1) {
      hashtags.push(word);
    } else {
      contentWords.push(word);
    }
  });

  const textContent = contentWords.join(" ");

  return { textContent, hashtags };
};
