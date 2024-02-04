import Parser from "rss-parser";
type CustomFeed = { Custom_Fields: string };
type CustomItem = { "content:encoded": string };


/**
 * Asynchronously parses the RSS feed from "https://fitgirl-repacks.site/feed/" and extracts game information.
 */
export async function parseRssAndExtractGamesInfo() {
  // Create a parser with custom fields and configuration
  const parser: Parser<CustomFeed, CustomItem> = new Parser({
    customFields: {
      feed: ["Custom_Fields"],
      item: ["content:encoded"],
    },
    defaultRSS: 2.0,
    maxRedirects: 500,
  });

  // Define regex pattern to extract game links
  const regexPattern = /class="wplp-box-item"><a href="([^"]+)"/g;
  const regex = new RegExp(regexPattern);
  const matches = [];
  let match;

  try {
    // Parse the RSS feed
    const results = await parser.parseURL("https://fitgirl-repacks.site/feed/");
    // Extract game links from parsed feed
    while ((match = regex.exec(results.items[0]["content:encoded"])) !== null) {
      matches.push(match[1]); // The captured link is stored in match[1]
    }

    // Extract game information from the links
    const games = []
    for (let i = 0; i < matches.length; i++) {
      const element = matches[i];
      const gameNameRegex = /https:\/\/fitgirl-repacks\.site\/([^a]+)\//g
      const nameRegex = new RegExp(gameNameRegex)
      const name = nameRegex.exec(element)
      const magnet  = await fitGirlMagnets(element) 
      if (name !== null && magnet !== undefined){
        // Construct game information object and add to games array
        const gamesInfo = {
          name: name[1].replaceAll('-',' '),
          link: element,
          magnet: magnet
        }
        games.push(gamesInfo)
      }
      
    }
    
    console.log(games) // Print extracted game information
  } catch (error) {
    console.log(error); // Log any errors that occur during parsing or extraction
  }
}

/**
 * Fetches the magnet link for a game from FitGirl Repacks site.
 * @param  gameLink - The link to the FitGirl Repacks page of the game.
 * @returns  - The magnet link for the game.
 */
export async function fitGirlMagnets(gameLink: string) {
  // Define the regex pattern to extract the magnet link from the page content
  const magnetRegex = /1337x<\/a>\s\|\s\[<a\shref="([^"]+)">/gm;
  
  try {
    // Fetch the page content using the provided game link
    const response = await fetch(gameLink);
    const text = await response.text();

    // Extract the magnet link from the page content using the regex pattern
    const magnetLink = new RegExp(magnetRegex);
    const link = magnetLink.exec(text);

    // If no magnet link is found, return null
    if (!link) return null;

    // Log the magnet link and return it
    console.log(link[1]);
    return link[1];
  } catch (error) {
    // Log any errors that occur during the fetch or extraction process
    console.log(error,'fitGirlMagnets' );
  }
}
