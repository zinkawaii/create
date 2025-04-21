import { execSync } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { input, select } from "@inquirer/prompts";
import consola from "consola";
import { render } from "ejs";

const templatesDir = resolve(import.meta.dirname, "../templates");
const templateDirs = (await readdir(templatesDir)).filter((name) => name !== "shared");

const projectName = await input({
    message: "Project name:"
});

const templateType = await select<string>({
    message: "Select a template:",
    choices: templateDirs
});

const sharedDir = join(templatesDir, "shared");
const templateDir = join(templatesDir, templateType);
const baseDir = resolve(process.cwd(), projectName);
const pnpmVersion = getPnpmVersion();

const data = {
    projectName,
    pnpmVersion
};

try {
    await stat(baseDir);
    consola.error(`Folder "${baseDir}" exists.`);
}
catch {
    await mkdir(baseDir);
    await generateFiles(sharedDir, baseDir);
    await generateFiles(templateDir, baseDir);
}

async function generateFiles(sourceDir: string, targetDir: string) {
    const names = await readdir(sourceDir);
    for (const name of names) {
        const sourcePath = join(sourceDir, name);
        const targetPath = join(targetDir, name);

        const stats = await stat(sourcePath);
        if (stats.isDirectory()) {
            await mkdir(targetPath);
            await generateFiles(sourcePath, targetPath);
            continue;
        }

        const file = await readFile(sourcePath);
        const result = render(file.toString(), data);
        await writeFile(targetPath, result);
    }
}

function getPnpmVersion() {
    try {
        return execSync("pnpm -v").toString().trim();
    }
    catch {
        throw new Error("Could not detect pnpm.");
    }
}