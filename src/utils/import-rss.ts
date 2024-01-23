import { parse } from "path";
import Parser from "rss-parser";
type CustomFeed = {Custom_Fields: string};
type CustomItem = {"content:encoded":string};
export async function rssParser() {
  const parser: Parser<CustomFeed, CustomItem>  = new Parser({
    customFields: {
      feed: ["Custom_Fields"],
      item: ["content:encoded"],
    },
    defaultRSS:2.0,
    maxRedirects:500
  });

  try {
    const results = await parser.parseURL("https://fitgirl-repacks.site/feed/");
    const titles = results.items.map((item) => item.title).flatMap(e => e !== 'A Call for Donations' ? e : null);
    const links = results.items.map((item) => item.link).flatMap(e => e !== 'A Call for Donations' ? e : null);
    console.log();
  } catch (error) {
    console.log(error); 
  }
}

// Upcoming Repacks