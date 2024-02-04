import Parser from "rss-parser";

//parse the Rss feed from yts.am

export async function ytsRss() {
  const parser = new Parser();
  const ytsRegex = {
    imdbRatingRegex: /([0-9].[0-9]\/10)|(10|[0-9]\/10)$/gm,
    sizeRegex: /([0-9]?[0-9]?[0-9].[0-9]?[0-9]\s?(GB|MB))|([0-9]?[0-9]\s?(GB|MB))/gm,
    durationRegex: /([0-9]hr\s?[0-5]?[0-9]\s?min)/gm,
    descriptionRegex: /[0-9]\s?min\n?(.*)/gm,
    genreRegex: /Genre:\s?(\w*\s?\/\s?\w*)/gm,
    imageLinkRegex: /https:\/\/img.yts.mx\/assets\/images\/\w*\/.*?\/[^"]+"/gm,
  };

  const movies = [];
  try {
    const feed = await parser.parseURL("https://yts.am/rss");
    const items = feed.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const imdbRating = execRegex(
        ytsRegex.imdbRatingRegex,
        item.content ?? "",
        1
      );
      const size = execRegex(ytsRegex.sizeRegex, item.content ?? "", 1);
      const duration = execRegex(ytsRegex.durationRegex, item.content ?? "", 1);
      const description = execRegex(
        ytsRegex.descriptionRegex,
        item.content ?? "",
        1
      ).replace(`<br /><br />`,'')
      const genre = execRegex(ytsRegex.genreRegex, item.content ?? "", 1);
      const imageLink = execRegex(
        ytsRegex.imageLinkRegex,
        item.content ?? "",
        0
      ).replace(`"`,'')
      const title = item.title;
      const link = item.link;
      movies.push({
        imdbRating,
        size,
        duration,
        description,
        genre,
        imageLink,
        title,
        link,
      });
    }
    console.log(movies, "ytsRss");
  } catch (error) {
    console.log(error, "ytsRss");
  }
}

function execRegex(regex: RegExp, value: string, index: number) {
  const valueRegex = new RegExp(regex);
  const challenge = valueRegex.exec(value);
  if (challenge === null || challenge[index] === `<br /><br />`) return "Not Found";
  return challenge[index];
}
