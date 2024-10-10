import fs from 'fs/promises';
import path from 'path';
import gulp from 'gulp';
import ts from 'gulp-typescript';
import {rollup} from 'rollup';
import terser from '@rollup/plugin-terser';

const concatenateScripts = true;
const minifyScripts = false;
const tsBuildDir = 'build';
const srcSuiteAppDir = path.join('src', 'SuiteApps');
const buildSuiteAppDir = path.join(tsBuildDir, 'src', 'SuiteApps');
const fileCabinetSuiteAppDir = path.join('src', 'FileCabinet', 'SuiteApps');
const rollupTerserPlugin = terser();

export const clean = gulp.series(cleanBuild, cleanBundles);
export const build = gulp.series(cleanBuild, compileTs);
export const bundle = gulp.series(build, cleanBundles, bundleScripts, bundleAssets);

function compileTs() {
  const tsProject = ts.createProject('tsconfig.json');
  return tsProject.src().pipe(tsProject()).pipe(gulp.dest(tsBuildDir));
}

async function bundleScripts() {
  const spaRoots = await findSpaRoots();

  for (const root of spaRoots) {
    const entryPoints = await findEntryPoints(root);

    for (const input of entryPoints) {
      const scriptType = input.metadata.match(scriptTypeRegex)[0];
      const result = await rollup({
        input: path.resolve(input.filePath),
        external: ['@uif-js/core', '@uif-js/core/jsx-runtime', '@uif-js/component', /^N$/, /^N\//],
        plugins: [rollupScriptTypePlugin()]
      });

      await result.write(rollupOutputConfig(input.filePath));

      if (scriptType.length > 0 && !scriptType.includes('SpaClient')) {
        await appendScriptType(input);
      }
    }
  }
}

async function bundleAssets() {
  await visitDir(srcSuiteAppDir, async (filePath) => {
    if (isSourceFile(filePath)) {
      return;
    }

    const targetPath = path.join(fileCabinetSuiteAppDir, path.relative(srcSuiteAppDir, filePath));
    await fs.mkdir(path.dirname(targetPath), {recursive: true});
    await fs.copyFile(filePath, targetPath);
  });
}

async function cleanBuild() {
  await cleanDir(tsBuildDir);
}

async function cleanBundles() {
  const entryPoints = await findEntryPoints(tsBuildDir);

  for (const entry of entryPoints) {
    if (entry.metadata.includes('SpaServer')) {
      await cleanDir(path.dirname(getOutputFile(entry.filePath)));
    }
  }
}

async function findEntryPoints(dir) {
  const result = [];

  if (!(await exists(dir))) {
    return result;
  }

  await visitDir(dir, async (filePath) => {
    const entryPoint = await checkEntryPoint(filePath);

    if (entryPoint) {
      result.push(entryPoint);
    }
  });

  return result;
}

function isSourceFile(filePath) {
  return ['.js', '.jsx', '.ts', '.tsx'].some((ext) => filePath.endsWith(ext));
}

async function checkEntryPoint(filePath) {
  if (filePath.endsWith('SpaClient.js')) {
    return {filePath, metadata: '@NScriptType SpaClient'};
  }

  const content = (await fs.readFile(filePath)).toString();
  const array = content.match(scriptMetadataRegex);
  return array ? {filePath, metadata: array[0]} : null;
}

function rollupOutputConfig(input) {
  const common = {
    format: 'amd',
    plugins: minifyScripts ? [rollupTerserPlugin] : []
  };

  if (concatenateScripts) {
    return {
      file: getOutputFile(input),
      ...common
    };
  }

  return {
    dir: fileCabinetSuiteAppDir,
    preserveModules: true,
    preserveModulesRoot: buildSuiteAppDir,
    ...common
  };
}

function getOutputFile(input) {
  return path.join(fileCabinetSuiteAppDir, path.relative(buildSuiteAppDir, input));
}

async function appendScriptType(input) {
  const outputFile = getOutputFile(input.filePath);
  const content = (await fs.readFile(outputFile)).toString();
  await fs.writeFile(outputFile, `${input.metadata}\n${content}`);
}

async function cleanDir(dirPath) {
  await fs.rm(dirPath, {recursive: true, force: true});
}

async function visitDir(dirPath, processFile) {
  if (!(await exists(dirPath))) {
    return;
  }

  for (const entryName of await fs.readdir(dirPath)) {
    const entryPath = path.join(dirPath, entryName);

    if ((await fs.lstat(entryPath)).isFile()) {
      await processFile(entryPath);
    } else {
      await visitDir(entryPath, processFile);
    }
  }
}

async function findSpaRoots() {
  const roots = [];
  await visitDir(tsBuildDir, async (filePath) => {
    const entryPoint = await checkEntryPoint(filePath);

    if (entryPoint && entryPoint.metadata.includes('SpaServer')) {
      roots.push(path.dirname(entryPoint.filePath));
    }
  });

  return roots;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function rollupScriptTypePlugin() {
  return {
    transform: (code) => code.replace(scriptMetadataRegex, '')
  };
}

const scriptMetadataRegex = /\/\*\*[\s\S]*?NScriptType[\s\S]*?\*\//gm;
const scriptTypeRegex = /(?<=@NScriptType )\w+/gm;

