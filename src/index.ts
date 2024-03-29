#!/usr/bin/env node

import { Log } from '@cli/logger.js';
import { CONSTANTS, testCliArgsInput } from '@cli/terminal.js';
import testCommand from '@commands/test-command.js';
import Schema from '@schema';
import gradient from 'gradient-string';
import { z } from 'zod';
import { ytsRss } from './sites/yts.js';

// ? 👇 title text gradient colors. for more colors see: `https://cssgradient.io/gradient-backgrounds`
const coolGradient = gradient([
  { color: '#FA8BFF', pos: 0 },
  { color: '#2BD2FF', pos: 0.5 },
  { color: '#2BFF88', pos: 1 },
]);

// ? `https://www.kammerl.de/ascii/AsciiSignature.php` 👈 to convert your app's title to ASCII art.
// ? `https://codebeautify.org/javascript-escape-unescape` 👈 escape your title's string for JavaScript.
console.log(
  coolGradient(String.raw` 
 __   __     ______     _____     ______       __     ______        ______     __         __   
/\ "-.\ \   /\  __ \   /\  __-.  /\  ___\     /\ \   /\  ___\      /\  ___\   /\ \       /\ \  
\ \ \-.  \  \ \ \/\ \  \ \ \/\ \ \ \  __\    _\_\ \  \ \___  \     \ \ \____  \ \ \____  \ \ \ 
 \ \_\\"\_\  \ \_____\  \ \____-  \ \_____\ /\_____\  \/\_____\     \ \_____\  \ \_____\  \ \_\
  \/_/ \/_/   \/_____/   \/____/   \/_____/ \/_____/   \/_____/      \/_____/   \/_____/   \/_/
                                                                                               
`),
);

// ⚠️ For testing in development mode only
if (CONSTANTS.isDev) {
  // Here you can test your CLI arguments while using hot reload in development mode.
  testCliArgsInput('test --name="John Doe" --age="30" arg1 arg2 arg3');
}

async function main() {
  const options = Schema.createOptions({
    /** The CLI name that starts your CLI, used for help command. */
    cliName: 'node-cli',
    /** CLI description, used for help command. */
    description: 'A CLI for testing.',
    /**
     * - **Optional** `boolean`
     * - **Default**: `true` when in development mode.
     * - Throw an error if the schema is invalid.
     * - Validate the schema, it's recommended to set this to `false` in production.
     */
    validateSchema: CONSTANTS.isDev,
    /**
     * **Optional** `string`
     *
     * - CLI usage syntax, used for help command.
     */
    argsType: z.string().array().length(0).describe('No arguments are required or allowed.'),
    /**
     * **Optional** `CommandOptions[]`
     *
     * - CLI global options, when no command is given, Example: `--version`
     */
    globalOptions: [
      {
        name: 'help',
        type: z.boolean().optional().describe('Show this help message.'),
        aliases: ['h'],
      },
      {
        name: 'version',
        type: z.boolean().optional().describe('Show the version.'),
        aliases: ['v'],
      },
    ],
  });

  // Add all commands schemas here 👇
  const results = Schema.parse(testCommand.schema /** , You can add more */, options);

  // when parsing arguments fails
  if (!results.success) {
    // ? See Zod docs for more information: `https://zod.dev/?id=error-handling`

    // 🖨️ print a formate error message
    Schema.formatError(results.error);

    // 🖨️ print help message on error
    Schema.printHelp();

    process.exit(1);
  }

  const { command } = results.data;

  if (!command) {
    const { version } = results.data;

    if (version) {
      Log.info('\n  version: 1.0.0\n');
      return;
    }

    Schema.printHelp();
    return;
  }

  if (command === 'test') {
    const { age, name, args } = results.data;

    await testCommand(name, age);

    if (args.length) Log.warn('\nYou Passed extra arguments: ', args.join(', '));
  }
}

// main(); // 🚀 Start the app.
// rssParser()
// fitGirlMagnets()
ytsRss()