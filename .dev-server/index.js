#!/usr/bin/env node

// src/cli-tools/logger.ts
import chalk from "../node_modules/chalk/source/index.js";
function Log(...messages) {
  console.log(formatLogTitle("LOG", "white"), ...messages);
}
Log.warn = (...messages) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines + formatLogTitle("WARNING", "yellow"), chalk.yellow(afterNewline));
};
Log.success = (...messages) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines + formatLogTitle("SUCCESS", "green"), chalk.green(afterNewline));
};
Log.error = (...messages) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines + formatLogTitle("ERROR", "red"), chalk.red(afterNewline));
};
Log.info = (...messages) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines + formatLogTitle("INFO", "blue"), chalk.blue(afterNewline));
};
function formatLogTitle(title, color) {
  title = " ".repeat(3) + title.padEnd(10);
  return chalk[color]("|") + chalk[color].bold.inverse(title) + chalk[color]("|");
}
function getNewlines(messages) {
  const message = messages.join(" ");
  const newlineRegex = /^(\s*[\n\r]+)/;
  const match = message.match(newlineRegex);
  if (match) {
    const newlines = match[0];
    const afterNewline = message.substring(match[0].length);
    return { newlines, afterNewline };
  }
  return { newlines: "", afterNewline: message };
}

// src/cli-tools/terminal.ts
import { realpathSync } from "fs";
import path from "path";
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function testCliArgsInput(input) {
  const regex = /\s(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const result = input.split(regex).map((item) => item.replace(/"/g, "")).filter(Boolean);
  process.argv.push(...result);
}
var CONSTANTS = {
  /** - Get the current platform */
  platform: process.platform,
  isWindows: process.platform === "win32",
  isMac: process.platform === "darwin",
  isLinux: process.platform === "linux",
  /** - Check if we are in development mode */
  isDev: true,
  /** - Get the project root directory full path */
  get projectRoot() {
    const scriptPath = realpathSync(process.argv[1]);
    const suffixesToRemove = [".dev-server", "dist"];
    const pattern = new RegExp(`(${suffixesToRemove.join("|")})$`);
    return path.dirname(scriptPath).replace(pattern, "");
  }
};

// src/cli-tools/spinner.ts
import chalk2 from "../node_modules/chalk/source/index.js";
var frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
function spinner(message, autoStopTimer = 0) {
  let rowNumber, id;
  async function start(startMessage = message, timer = autoStopTimer) {
    if (id)
      clearInterval(id);
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.once("readable", () => {
      const buf = process.stdin.read(), str = JSON.stringify(buf), xy = /\[(.*)/g.exec(str)?.[0].replace(/\[|R"/g, "").split(";"), pos = { rows: +(xy?.[0] || "0"), cols: +(xy?.[1] || "0") };
      process.stdin.setRawMode(false);
      rowNumber = pos.rows - (id ? 1 : 0);
      id = null;
      let i = 0;
      id = setInterval(() => {
        process.stdout.cursorTo(0, rowNumber);
        process.stdout.clearLine(0);
        const spinner2 = chalk2.cyan(frames[i++ % frames.length]);
        const loadingMessage = chalk2.yellow(startMessage);
        process.stdout.write(`${spinner2}  ${loadingMessage}`);
      }, 80);
    });
    process.stdin.resume();
    process.stdout.write("\x1B[6n");
    if (timer) {
      await sleep(timer);
      stop();
    }
  }
  function stop() {
    if (!id)
      return;
    clearInterval(id);
    id = null;
    process.stdout.cursorTo(0, rowNumber);
    process.stdout.clearLine(0);
  }
  start();
  return {
    /** 🚀 start the spinner. this will stop the previous one. */
    start,
    /** 🛑 stop the animation and clear it. */
    stop,
    /** ✅ stop with a success styled message. */
    success(endMessage) {
      stop();
      Log.success(endMessage, "\n");
    },
    /** ⛔ stop with an error styled message. */
    error(endMessage) {
      stop();
      Log.error(endMessage, "\n");
    },
    /** Stop with a none styled message. */
    log(logMessage) {
      stop();
      process.stdout.write(logMessage);
    }
  };
}

// src/cli-tools/commandSchema/commandSchema.ts
import { z as z2 } from "../node_modules/zod/lib/index.mjs";

// src/cli-tools/commandSchema/parseSchema.ts
import { z } from "../node_modules/zod/lib/index.mjs";

// src/cli-tools/commandSchema/helpSchema.ts
import chalk3 from "../node_modules/chalk/source/index.js";
function commandsSchemaToHelpSchema(schema, cliName, cliDescription, usage) {
  const getType = (item) => {
    if ("value" in item)
      return "literal";
    if (item.safeParse("string").success)
      return "string";
    if (item.safeParse(1).success)
      return "number";
    if (item.safeParse(true).success)
      return "boolean";
    return "string";
  };
  const getCliName = (name) => {
    if (name.length === 1)
      return "-" + name;
    return "--" + name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  };
  const getSyntax = (name, item) => {
    const type = getType(item);
    const cliName2 = getCliName(name);
    if (cliName2.length === 2)
      return cliName2;
    if (type === "boolean" || type === "number")
      return `${cliName2}=${type}`;
    if (type === "string")
      return `${cliName2}="${type}"`;
    if (type === "literal" && "value" in item) {
      if (typeof item.value === "number")
        return `${cliName2}=${item.value.toString()}`;
      return `${cliName2}="${item.value}"`;
    }
    return cliName2;
  };
  const global = schema.filter((c) => c.command === NO_COMMAND)[0];
  return {
    name: cliName ?? "node-cli",
    description: cliDescription,
    usage,
    global: {
      argsDescription: global?.argsType?.description,
      options: global?.options?.map((o) => ({
        syntax: getSyntax(o.name, o.type),
        isOptional: o.type.isOptional(),
        description: o.type.description,
        aliases: o.aliases && o.aliases.map((a) => getCliName(a))
      })) ?? []
    },
    commands: schema.filter((c) => c.command !== NO_COMMAND).map((c) => ({
      name: c.command,
      description: c.description,
      argsDescription: c.argsType && c.argsType.description,
      aliases: c.aliases,
      options: c.options && c.options.map((o) => ({
        syntax: getSyntax(o.name, o.type),
        isOptional: o.type.isOptional(),
        description: o.type.description,
        aliases: o.aliases && o.aliases.map((a) => getCliName(a))
      }))
    }))
  };
}
function printHelpFromSchema(schema) {
  const c = {
    title: chalk3.bold.blue.inverse,
    aliasesTitle: chalk3.hex("#E91E63"),
    command: chalk3.bold.yellow,
    options: chalk3.cyan,
    args: chalk3.green,
    alias: chalk3.hex("#00BCD4"),
    description: chalk3.white,
    value: chalk3.magenta,
    optional: chalk3.italic.dim,
    dim: chalk3.white.dim
  };
  const formatSyntax = (syntax) => {
    if (syntax.includes("=")) {
      const [part1, part2] = syntax.split("=");
      return c.options(part1) + chalk3.reset("=") + c.value(part2.replace(/"/g, c.dim('"')));
    }
    return c.options(syntax);
  };
  const nl = (count) => "\n".repeat(count);
  const indent = (count) => " ".repeat(count);
  const longestCommandName = Math.max(...schema.commands.map((command) => command.name?.length ?? 0));
  const longestGlobalSyntax = Math.max(...schema.global.options.map((option) => option?.syntax?.length ?? 0));
  const longestSyntax = Math.max(
    ...schema.commands.map(
      (command) => command.options ? Math.max(...command.options.map((option) => option.syntax?.length ?? 0), 0) : 0
    )
  );
  const longest = Math.max(longestCommandName, longestGlobalSyntax, longestSyntax);
  if (schema.description) {
    console.log(c.title(" Description "), nl(1));
    console.log(indent(2), c.dim("-"), c.description(schema.description), nl(1));
  }
  const usage = schema.usage ?? schema.name + c.command(" <command>") + c.options(" [options]") + c.args(" [args]");
  console.log(c.title(" Usage "), nl(1));
  console.log(indent(2), c.dim("$"), usage, nl(1));
  if (schema.commands.length) {
    console.log(c.title(" Commands "));
    for (let i = 0; i < schema.commands.length; i++) {
      const { name, description, aliases, argsDescription, options } = schema.commands[i];
      if (!name)
        continue;
      console.log(
        nl(1),
        c.dim("#"),
        c.command(name),
        description ? indent(longest + 6 - name.length) + c.dim("\u2022 ") + description : ""
      );
      if (aliases) {
        console.log(indent(longest + 9), c.aliasesTitle("Aliases  "), c.alias(aliases.join(c.dim(", "))));
      }
      if (argsDescription) {
        console.log(indent(longest + 9), c.args("Arguments"), c.dim("\u2022"), c.description(argsDescription));
      }
      if (!options)
        continue;
      for (let o = 0; o < options.length; o++) {
        const { syntax, isOptional, description: description2, aliases: aliases2 } = options[o];
        console.log(
          nl(1),
          indent(2),
          formatSyntax(syntax),
          indent(longest + 4 - syntax.length),
          c.optional(isOptional ? "optional " : "required "),
          description2 ? c.dim("\u2022 ") + description2 : ""
        );
        if (aliases2) {
          console.log(indent(longest + 9), c.aliasesTitle("Aliases  "), c.alias(aliases2.join(c.dim(", "))));
        }
      }
    }
  }
  console.log("");
  const globalOptions = schema.global.options;
  if (globalOptions.length === 0)
    return;
  console.log(c.title(" Global "));
  if (schema.global.argsDescription) {
    console.log(nl(1), indent(2), c.args.bold("Arguments:"), indent(longest - 6), c.dim("\u2022"), schema.global.argsDescription);
  }
  for (let i = 0; i < globalOptions.length; i++) {
    const { syntax, isOptional, description, aliases } = globalOptions[i];
    console.log(
      nl(1),
      indent(2),
      formatSyntax(syntax),
      indent(longest + 4 - syntax.length),
      c.optional(isOptional ? "optional " : "required "),
      description ? c.dim("\u2022 ") + description : ""
    );
    if (aliases) {
      console.log(indent(longest + 9), c.aliasesTitle("Aliases  "), c.alias(aliases.join(c.dim(", "))));
    }
  }
  console.log("");
}

// src/cli-tools/commandSchema/validate.ts
function checkForDuplicates(arr) {
  const uniqueSet = /* @__PURE__ */ new Set();
  for (const item of arr) {
    if (!item)
      continue;
    if (uniqueSet.has(item))
      return item;
    uniqueSet.add(item);
  }
  return null;
}
function validateDevInput(schema) {
  const testCommandRe = /^[a-z]+-?[a-z]+$/i;
  const testCommandStr = (arr) => arr.findIndex((c) => c && !testCommandRe.test(c));
  const testOptionRe = /^(?:[a-z]+(?:[A-Z][a-z]*)*|[a-z])$/;
  const testOptionStr = (arr) => arr.findIndex((c) => !testOptionRe.test(c));
  const isTypeBoolean = (t) => t.safeParse(true).success;
  const commands = schema.map((s) => s.command);
  const duplicatedCommand = checkForDuplicates(commands);
  if (duplicatedCommand)
    throw new Error(`Duplicate command: ${duplicatedCommand}`);
  const failedCommandIndex = testCommandStr(commands);
  if (failedCommandIndex !== -1) {
    throw new Error(`Invalid command string format: "${commands[failedCommandIndex]}"`);
  }
  const commandAliases = schema.filter((s) => s.aliases).flatMap((s) => s.aliases);
  const duplicatedCommandAlias = checkForDuplicates(commandAliases);
  if (duplicatedCommandAlias)
    throw new Error(`Duplicate command alias: ${duplicatedCommandAlias}`);
  const failedCommandAliasIndex = testCommandStr(commandAliases);
  if (failedCommandAliasIndex !== -1) {
    throw new Error(`Invalid command alias string format: "${commandAliases[failedCommandAliasIndex]}"`);
  }
  const duplicatedCommandAndAlias = checkForDuplicates([...commands, ...commandAliases]);
  if (duplicatedCommandAndAlias)
    throw new Error(`Duplicate command and alias: "${duplicatedCommandAndAlias}"`);
  for (let i = 0; i < schema.length; i++) {
    const { options } = schema[i];
    if (!options)
      continue;
    const optionsNames = options.map((o) => o.name);
    const duplicatedOption = checkForDuplicates(optionsNames);
    if (duplicatedOption)
      throw new Error(`Duplicate option: "${duplicatedOption}"`);
    const failedOptionIndex = testOptionStr(optionsNames);
    if (failedOptionIndex !== -1)
      throw new Error(`Invalid option string format: "${optionsNames[failedOptionIndex]}"`);
    const optionAliases = options.filter((o) => o.aliases).flatMap((o) => o.aliases);
    const duplicatedOptionAlias = checkForDuplicates(optionAliases);
    if (duplicatedOptionAlias) {
      throw new Error(`Duplicate option alias: "${duplicatedOptionAlias}"`);
    }
    const failedOptionAliasIndex = testOptionStr(optionAliases);
    if (failedOptionAliasIndex !== -1) {
      throw new Error(`Invalid option alias string format: "${optionAliases[failedOptionAliasIndex]}"`);
    }
    for (let o = 0; o < options.length; o++) {
      const { name, type, aliases } = options[o];
      const isBoolean = isTypeBoolean(type);
      if (name.length === 1 && !isBoolean) {
        throw new Error(`Option name must be longer than 1 character for a non-boolean type: "${name}"`);
      }
      if (!aliases)
        continue;
      aliases.forEach((a) => {
        if (a.length === 1 && !isBoolean) {
          throw new Error(`Option alias must be longer than 1 character for a non-boolean type: "${name}"`);
        }
      });
    }
  }
}

// src/cli-tools/commandSchema/parseSchema.ts
var NO_COMMAND = "noCommandIsProvided";
function parseArguments(schema) {
  const toBoolean = (str) => /^--.+=\bfalse\b/.test(str) ? false : /^-\w$|^--[^=]+$/.test(str) ? true : null;
  const toNumber = (str) => /--.+=[-+]?(\d*\.)?\d+$/.test(str) ? +str.replace(/^--.+=/, "") : null;
  const toString = (str) => /^--.+=.+$/.test(str) ? str.replace(/^--.+=/, "") : null;
  const isCommand = (str) => schema.some((command) => command.command === str);
  const isCommandAlias = (str) => schema.some((command) => command.aliases && command.aliases.includes(str));
  const commandAliasToCommand = (alias) => schema.filter((s) => s.aliases && s.aliases.includes(alias))[0].command;
  const isOptionAlias = (command, str) => {
    const cmd = schema.filter((c) => c.command === command)[0];
    if (!cmd || !cmd.options)
      return false;
    return cmd.options.some((option) => option.aliases && option.aliases.includes(str));
  };
  const optionAliasToOption = (command, alias) => {
    const cmd = schema.filter((c) => c.command === command)[0];
    if (!cmd || !cmd.options)
      return void 0;
    const matchingOption = cmd.options.find((option) => option.aliases && option.aliases.includes(alias));
    if (matchingOption)
      return matchingOption.name;
    return void 0;
  };
  const isNumber = (num) => typeof num === "number" && !Number.isNaN(num) && Number.isFinite(num);
  const parseKey = (str) => {
    const match = str.toLowerCase().match(/^--?[a-z]+(?:-[a-z]+)*/);
    if (!match || !match[0])
      return null;
    return match[0].replace(/^--?/, "").replace(/-\w/gi, (t) => t.substring(1).toUpperCase());
  };
  const results = { args: [] };
  const syntax = [];
  for (const str of process.argv.slice(2)) {
    const key = parseKey(str), boolean = toBoolean(str), number = toNumber(str), string = isNumber(number) ? null : toString(str), command = isCommand(str) ? str : null, commandAlias = isCommandAlias(str) ? str : null, arg = !str.startsWith("-") ? str : null, value = number ?? boolean ?? string ?? command ?? arg;
    if (key !== null) {
      if (results.command && isOptionAlias(results.command, key)) {
        const option = optionAliasToOption(results.command, key);
        if (option)
          results[option] = value;
        syntax.push("option");
        continue;
      }
      results[key] = value;
      syntax.push("option");
      continue;
    }
    if (arg && !command && !commandAlias) {
      results.args.push(arg);
      syntax.push("arg");
      continue;
    }
    if (command || commandAlias) {
      const parsedCommand = command || commandAliasToCommand(commandAlias);
      results.command = parsedCommand;
      syntax.push("command");
      continue;
    }
  }
  return { results, syntax };
}
var printHelp = () => {
  Log.warn("Help is not implemented yet");
};
function parse(...params) {
  const options = "globalOptions" in params[params.length - 1] ? params.pop() : {};
  const commands = params;
  if (options.globalOptions) {
    commands.unshift({
      command: NO_COMMAND,
      argsType: options.argsType,
      options: options.globalOptions
    });
  }
  if (options.validateSchema ?? CONSTANTS.isDev) {
    try {
      validateDevInput(commands);
    } catch (error) {
      Log.error(error);
      process.exit(1);
    }
  }
  const zodUnion = schemaIntoZodUnion(commands);
  const { results, syntax } = parseArguments(commands);
  const HelpSchema = commandsSchemaToHelpSchema(commands, options.cliName, options.description, options.usage);
  printHelp = () => printHelpFromSchema(HelpSchema);
  const refined = zodUnion.superRefine((_, ctx) => {
    if (syntax.includes("command") && syntax[0] !== "command") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Syntax Error: Command must be the first argument. Move the command before other arguments.",
        fatal: true
      });
      return z.NEVER;
    }
    if (syntax.filter((t) => t === "command").length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Syntax Error: Only one command is allowed. Remove extra commands.",
        fatal: true
      });
      return z.NEVER;
    }
  });
  return refined.safeParse(results);
}
function createParseOptions(options) {
  return options;
}
function formatError(error) {
  const err = error.format();
  for (const key in err) {
    const el = err[key];
    if (!el)
      continue;
    if (Array.isArray(el) && el.length) {
      Log.error(el.join("\n"), "\n");
      continue;
    }
    if (key === "args" && "args" in err && typeof err.args === "object") {
      for (const argKye in err.args) {
        const argEl = err.args[argKye];
        if (!argEl)
          continue;
        if (argKye === "_errors" && "_errors" in argEl && argEl._errors.length) {
          Log.error("args :", argEl._errors.join("\n"), "\n");
        }
        if ("_errors" in argEl && argEl._errors.length)
          Log.error(key, ":", argEl._errors.join("\n"), "\n");
      }
    }
    if ("_errors" in el && el._errors.length)
      Log.error(key, ":", el._errors.join("\n"), "\n");
  }
}

// src/cli-tools/commandSchema/commandSchema.ts
function createCommandSchema(command) {
  return command;
}
function schemaIntoZodUnion(schema) {
  const results = [];
  for (let i = 0; i < schema.length; i++) {
    const cmd = schema[i];
    const options = {};
    if (cmd.options) {
      for (let j = 0; j < cmd.options.length; j++) {
        const option = cmd.options[j];
        options[option.name] = option.type;
      }
    }
    if (cmd.command === NO_COMMAND) {
      results.push(z2.object({ command: z2.literal(void 0), args: cmd.argsType ?? z2.string().array(), ...options }).strict());
      continue;
    }
    const zObject = z2.object({ command: z2.literal(cmd.command), args: cmd.argsType ?? z2.string().array(), ...options }).strict();
    results.push(zObject);
  }
  const resultsTuple = results;
  return z2.discriminatedUnion("command", resultsTuple);
}

// src/cli-tools/commandSchema/index.ts
var Schema = {
  /**
   * - Create a command schema, that can be used in the parse function
   * - `Schema.parse(schema, ...schema, options)`
   *
   * @example
   *   const schema = Schema.createCommand({
   *     command: 'example', // required
   *     description: 'Example command', // Optional - for generating the help message
   *     aliases: ['example-alias'], // Optional - will trigger the same command in the CLI
   *     // Optional - for validating user input and type safety
   *     options: [
   *       {
   *         // Note: one character option names are limited to `boolean` types only
   *         // Required - should be used like this in the CLI `--option-name="value"`
   *         name: 'OptionName',
   *         // Required - Zod types, add description for generating the help message
   *         type: z.string().optional().describe('Option description'),
   *         aliases: ['optionAlias'], // Optional - will trigger the same option in the CLI
   *       },
   *     ],
   *   });
   */
  createCommand: createCommandSchema,
  /**
   * - Create options schema, that can be used in the parse function
   * - `Schema.parse(schema, ...schema, options)`
   * - You can also inline the options, if you want to
   *
   * @example
   *   const options = Schema.createOptions({
   *     // Optional - The CLI name that starts your CLI (package.json.name), for generating the help message
   *     cliName: 'node-cli',
   *     // Optional - The CLI description, for generating the help message
   *     description: 'A CLI for testing.',
   *     // Optional - Throw an error if the schema is invalid.
   *     // This is recommended to set to false in production.
   *     // **Default**: true if in development mode
   *     validateSchema: true,
   *     // Optional - Global options are used when no command is specified,
   *     // For example: `node-cli --help`
   *     globalOptions: [
   *       {
   *         name: 'help',
   *         type: z.boolean().optional().describe('Show this help message.'),
   *         aliases: ['h'],
   *       },
   *       {
   *         name: 'version',
   *         type: z.boolean().optional().describe('Show the version.'),
   *         aliases: ['v'],
   *       },
   *     ],
   *   });
   */
  createOptions: createParseOptions,
  /**
   * - Parse the arguments and return the results
   * - `Schema.parse(schema, ...schema, options)`
   *
   * @example
   *   const results = Schema.parse(schema, ...schema, options);
   *   if(results.success) {
   *   const { command } = results.data;
   *   // check which command was called
   *   if(command === 'example') {
   *   const { OptionName } = results.data; // get the options related to the command
   *   // do something
   *   }
   */
  parse,
  /**
   * - Print the help message that was generated when calling `Schema.parse(schema, ...schema, options)`
   * - If the help message is not generated, it will print a warning.
   */
  printHelp: () => printHelp(),
  /** - Takes a Zod error object and prints a formatted error message. */
  formatError
};
var commandSchema_default = Schema;

// src/utils/utils.ts
import inquirer from "../node_modules/inquirer/lib/inquirer.js";
async function askForName() {
  const { name } = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      default: "John Doe",
      message: "Enter your name :"
    }
  ]);
  return name;
}
async function askForAge() {
  const { age } = await inquirer.prompt([
    {
      type: "input",
      name: "age",
      message: "Enter your age :"
    }
  ]);
  return age;
}

// src/commands/test-command.ts
import { z as z3 } from "../node_modules/zod/lib/index.mjs";
async function testCommand(name, age) {
  name = name || await askForName();
  age = age || await askForAge();
  const loading = spinner("Processing...");
  await sleep(2e3);
  loading.success("Processing done!");
  Log.info(`Hello ${name}, you are ${age} years old.`);
}
testCommand.schema = commandSchema_default.createCommand({
  /**
   * - **Required** `string`
   * - The command name, use kebab-case.
   * - Make sure to not duplicate commands and aliases.
   *
   * @example
   *   command: 'run-app',
   */
  command: "test",
  /**
   * - **Optional** `string`
   * - The description of the command.
   * - Used for generating the help message.
   */
  description: "Run a command for testing.",
  /**
   * - **Optional** `string[]`
   * - The aliases of the command.
   * - Any of the aliases will trigger the same command in the CLI.
   * - Make sure to not duplicate aliases and commands.
   */
  aliases: ["run-test", "test-command"],
  /**
   * - **Optional** `z.ZodArray`
   * - **Default** `z.string().array()`
   * - The arguments of the command.
   * - Those arguments are specific to this command.
   * - Use `z.string().array().describe('Description')` to add a description for help message.
   *
   * @example
   *   argsType: z.string().array().nonempty(), // None-empty string array.
   *   argsType: z.coerce.number().array().max(1), // Converts string to number and accept one or no arguments.
   */
  argsType: z3.string().array().describe("You can pass any arguments to this command."),
  /**
   * - **Optional** `CommandOptions[]`
   * - The options of the command.
   * - Those options are specific to this command.
   */
  options: [
    {
      /**
       * - **Required** `string`
       * - The name of the option, use CamelCase.
       * - For example: the syntax for the option `rootPath` is `--root-path="path"`.
       * - For boolean options, the syntax is `--option` or `--option=true`.
       * - One character option names are limited to `boolean` types only E.g. `b` will be used for `-b`
       *
       * @example
       *   name: 'help'; // Transforms to `--help`
       *   name: 'rootPath'; // Transforms to `--root-path`
       */
      name: "age",
      /**
       * - **Required** `ZodTypes` only string, number or boolean
       * - The type of the option.
       * - The will be used to validate the user input.
       * - `Z.describe()` will be used to generate the help message.
       *
       * @example
       *   type: z.boolean().optional().describe('Describe the option'),
       *   type: z.string().describe('Describe the option'),
       *
       * @see https://zod.dev/?id=types
       */
      type: z3.number().optional().describe("Your age in years."),
      /**
       * - **Optional** `string[]`
       * - The aliases of the option.
       * - Any of the aliases will trigger the same option in the CLI.
       * - One character option names are limited to `boolean` types
       * - Make sure to not duplicate aliases.
       */
      aliases: ["yourAge"]
    },
    {
      name: "name",
      type: z3.string({ invalid_type_error: 'must be a string E.g. --name="John"' }).optional().describe("Your name."),
      aliases: ["yourName"]
    }
  ]
});

// src/index.ts
import gradient from "../node_modules/gradient-string/index.js";
import { z as z4 } from "../node_modules/zod/lib/index.mjs";

// src/sites/yts.ts
import Parser from "../node_modules/rss-parser/index.js";
async function ytsRss() {
  const parser = new Parser();
  const ytsRegex = {
    imdbRatingRegex: /([0-9].[0-9]\/10)|(10|[0-9]\/10)$/gm,
    sizeRegex: /([0-9]?[0-9]?[0-9].[0-9]?[0-9]\s?(GB|MB))|([0-9]?[0-9]\s?(GB|MB))/gm,
    durationRegex: /([0-9]hr\s?[0-5]?[0-9]\s?min)/gm,
    descriptionRegex: /[0-9]\s?min\n?(.*)/gm,
    genreRegex: /Genre:\s?(\w*\s?\/\s?\w*)/gm,
    imageLinkRegex: /https:\/\/img.yts.mx\/assets\/images\/\w*\/.*?\/[^"]+"/gm
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
      ).replace(`<br /><br />`, "");
      const genre = execRegex(ytsRegex.genreRegex, item.content ?? "", 1);
      const imageLink = execRegex(
        ytsRegex.imageLinkRegex,
        item.content ?? "",
        0
      ).replace(`"`, "");
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
        link
      });
    }
    console.log(movies, "ytsRss");
  } catch (error) {
    console.log(error, "ytsRss");
  }
}
function execRegex(regex, value, index) {
  const valueRegex = new RegExp(regex);
  const challenge = valueRegex.exec(value);
  if (challenge === null || challenge[index] === `<br /><br />`)
    return "Not Found";
  return challenge[index];
}

// src/index.ts
var coolGradient = gradient([
  { color: "#FA8BFF", pos: 0 },
  { color: "#2BD2FF", pos: 0.5 },
  { color: "#2BFF88", pos: 1 }
]);
console.log(
  coolGradient(String.raw` 
 __   __     ______     _____     ______       __     ______        ______     __         __   
/\ "-.\ \   /\  __ \   /\  __-.  /\  ___\     /\ \   /\  ___\      /\  ___\   /\ \       /\ \  
\ \ \-.  \  \ \ \/\ \  \ \ \/\ \ \ \  __\    _\_\ \  \ \___  \     \ \ \____  \ \ \____  \ \ \ 
 \ \_\\"\_\  \ \_____\  \ \____-  \ \_____\ /\_____\  \/\_____\     \ \_____\  \ \_____\  \ \_\
  \/_/ \/_/   \/_____/   \/____/   \/_____/ \/_____/   \/_____/      \/_____/   \/_____/   \/_/
                                                                                               
`)
);
if (CONSTANTS.isDev) {
  testCliArgsInput('test --name="John Doe" --age="30" arg1 arg2 arg3');
}
ytsRss();
//# sourceMappingURL=index.js.map
