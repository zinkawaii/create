import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { input, select } from "@inquirer/prompts";
import consola from "consola";
import { render } from "ejs";

const baseDir = resolve(import.meta.dirname, "../templates");

const projectName = await input({
    message: "Project name:"
});

const templateType = await select<string>({
    message: "Select a template:",
    choices: await readdir(baseDir)
});

const templateDir = join(baseDir, templateType);
const folder = resolve(process.cwd(), projectName);

try {
    await stat(folder);
    consola.error(`Folder "${folder}" exists.`);
}
catch {
    await mkdir(folder);
    await generateFiles(templateDir);
}

async function generateFiles(dir: string) {
    const names = await readdir(dir);
    for (const name of names) {
        const path = join(dir, name);
        const relativePath = relative(templateDir, path);
        const outputPath = join(folder, relativePath);

        const stats = await stat(path);
        if (stats.isDirectory()) {
            await mkdir(outputPath);
            await generateFiles(path);
            continue;
        }

        const file = await readFile(path);
        const result = render(file.toString(), {
            projectName
        });

        await writeFile(outputPath, result);
    }
}