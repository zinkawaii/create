import { execSync } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import * as p from "@clack/prompts";
import * as packageJson from "../package.json";

const templatesDir = resolve(import.meta.dirname, "../templates");
const templateDirs = (await readdir(templatesDir)).filter((name) => name !== "shared");

const { templateType, projectName, author } = await p.group({
    templateType: () => p.select({
        message: "Template type:",
        options: templateDirs.map((dir) => ({ value: dir })),
    }),
    projectName: () => p.text({
        message: "Project name:",
    }),
    author: () => p.text({
        message: "Author name:",
        defaultValue: packageJson.author,
    }),
}, {
    onCancel() {
        p.cancel();
        process.exit(0);
    },
});

const sharedDir = join(templatesDir, "shared");
const templateDir = join(templatesDir, templateType);
const baseDir = resolve(process.cwd(), projectName);
const pnpmVersion = getPnpmVersion();

const data = {
    author,
    projectName,
    pnpmVersion,
};

if (await checkDirectory(baseDir)) {
    await mkdir(baseDir);
    await generateFiles(sharedDir, baseDir);
    await generateFiles(templateDir, baseDir);
}
p.outro();

function getPnpmVersion() {
    try {
        return execSync("pnpm -v").toString().trim();
    }
    catch {
        return packageJson.packageManager.split("@")[1];
    }
}

async function checkDirectory(path: string) {
    try {
        const stats = await stat(path);
        if (!stats.isDirectory()) {
            p.log.error(`Path "${baseDir}" is not a directory.`);
            return false;
        }
        const files = await readdir(path);
        if (files.length) {
            p.log.error(`Folder "${baseDir}" is not empty.`);
            return false;
        }
    }
    catch {}
    return true;
}

async function generateFiles(sourceDir: string, targetDir: string) {
    const names = await readdir(sourceDir);

    await Promise.all(names.map(async (name) => {
        const sourcePath = join(sourceDir, name);
        const targetPath = join(targetDir, name);

        const stats = await stat(sourcePath);
        if (stats.isDirectory()) {
            await mkdir(targetPath);
            await generateFiles(sourcePath, targetPath);
            return;
        }

        const file = await readFile(sourcePath, "utf-8");
        const result = interpolate(file, data);
        await writeFile(targetPath, result);
    }));
}

function interpolate(template: string, data: Record<string, any>) {
    return template.replace(/\{\{(.*?)\}\}/g, (match, ...args) => {
        const name = args[0].trim();
        return data[name] ?? match;
    });
}
