import { execSync } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import * as p from "@clack/prompts";
import { render } from "ejs";

const templatesDir = resolve(import.meta.dirname, "../templates");
const templateDirs = (await readdir(templatesDir)).filter((name) => name !== "shared");

const { projectName, templateType } = await p.group({
    projectName: () => p.text({
        message: "Project name:"
    }),
    templateType: () => p.select({
        message: "Template type:",
        options: templateDirs.map((dir) => ({ value: dir }))
    })
}, {
    onCancel() {
        p.cancel();
        process.exit(0);
    }
});

const sharedDir = join(templatesDir, "shared");
const templateDir = join(templatesDir, templateType);
const baseDir = resolve(process.cwd(), projectName);
const pnpmVersion = getPnpmVersion();

const data = {
    projectName,
    pnpmVersion
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
        p.log.error("Could not detect pnpm.");
        p.outro();
        process.exit(0);
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