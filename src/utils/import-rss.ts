import Parser from "rss-parser";
type CustomFeed = { Custom_Fields: string };
type CustomItem = { "content:encoded": string };
export async function rssParser() {
  const parser: Parser<CustomFeed, CustomItem> = new Parser({
    customFields: {
      feed: ["Custom_Fields"],
      item: ["content:encoded"],
    },
    defaultRSS: 2.0,
    maxRedirects: 500,
  });
  var regexPattern = /class="wplp-box-item"><a href="([^"]+)"/g;
  var regex = new RegExp(regexPattern);
  var matches = [];
  var match;

  try {
    const results = await parser.parseURL("https://fitgirl-repacks.site/feed/");
    while ((match = regex.exec(results.items[0]["content:encoded"])) !== null) {
      matches.push(match[1]); // The captured link is stored in match[1]
    }

   const games = []
    for (let i = 0; i < matches.length; i++) {
      const element = matches[i];
      const gmameNameRegex = /https:\/\/fitgirl-repacks\.site\/([^a]+)\//g
      const nameRegex = new RegExp(gmameNameRegex)
      const name = nameRegex.exec(element)
      const magnet  = await fitGirlMagnets(element) 
      if (name !== null && magnet !== undefined){
        const gamesInfo = {
          name: name[1].replaceAll('-',' '),
          link: element,
          magnet: magnet
        }
        games.push(gamesInfo)
      }
      
    }
    
    console.log(games)
  } catch (error) {
    console.log(error);
  }
}

// Upcoming Repacks
export async function fitGirlMagnets(gameLink:string) {
  // const gameLink = 'https://fitgirl-repacks.site/rising-lords/'
  const magnetRegex = /1337x<\/a>\s\|\s\[<a\shref="([^"]+)">/gm
  try {
    const response  = await fetch(gameLink);
    const text = await response.text();
    const magnetLink = new RegExp(magnetRegex)
    const link = magnetLink.exec(text)
    if (!link) return
    console.log(link[1])
    return link[1]
  } catch (error) {
    console.log(error)
  }
}